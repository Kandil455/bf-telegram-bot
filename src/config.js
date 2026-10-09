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
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

export const GROQ_DEFAULT_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

export const OPENROUTER_DEFAULT_MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "inclusionai/ling-3.0-flash-sante:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
];

function parseKeyList(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
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

// Strictly enforce: ONLY Gemini 3+ models (reject any 1.x, 2.x, 2.5)
function sanitizeGeminiModels(models) {
  const filtered = models.filter((m) => !/gemini-[12](?:\.|\b|-)/i.test(m));
  return filtered.length ? filtered : GEMINI_DEFAULT_MODELS;
}

export function loadConfig(env = process.env) {
  const need = (key) => {
    const v = String(env[key] || "").trim();
    if (!v) throw new ConfigError(`${key} is required. See .env.example.`);
    return v;
  };
  const positive = (key, fallback) => {
    const n = Number(env[key]);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const mode = String(env.BOT_MODE || "polling").toLowerCase();
  if (!["polling", "webhook"].includes(mode)) throw new ConfigError("BOT_MODE must be 'polling' or 'webhook'.");

  const cfg = {
    mode,
    botToken: need("TELEGRAM_BOT_TOKEN"),
    port: positive("PORT", 8080),
    adminIds: new Set(
      String(env.ADMIN_TELEGRAM_IDS || "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
    freeDailyTasks: positive("FREE_DAILY_TASKS", 10),
    maxFileMb: positive("MAX_FILE_MB", 20),
    maxTextChars: positive("MAX_TEXT_CHARS", 250000),
    dataDir: env.DATA_DIR === undefined ? "./data" : env.DATA_DIR,
    premiumEmoji: parsePremiumMap(env.PREMIUM_EMOJI_JSON || ""),
    premiumEmojiSet: String(env.PREMIUM_EMOJI_SET || "").trim(),
    gemini: {
      fast: splitModels(env.GEMINI_MODEL_FAST),
      quality: splitModels(env.GEMINI_MODEL_QUALITY),
      keys: parseKeyList(env.GEMINI_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: sanitizeGeminiModels(parseModelList(env.GEMINI_MODELS || env.GEMINI_MODEL, GEMINI_DEFAULT_MODELS)),
      get model() { return this.models[0] || "gemini-3.5-flash"; },
    },
    groq: {
      keys: parseKeyList(env.GROQ_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: parseModelList(env.GROQ_MODELS || env.GROQ_MODEL, GROQ_DEFAULT_MODELS),
      get model() { return this.models[0] || "qwen/qwen3.8-27b"; },
    },
    openrouter: {
      keys: parseKeyList(env.OPENROUTER_API_KEY),
      get key() { return this.keys[0] || ""; },
      models: parseModelList(env.OPENROUTER_MODELS || env.OPENROUTER_MODEL, OPENROUTER_DEFAULT_MODELS),
      get model() { return this.models[0] || "nvidia/nemotron-3.5-lightning:free"; },
    },
    proDailyTasks: positive("PRO_DAILY_TASKS", 120),
    proStars: positive("PRO_STARS", 150),
    tzOffset: Number(env.TZ_OFFSET_HOURS || 0) || 0,
    adminToken: String(env.ADMIN_TOKEN || "").trim(),
    redisUrl: String(env.REDIS_URL || "").trim(),
    botUsername: "",
    apiRoot: String(env.TELEGRAM_API_ROOT || "").trim() || null,
    proEgp: positive("PRO_EGP", 100),
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
    proFilesPerDay: positive("PRO_FILES_PER_DAY", 10),
    maxQuestionsPerFile: positive("MAX_QUESTIONS_PER_FILE", 30),
    maxImagesPerFile: positive("MAX_IMAGES_PER_FILE", 40),
    imageReview: String(env.IMAGE_REVIEW || "on").toLowerCase() !== "off",
    pdfimagesBin: String(env.PDFIMAGES_BIN || "pdfimages").trim(),
    chromePath: String(env.CHROME_PATH || "").trim() || null,
    appUrl: String(env.APP_URL || "").trim().replace(/\/$/, ""),
    requiredChannel: String(env.REQUIRED_CHANNEL || "").trim() || null,
    channelInviteLink: String(env.CHANNEL_INVITE_LINK || "").trim() || null,
    referralBonusFiles: positive("REFERRAL_BONUS_FILES", 1),
  };

  if (!cfg.gemini.key && !cfg.groq.key && !cfg.openrouter.key) {
    throw new ConfigError("Set at least one AI key: GEMINI_API_KEY, GROQ_API_KEY or OPENROUTER_API_KEY.");
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
