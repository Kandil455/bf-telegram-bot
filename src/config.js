// Reads and validates the environment once, at startup. Fails fast with a clear message.

import { parsePremiumMap } from "./core/icons.js";

function compile(src) {
  if (!src) return null;
  try {
    return new RegExp(src, "i");
  } catch {
    throw new ConfigError("CASH_TX_REGEX / CASH_AMOUNT_REGEX must be valid regular expressions with one capture group.");
  }
}

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

export const GEMINI_DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
];

export const GROQ_DEFAULT_MODELS = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "llama-3.1-8b-instant",
];

export const OPENROUTER_DEFAULT_MODELS = [
  "deepseek/deepseek-chat:free",
  "deepseek/deepseek-r1:free",
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export const DEEPSEEK_DEFAULT_MODELS = [
  "deepseek-flash",
];

export const ZAI_DEFAULT_MODELS = [
  "glm-4.7-flash",
];

export const APMIX_DEFAULT_MODELS = [
  "claude-sonnet-4-6-free",
  "space-bunny-free",
];

function parseKeyList(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;\s]+/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((k) => k && !k.startsWith("AQ."));
}

function splitModels(raw) {
  return String(raw || "").split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
}

function parseModelList(raw, defaults) {
  if (!raw) return defaults;
  const list = String(raw)
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : defaults;
}

// Filter out non-existent/deprecated model names that cause HTTP 404
function sanitizeGeminiModels(models) {
  const filtered = models.filter((m) => !/gemini-1(?:\.|\b|-)|gemini-4\.1|gemini-3\.[58]/i.test(m));
  return filtered.length ? filtered : GEMINI_DEFAULT_MODELS;
}

function sanitizeDeepseekModels(models) {
  // DeepSeek-V4.1-Flash-1017 is served under "deepseek-flash" on api.deepseek.com
  return ["deepseek-flash"];
}

export function loadConfig(env = process.env) {
  const need = (...keys) => {
    for (const key of keys) {
      const v = String(env[key] || "").trim();
      if (v) return v;
    }
    throw new ConfigError(`${keys[0]} is required. See .env.example.`);
  };
  const positive = (key, fallback) => {
    const n = Number(env[key]);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const mode = String(env.BOT_MODE || "polling").toLowerCase();
  if (!["polling", "webhook"].includes(mode)) throw new ConfigError("BOT_MODE must be 'polling' or 'webhook'.");

  const cfg = {
    mode,
    botToken: need("TELEGRAM_BOT_TOKEN", "BOT_TOKEN"),
    port: positive("PORT", 8080),
    adminIds: new Set(
      String(env.ADMIN_TELEGRAM_IDS || env.ADMIN_IDS || "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
    freeDailyTasks: positive("FREE_DAILY_TASKS", 6),
    freeDailyTokens: positive("FREE_DAILY_TOKENS", 35000),
    proDailyTokens: positive("PRO_DAILY_TOKENS", 250000),
    maxFileMb: positive("MAX_FILE_MB", 20),
    maxTextChars: positive("MAX_TEXT_CHARS", 250000),
    dataDir: env.DATA_DIR === undefined ? "./data" : env.DATA_DIR,
    premiumEmoji: parsePremiumMap(env.PREMIUM_EMOJI_JSON || ""),
    premiumEmojiSet: String(env.PREMIUM_EMOJI_SET || "").trim(),
    deepseek: {
      keys: parseKeyList(env.DEEPSEEK_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: sanitizeDeepseekModels(parseModelList(env.DEEPSEEK_MODELS || env.DEEPSEEK_MODEL, DEEPSEEK_DEFAULT_MODELS)),
      get model() { return this.models[0] || "deepseek-flash"; },
    },
    zai: {
      keys: parseKeyList(env.ZAI_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: parseModelList(env.ZAI_MODELS || env.ZAI_MODEL, ZAI_DEFAULT_MODELS),
      get model() { return this.models[0] || "glm-4.7-flash"; },
    },
    gemini: {
      fast: sanitizeGeminiModels(splitModels(env.GEMINI_MODEL_FAST)),
      quality: sanitizeGeminiModels(splitModels(env.GEMINI_MODEL_QUALITY)),
      keys: parseKeyList([env.GEMINI_API_KEY, env.GEMINI_BACKUP_KEYS].filter(Boolean).join(",")),
      get key() { return this.keys[0] || ""; },
      models: sanitizeGeminiModels(parseModelList(env.GEMINI_MODELS || env.GEMINI_MODEL, GEMINI_DEFAULT_MODELS)),
      get model() { return this.models[0] || "gemini-2.5-flash"; },
    },
    groq: {
      keys: parseKeyList(env.GROQ_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: parseModelList(env.GROQ_MODELS || env.GROQ_MODEL, GROQ_DEFAULT_MODELS),
      get model() { return this.models[0] || "llama-3.3-70b-versatile"; },
    },
    apmix: {
      keys: parseKeyList(env.APMIX_KEY || env.APMIX_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: parseModelList(env.APMIX_MODELS || env.APMIX_MODEL, APMIX_DEFAULT_MODELS),
      get model() { return this.models[0] || "claude-sonnet-4-6-free"; },
    },
    openrouter: {
      keys: parseKeyList(env.OPENROUTER_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: parseModelList(env.OPENROUTER_MODELS || env.OPENROUTER_MODEL, OPENROUTER_DEFAULT_MODELS),
      get model() { return this.models[0] || "deepseek/deepseek-chat:free"; },
    },
    tokenharbor: {
      keys: parseKeyList(env.TOKENHARBOR_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: parseModelList(env.TOKENHARBOR_MODELS || env.TOKENHARBOR_MODEL, ["claude-haiku-5.5:free"]),
      get model() { return this.models[0] || "claude-haiku-5.5:free"; },
    },
    proDailyTasks: positive("PRO_DAILY_TASKS", 40),
    proStars: positive("PRO_STARS", 100),
    tzOffset: Number(env.TZ_OFFSET_HOURS || 0) || 0,
    adminToken: String(env.ADMIN_TOKEN || "").trim(),
    adminPublicUrl: String(env.ADMIN_PUBLIC_URL || "").trim(),
    redisUrl: String(env.REDIS_URL || "").trim(),
    botUsername: "",
    apiRoot: String(env.TELEGRAM_API_ROOT || "").trim() || null,
    proEgp: positive("PRO_EGP", 75),
    cashNumber: String(env.CASH_NUMBER || "").trim(),
    cashSecret: String(env.CASH_SMS_SECRET || "").trim(),
    cashTx: compile(env.CASH_TX_REGEX),
    cashAmount: compile(env.CASH_AMOUNT_REGEX),
    cashSenders: String(env.CASH_SMS_SENDERS || "").split(",").map((s) => s.trim()).filter(Boolean),
    freeFilesPerDay: positive("FREE_FILES_PER_DAY", 2),
    throttleMs: Number(env.THROTTLE_MS ?? 1500) || 0,
    enforceLimitsForAdmins: String(env.ENFORCE_LIMITS_FOR_ADMINS || "off").toLowerCase() === "on",
    requirePhone: String(env.REQUIRE_PHONE || "on").toLowerCase() !== "off",
    quizVerify: String(env.QUIZ_VERIFY || "on").toLowerCase() !== "off",
    proFilesPerDay: positive("PRO_FILES_PER_DAY", 8),
    maxQuestionsPerFile: Math.min(50, positive("MAX_QUESTIONS_PER_FILE", 50)),
    maxImagesPerFile: positive("MAX_IMAGES_PER_FILE", 40),
    imageReview: String(env.IMAGE_REVIEW || "on").toLowerCase() !== "off",
    pdfimagesBin: String(env.PDFIMAGES_BIN || "pdfimages").trim(),
    chromePath: String(env.CHROME_PATH || "").trim() || null,
    appUrl: String(env.APP_URL || "").trim().replace(/\/$/, ""),
    requiredChannel: String(env.REQUIRED_CHANNEL || "").trim() || null,
    channelInviteLink: String(env.CHANNEL_INVITE_LINK || "").trim() || null,
    referralBonusFiles: positive("REFERRAL_BONUS_FILES", 1),
  };

  if (!cfg.deepseek?.key && !cfg.zai?.key && !cfg.gemini.key && !cfg.groq.key && !cfg.apmix?.key && !cfg.openrouter.key) {
    throw new ConfigError("Set at least one AI key: DEEPSEEK_API_KEY, GEMINI_API_KEY, GROQ_API_KEY or OPENROUTER_API_KEY.");
  }

  if (mode === "webhook") {
    cfg.publicUrl = need("PUBLIC_URL");
    cfg.webhookSecret = need("TELEGRAM_WEBHOOK_SECRET");
    if (!cfg.appUrl) cfg.appUrl = new URL(cfg.publicUrl).origin;
    if (!/^https:\/\//.test(cfg.publicUrl)) throw new ConfigError("PUBLIC_URL must be an https:// URL.");
    if (cfg.webhookSecret.length < 16) throw new ConfigError("TELEGRAM_WEBHOOK_SECRET should be at least 16 characters.");
  }

  return cfg;
}
