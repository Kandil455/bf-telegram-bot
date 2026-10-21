import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  EMERGENCY_QUIZ_TITLE,
  EMERGENCY_QUIZ_CATEGORIES,
  EMERGENCY_QUIZ_PARTS,
  EMERGENCY_QUIZ_ITEMS,
  getEmergencyQuizPart
} from "../src/data/emergency-quiz.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = "/Users/ibrahimkandil/Desktop/كويزات_الطوارئ_التفاعلية_9_ملفات";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildQuizAppHtml({
  quizTitle,
  quizTitleAr,
  partId,
  items,
  totalParts = 9,
  isAll = false
}) {
  const serializedItems = JSON.stringify(
    items.map((it, idx) => ({
      id: it.id,
      index: idx + 1,
      q: it.q,
      options: it.options,
      answer: it.answer,
      explanation: it.explanation || "",
      category: it.category || "",
      imageBase64: it.imageBase64 || null,
      imageName: it.imageName || null
    }))
  );

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(quizTitle)} - كويز تفاعلي شامل</title>
  <style>
    :root {
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Tajawal", "Inter", sans-serif;
      --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 18px;
      --radius-xl: 24px;
    }

    [data-theme="dark"] {
      --bg-base: #090d16;
      --bg-surface: #111827;
      --bg-card: #182236;
      --bg-card-hover: #1f2c45;
      --border: #243452;
      --border-focus: #38bdf8;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-sub: #64748b;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.18);
      --accent-hover: #0ea5e9;
      --correct-bg: #064e3b;
      --correct-border: #10b981;
      --correct-text: #a7f3d0;
      --wrong-bg: #7f1d1d;
      --wrong-border: #ef4444;
      --wrong-text: #fecaca;
      --warning: #f59e0b;
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }

    [data-theme="light"] {
      --bg-base: #f8fafc;
      --bg-surface: #ffffff;
      --bg-card: #ffffff;
      --bg-card-hover: #f1f5f9;
      --border: #e2e8f0;
      --border-focus: #0284c7;
      --text-main: #0f172a;
      --text-muted: #475569;
      --text-sub: #94a3b8;
      --accent: #0284c7;
      --accent-glow: rgba(2, 132, 199, 0.12);
      --accent-hover: #0369a1;
      --correct-bg: #ecfdf5;
      --correct-border: #10b981;
      --correct-text: #065f46;
      --wrong-bg: #fef2f2;
      --wrong-border: #ef4444;
      --wrong-text: #991b1b;
      --warning: #d97706;
      --shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: var(--font-family);
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: background-color 0.3s ease, color 0.3s ease;
      line-height: 1.6;
    }

    header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .header-inner {
      max-width: 1000px;
      margin: 0 auto;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .home-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      font-weight: 700;
      font-size: 13.5px;
      transition: var(--transition);
    }
    .home-link:hover {
      background: var(--bg-card-hover);
      border-color: var(--accent);
      color: var(--accent);
    }

    .quiz-title-group h1 {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .quiz-title-group p {
      font-size: 12px;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-icon {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 13.5px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition);
    }
    .btn-icon:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-focus);
    }
    .btn-icon.active {
      background: var(--accent-glow);
      border-color: var(--accent);
      color: var(--accent);
    }
    .btn-icon.danger-active {
      background: rgba(239, 68, 68, 0.15);
      border-color: var(--wrong-border);
      color: var(--wrong-border);
    }

    /* Top Stats & Timer bar */
    .status-bar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      padding: 8px 16px;
    }
    .status-inner {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 13.5px;
    }
    .stats-badges {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 12px;
    }
    .badge-correct { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .badge-wrong { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .badge-score { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .badge-flag { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

    .timer-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      color: var(--accent);
    }
    .timer-badge.warning {
      color: #ef4444;
      border-color: #ef4444;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Progress bar */
    .progress-track {
      width: 100%;
      height: 4px;
      background: var(--border);
      position: relative;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #10b981);
      width: 0%;
      transition: width 0.3s ease;
    }

    /* Main Container */
    main {
      flex: 1;
      max-width: 900px;
      width: 100%;
      margin: 20px auto 100px;
      padding: 0 16px;
    }

    /* Question Card */
    .question-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 24px;
      position: relative;
      transition: var(--transition);
    }

    .q-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .q-number {
      font-size: 14px;
      font-weight: 800;
      color: var(--accent);
      background: var(--accent-glow);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }
    .q-category {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .btn-flag {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: var(--text-sub);
      transition: var(--transition);
      padding: 4px;
      border-radius: 4px;
    }
    .btn-flag:hover {
      color: var(--warning);
      transform: scale(1.15);
    }
    .btn-flag.flagged {
      color: var(--warning);
    }

    .q-text {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.5;
      margin-bottom: 20px;
      direction: ltr;
      text-align: left;
    }

    /* Image Attachment */
    .q-image-box {
      margin: 16px 0 24px;
      text-align: center;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px;
      position: relative;
      cursor: zoom-in;
      transition: var(--transition);
    }
    .q-image-box:hover {
      border-color: var(--accent);
    }
    .q-image-box img {
      max-width: 100%;
      max-height: 380px;
      border-radius: var(--radius-sm);
      object-fit: contain;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .q-image-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--accent);
      font-weight: 700;
    }

    /* Options List */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      direction: ltr;
      text-align: left;
    }

    .option-btn {
      background: var(--bg-surface);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      cursor: pointer;
      transition: var(--transition);
      color: var(--text-main);
      font-size: 16px;
      font-weight: 500;
      position: relative;
      text-align: left;
      width: 100%;
    }
    .option-btn:hover:not(:disabled) {
      background: var(--bg-card-hover);
      border-color: var(--accent);
      transform: translateY(-1px);
    }
    .option-letter {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--accent);
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: -1px;
    }
    .option-text {
      flex: 1;
      line-height: 1.4;
    }

    /* Option States */
    .option-btn.selected {
      border-color: var(--accent);
      background: var(--accent-glow);
    }
    .option-btn.correct {
      background: var(--correct-bg) !important;
      border-color: var(--correct-border) !important;
      color: var(--correct-text) !important;
      font-weight: 700;
    }
    .option-btn.correct .option-letter {
      background: var(--correct-border);
      color: #ffffff;
      border-color: var(--correct-border);
    }
    .option-btn.wrong {
      background: var(--wrong-bg) !important;
      border-color: var(--wrong-border) !important;
      color: var(--wrong-text) !important;
      font-weight: 700;
    }
    .option-btn.wrong .option-letter {
      background: var(--wrong-border);
      color: #ffffff;
      border-color: var(--wrong-border);
    }

    /* Explanation Box */
    .explanation-box {
      margin-top: 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: none;
      animation: fadeIn 0.3s ease;
      direction: ltr;
      text-align: left;
    }
    .explanation-box.visible {
      display: block;
    }
    .exp-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--accent);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .exp-body {
      font-size: 14.5px;
      color: var(--text-muted);
      line-height: 1.55;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Bottom Control Bar */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      padding: 12px 16px;
      z-index: 40;
      backdrop-filter: blur(12px);
      box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
    }
    .bottom-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .btn-nav {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: var(--transition);
    }
    .btn-nav:hover:not(:disabled) {
      background: var(--bg-card-hover);
      border-color: var(--accent);
      color: var(--accent);
    }
    .btn-nav:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .btn-nav.primary {
      background: var(--accent);
      color: #0b1120;
      border-color: var(--accent);
    }
    .btn-nav.primary:hover {
      background: var(--accent-hover);
      color: #ffffff;
    }

    /* Question Drawer / Palette Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(4px);
    }
    .modal-overlay.active {
      display: flex;
    }
    .modal-content {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      max-width: 700px;
      width: 100%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow);
      animation: modalZoom 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalZoom {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header h3 {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-main);
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--text-muted);
    }
    .modal-close:hover { color: var(--text-main); }
    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }

    .palette-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
      gap: 10px;
    }
    .palette-item {
      height: 44px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-main);
      font-weight: 800;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      position: relative;
    }
    .palette-item:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .palette-item.active {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .palette-item.correct {
      background: var(--correct-bg);
      border-color: var(--correct-border);
      color: var(--correct-text);
    }
    .palette-item.wrong {
      background: var(--wrong-bg);
      border-color: var(--wrong-border);
      color: var(--wrong-text);
    }
    .palette-item.flagged::after {
      content: "★";
      position: absolute;
      top: 1px;
      right: 3px;
      color: var(--warning);
      font-size: 10px;
    }

    /* Lightbox Modal */
    .lightbox-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.92);
      z-index: 150;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      cursor: zoom-out;
    }
    .lightbox-overlay.active {
      display: flex;
    }
    .lightbox-img {
      max-width: 95vw;
      max-height: 90vh;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      object-fit: contain;
    }

    /* Result Modal */
    .score-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: conic-gradient(var(--accent) 0%, var(--border) 0%);
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .score-circle-inner {
      width: 114px;
      height: 114px;
      border-radius: 50%;
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .score-val {
      font-size: 32px;
      font-weight: 900;
      color: var(--accent);
      line-height: 1;
    }
    .score-lbl {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .modal-actions button {
      flex: 1;
      min-width: 140px;
    }

    /* Filter banner */
    .filter-banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid var(--wrong-border);
      border-radius: var(--radius-md);
      padding: 10px 16px;
      margin-bottom: 16px;
      display: none;
      align-items: center;
      justify-content: space-between;
      color: var(--wrong-text);
      font-weight: 700;
      font-size: 13.5px;
    }
    .filter-banner.active {
      display: flex;
    }

    @media (max-width: 640px) {
      .header-inner { flex-direction: column; align-items: stretch; }
      .header-actions { justify-content: space-between; }
      .q-text { font-size: 16px; }
      .option-btn { font-size: 14.5px; padding: 12px 14px; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="header-inner">
      <div class="header-left">
        <a href="index.html" class="home-link">
          <span>🏠</span>
          <span>فهرس الكويزات</span>
        </a>
        <div class="quiz-title-group">
          <h1>${escapeHtml(quizTitleAr)}</h1>
          <p>${escapeHtml(quizTitle)} (${items.length} سؤال)</p>
        </div>
      </div>
      <div class="header-actions">
        <button id="themeToggleBtn" class="btn-icon" title="تبديل الوضع (داكن / فاتح)">
          <span id="themeIcon">☀️</span>
          <span id="themeLabel">فاتح</span>
        </button>
        <button id="timerModalBtn" class="btn-icon" title="إعدادات المؤقت">
          <span>⏱️</span>
          <span id="timerBtnText">مؤقت</span>
        </button>
        <button id="filterMistakesBtn" class="btn-icon" title="مراجعة الأخطاء فقط">
          <span>❌</span>
          <span>الأخطاء (<span id="mistakesCount">0</span>)</span>
        </button>
        <button id="paletteBtn" class="btn-icon" title="لوحة الأسئلة">
          <span>📑</span>
          <span>الأسئلة</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Progress & Stats Bar -->
  <div class="status-bar">
    <div class="status-inner">
      <div class="stats-badges">
        <span class="badge badge-correct">✅ صح: <span id="statCorrect">0</span></span>
        <span class="badge badge-wrong">❌ خطأ: <span id="statWrong">0</span></span>
        <span class="badge badge-score">🎯 النسبة: <span id="statPercent">0%</span></span>
        <span class="badge badge-flag">⭐ معلم: <span id="statFlagged">0</span></span>
      </div>
      <div id="timerContainer" style="display:flex; align-items:center; gap:8px;">
        <span id="timerBadge" class="timer-badge">⏱️ بدون مؤقت</span>
        <button id="timerControlBtn" class="btn-icon" style="padding:4px 8px; font-size:11px; display:none;">إيقاف</button>
      </div>
    </div>
  </div>
  <div class="progress-track">
    <div id="progressFill" class="progress-fill"></div>
  </div>

  <!-- Main Question Area -->
  <main>
    <!-- Filter Active Banner -->
    <div id="filterBanner" class="filter-banner">
      <span>🚨 وضع مراجعة الأخطاء فقط مفعّل حالياً!</span>
      <button id="exitFilterBtn" class="btn-icon" style="padding:4px 8px; font-size:12px;">إلغاء التصفية وعرض الكل</button>
    </div>

    <div class="question-card">
      <div class="q-meta">
        <div style="display:flex; align-items:center; gap:8px;">
          <span id="qNumber" class="q-number">سؤال 1 من ${items.length}</span>
          <span id="qCategory" class="q-category"></span>
        </div>
        <button id="btnFlag" class="btn-flag" title="تعليم السؤال للمراجعة">⭐</button>
      </div>

      <div id="qText" class="q-text"></div>

      <!-- Image Area -->
      <div id="qImageBox" class="q-image-box" style="display:none;">
        <img id="qImage" src="" alt="Case Image">
        <div class="q-image-hint">🔍 اضغط على الصورة لتكبيرها وفحصها بدقة عالية</div>
      </div>

      <!-- Options -->
      <div id="optionsList" class="options-list"></div>

      <!-- Explanation Box -->
      <div id="explanationBox" class="explanation-box">
        <div class="exp-title">💡 التفسير الطبي المعتمد (Explanation):</div>
        <div id="expBody" class="exp-body"></div>
      </div>
    </div>
  </main>

  <!-- Bottom Navigation -->
  <div class="bottom-bar">
    <div class="bottom-inner">
      <button id="prevBtn" class="btn-nav">
        <span>➡️</span>
        <span>السابق</span>
      </button>

      <div style="display:flex; gap:8px;">
        <button id="retryCurrentBtn" class="btn-nav" style="display:none;">
          <span>🔄</span>
          <span>إعادة المحاولة</span>
        </button>
        <button id="finishBtn" class="btn-nav primary">
          <span>🏁</span>
          <span>إنهاء والنتيجة</span>
        </button>
      </div>

      <button id="nextBtn" class="btn-nav">
        <span>التالي</span>
        <span>⬅️</span>
      </button>
    </div>
  </div>

  <!-- Question Palette Modal -->
  <div id="paletteModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>📑 جدول الأسئلة والانتقال السريع</h3>
        <button class="modal-close" onclick="closeModal('paletteModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:flex; gap:12px; margin-bottom:14px; font-size:12.5px; flex-wrap:wrap;">
          <span><span style="display:inline-block; width:12px; height:12px; background:var(--correct-border); border-radius:3px;"></span> صح</span>
          <span><span style="display:inline-block; width:12px; height:12px; background:var(--wrong-border); border-radius:3px;"></span> خطأ</span>
          <span><span style="display:inline-block; width:12px; height:12px; background:var(--bg-card); border:1px solid var(--border); border-radius:3px;"></span> لم يُحل</span>
          <span>⭐ معلم</span>
        </div>
        <div id="paletteGrid" class="palette-grid"></div>
      </div>
    </div>
  </div>

  <!-- Timer Setup Modal -->
  <div id="timerModal" class="modal-overlay">
    <div class="modal-content" style="max-width:440px;">
      <div class="modal-header">
        <h3>⏱️ إعدادات المؤقت الزمني</h3>
        <button class="modal-close" onclick="closeModal('timerModal')">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:14px;">اختر نظام الوقت الذي تفضله أثناء التدريب:</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <button class="btn-nav" onclick="setTimerMode('none')">⏱️ بدون مؤقت (مذاكرة مفتوحة هادئة)</button>
          <button class="btn-nav" onclick="setTimerMode('q30')">⚡ 30 ثانية لكل سؤال (محاكاة التيليجرام)</button>
          <button class="btn-nav" onclick="setTimerMode('q45')">⚡ 45 ثانية لكل سؤال</button>
          <button class="btn-nav" onclick="setTimerMode('q60')">⚡ 60 ثانية لكل سؤال</button>
          <button class="btn-nav" onclick="setTimerMode('exam20')">⏳ امتحان 20 دقيقة للكل</button>
          <button class="btn-nav" onclick="setTimerMode('exam45')">⏳ امتحان 45 دقيقة للكل</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Results Modal -->
  <div id="resultsModal" class="modal-overlay">
    <div class="modal-content" style="max-width:480px; text-align:center;">
      <div class="modal-header">
        <h3>📊 نتيجة الاختبار</h3>
        <button class="modal-close" onclick="closeModal('resultsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div id="scoreCircle" class="score-circle">
          <div class="score-circle-inner">
            <span id="finalScoreVal" class="score-val">0%</span>
            <span class="score-lbl">النسبة المئوية</span>
          </div>
        </div>
        <h4 id="finalVerdict" style="font-size:18px; font-weight:800; margin-bottom:10px;"></h4>
        <p id="finalDetails" style="font-size:14px; color:var(--text-muted); margin-bottom:20px;"></p>

        <div class="modal-actions">
          <button id="modalReviewMistakesBtn" class="btn-nav danger-active" style="display:none;" onclick="reviewMistakesOnly()">
            <span>❌</span>
            <span>مراجعة الأخطاء فقط</span>
          </button>
          <button class="btn-nav" onclick="retakeFullQuiz()">
            <span>🔄</span>
            <span>إعادة الكويز كاملاً</span>
          </button>
          <a href="index.html" class="btn-nav primary" style="text-decoration:none; display:flex; justify-content:center;">
            <span>🏠</span>
            <span>فهرس الكويزات</span>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Image Lightbox Modal -->
  <div id="lightbox" class="lightbox-overlay" onclick="closeLightbox()">
    <img id="lightboxImg" class="lightbox-img" src="" alt="Enlarged Case Image">
  </div>

  <script>
    const ALL_ITEMS = ${serializedItems};
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

    let state = {
      items: ALL_ITEMS,
      filteredIndices: ALL_ITEMS.map((_, i) => i),
      currentPtr: 0,
      userAnswers: {}, // index -> chosen option
      flagged: new Set(),
      timerMode: 'none',
      timerSec: 0,
      timerMax: 0,
      timerInterval: null,
      timerPaused: false,
      filterMistakes: false,
    };

    // DOM Elements
    const qNumberEl = document.getElementById("qNumber");
    const qCategoryEl = document.getElementById("qCategory");
    const btnFlagEl = document.getElementById("btnFlag");
    const qTextEl = document.getElementById("qText");
    const qImageBoxEl = document.getElementById("qImageBox");
    const qImageEl = document.getElementById("qImage");
    const optionsListEl = document.getElementById("optionsList");
    const expBoxEl = document.getElementById("explanationBox");
    const expBodyEl = document.getElementById("expBody");
    const prevBtnEl = document.getElementById("prevBtn");
    const nextBtnEl = document.getElementById("nextBtn");
    const retryCurrentBtnEl = document.getElementById("retryCurrentBtn");
    const finishBtnEl = document.getElementById("finishBtn");
    const progressFillEl = document.getElementById("progressFill");

    const statCorrectEl = document.getElementById("statCorrect");
    const statWrongEl = document.getElementById("statWrong");
    const statPercentEl = document.getElementById("statPercent");
    const statFlaggedEl = document.getElementById("statFlagged");
    const mistakesCountEl = document.getElementById("mistakesCount");

    const filterMistakesBtnEl = document.getElementById("filterMistakesBtn");
    const filterBannerEl = document.getElementById("filterBanner");
    const exitFilterBtnEl = document.getElementById("exitFilterBtn");
    const timerBadgeEl = document.getElementById("timerBadge");
    const timerControlBtnEl = document.getElementById("timerControlBtn");

    // Init Theme
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeIcon = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");

    function applyTheme(t) {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("zeta_quiz_theme", t);
      if (t === "dark") {
        themeIcon.textContent = "☀️";
        themeLabel.textContent = "فاتح";
      } else {
        themeIcon.textContent = "🌙";
        themeLabel.textContent = "داكن";
      }
    }

    const savedTheme = localStorage.getItem("zeta_quiz_theme") || "dark";
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });

    // Render Current Question
    function renderQuestion() {
      if (state.filteredIndices.length === 0) {
        qTextEl.textContent = "لا توجد أسئلة تطابق هذه التصفية!";
        optionsListEl.innerHTML = "";
        expBoxEl.classList.remove("visible");
        qImageBoxEl.style.display = "none";
        return;
      }

      const globalIdx = state.filteredIndices[state.currentPtr];
      const item = ALL_ITEMS[globalIdx];

      qNumberEl.textContent = \`سؤال \${state.currentPtr + 1} من \${state.filteredIndices.length} (رقم \${globalIdx + 1} بالملف)\`;
      qCategoryEl.textContent = item.category || "";
      btnFlagEl.classList.toggle("flagged", state.flagged.has(globalIdx));

      qTextEl.textContent = item.q;

      // Image
      if (item.imageBase64) {
        qImageEl.src = "data:image/jpeg;base64," + item.imageBase64;
        qImageBoxEl.style.display = "block";
      } else {
        qImageBoxEl.style.display = "none";
      }

      // Options
      optionsListEl.innerHTML = "";
      const chosen = state.userAnswers[globalIdx];
      const answered = typeof chosen === "number";

      item.options.forEach((optText, optIdx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerHTML = \`
          <span class="option-letter">\${LETTERS[optIdx] || optIdx + 1}</span>
          <span class="option-text">\${escapeHtml(optText)}</span>
        \`;

        if (answered) {
          btn.disabled = true;
          if (optIdx === item.answer) {
            btn.classList.add("correct");
          }
          if (chosen === optIdx && chosen !== item.answer) {
            btn.classList.add("wrong");
          }
        } else {
          btn.addEventListener("click", () => handleSelectOption(globalIdx, optIdx));
        }

        optionsListEl.appendChild(btn);
      });

      // Explanation
      if (answered) {
        expBodyEl.textContent = item.explanation || "الإجابة الصحيحة هي: " + item.options[item.answer];
        expBoxEl.classList.add("visible");
        retryCurrentBtnEl.style.display = chosen !== item.answer ? "inline-flex" : "none";
      } else {
        expBoxEl.classList.remove("visible");
        retryCurrentBtnEl.style.display = "none";
      }

      // Nav buttons state
      prevBtnEl.disabled = state.currentPtr === 0;
      nextBtnEl.disabled = state.currentPtr === state.filteredIndices.length - 1;

      // Update progress bar
      const pct = ((state.currentPtr + 1) / state.filteredIndices.length) * 100;
      progressFillEl.style.width = pct + "%";

      updateStats();
      resetQuestionTimer();
    }

    function handleSelectOption(globalIdx, optIdx) {
      state.userAnswers[globalIdx] = optIdx;
      renderQuestion();
    }

    function updateStats() {
      let correct = 0;
      let wrong = 0;
      Object.entries(state.userAnswers).forEach(([gIdx, ans]) => {
        const item = ALL_ITEMS[Number(gIdx)];
        if (ans === item.answer) correct++;
        else wrong++;
      });

      const totalAnswered = correct + wrong;
      const pct = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;

      statCorrectEl.textContent = correct;
      statWrongEl.textContent = wrong;
      statPercentEl.textContent = pct + "%";
      statFlaggedEl.textContent = state.flagged.size;
      mistakesCountEl.textContent = wrong;
    }

    // Flag toggle
    btnFlagEl.addEventListener("click", () => {
      const globalIdx = state.filteredIndices[state.currentPtr];
      if (state.flagged.has(globalIdx)) state.flagged.delete(globalIdx);
      else state.flagged.add(globalIdx);
      btnFlagEl.classList.toggle("flagged", state.flagged.has(globalIdx));
      updateStats();
      renderPalette();
    });

    // Navigation
    prevBtnEl.addEventListener("click", () => {
      if (state.currentPtr > 0) {
        state.currentPtr--;
        renderQuestion();
      }
    });

    nextBtnEl.addEventListener("click", () => {
      if (state.currentPtr < state.filteredIndices.length - 1) {
        state.currentPtr++;
        renderQuestion();
      }
    });

    retryCurrentBtnEl.addEventListener("click", () => {
      const globalIdx = state.filteredIndices[state.currentPtr];
      delete state.userAnswers[globalIdx];
      renderQuestion();
    });

    // Review Mistakes Mode
    filterMistakesBtnEl.addEventListener("click", () => {
      toggleReviewMistakes();
    });

    exitFilterBtnEl.addEventListener("click", () => {
      toggleReviewMistakes(false);
    });

    function toggleReviewMistakes(forceVal) {
      const nextVal = typeof forceVal === "boolean" ? forceVal : !state.filterMistakes;
      state.filterMistakes = nextVal;

      if (state.filterMistakes) {
        const mistakes = [];
        ALL_ITEMS.forEach((it, idx) => {
          const ans = state.userAnswers[idx];
          if (typeof ans === "number" && ans !== it.answer) {
            mistakes.push(idx);
          }
        });

        if (mistakes.length === 0) {
          alert("أحسنت! لا توجد لديك أي إجابات خاطئة لمراجعتها حالياً 🎯");
          state.filterMistakes = false;
          return;
        }

        state.filteredIndices = mistakes;
        state.currentPtr = 0;
        filterBannerEl.classList.add("active");
        filterMistakesBtnEl.classList.add("danger-active");
      } else {
        state.filteredIndices = ALL_ITEMS.map((_, i) => i);
        state.currentPtr = 0;
        filterBannerEl.classList.remove("active");
        filterMistakesBtnEl.classList.remove("danger-active");
      }

      renderQuestion();
    }

    function reviewMistakesOnly() {
      closeModal('resultsModal');
      toggleReviewMistakes(true);
    }

    function retakeFullQuiz() {
      if (confirm("هل تريد تصفير جميع إجاباتك والبدء من جديد؟")) {
        state.userAnswers = {};
        state.filterMistakes = false;
        state.filteredIndices = ALL_ITEMS.map((_, i) => i);
        state.currentPtr = 0;
        filterBannerEl.classList.remove("active");
        filterMistakesBtnEl.classList.remove("danger-active");
        closeModal('resultsModal');
        renderQuestion();
      }
    }

    // Palette Modal
    const paletteBtn = document.getElementById("paletteBtn");
    const paletteGridEl = document.getElementById("paletteGrid");

    paletteBtn.addEventListener("click", () => {
      renderPalette();
      openModal('paletteModal');
    });

    function renderPalette() {
      paletteGridEl.innerHTML = "";
      ALL_ITEMS.forEach((it, idx) => {
        const btn = document.createElement("div");
        btn.className = "palette-item";
        btn.textContent = idx + 1;

        const ans = state.userAnswers[idx];
        if (typeof ans === "number") {
          if (ans === it.answer) btn.classList.add("correct");
          else btn.classList.add("wrong");
        }

        if (state.flagged.has(idx)) btn.classList.add("flagged");

        const isCurrent = state.filteredIndices[state.currentPtr] === idx;
        if (isCurrent) btn.classList.add("active");

        btn.addEventListener("click", () => {
          let pos = state.filteredIndices.indexOf(idx);
          if (pos === -1) {
            // If question is filtered out, reset filter
            state.filterMistakes = false;
            state.filteredIndices = ALL_ITEMS.map((_, i) => i);
            filterBannerEl.classList.remove("active");
            filterMistakesBtnEl.classList.remove("danger-active");
            pos = idx;
          }
          state.currentPtr = pos;
          closeModal('paletteModal');
          renderQuestion();
        });

        paletteGridEl.appendChild(btn);
      });
    }

    // Finish / Result Modal
    finishBtnEl.addEventListener("click", showResults);

    function showResults() {
      let correct = 0;
      let wrong = 0;
      let skipped = 0;

      ALL_ITEMS.forEach((it, idx) => {
        const ans = state.userAnswers[idx];
        if (typeof ans === "number") {
          if (ans === it.answer) correct++;
          else wrong++;
        } else {
          skipped++;
        }
      });

      const total = ALL_ITEMS.length;
      const pct = Math.round((correct / total) * 100);

      document.getElementById("finalScoreVal").textContent = pct + "%";
      const scoreCircle = document.getElementById("scoreCircle");
      scoreCircle.style.background = \`conic-gradient(var(--accent) \${pct}%, var(--border) \${pct}%)\`;

      const verdictEl = document.getElementById("finalVerdict");
      if (pct >= 85) verdictEl.textContent = "🏆 ممتاز جداً دكتور! أداء باهر";
      else if (pct >= 70) verdictEl.textContent = "👏 جيد جداً! مستوى قوي ومبشر";
      else if (pct >= 50) verdictEl.textContent = "👍 ناجح! لكن تحتاج لمراجعة الأخطاء لتعزيز الدرجة";
      else verdictEl.textContent = "⚠️ تحتاج لمراجعة شاملة للأسئلة والأخطاء";

      document.getElementById("finalDetails").innerHTML = \`
        أجبت على <b>\${correct + wrong}</b> من إجمالي <b>\${total}</b> سؤال<br>
        ✅ صحيحة: <b>\${correct}</b> | ❌ خاطئة: <b>\${wrong}</b> | ⏳ متروكة: <b>\${skipped}</b>
      \`;

      const modalReviewBtn = document.getElementById("modalReviewMistakesBtn");
      modalReviewBtn.style.display = wrong > 0 ? "inline-flex" : "none";

      openModal('resultsModal');
    }

    // Timer Implementation
    document.getElementById("timerModalBtn").addEventListener("click", () => openModal('timerModal'));

    function setTimerMode(mode) {
      closeModal('timerModal');
      state.timerMode = mode;
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      state.timerPaused = false;

      if (mode === 'none') {
        timerBadgeEl.textContent = "⏱️ بدون مؤقت";
        timerBadgeEl.classList.remove("warning");
        timerControlBtnEl.style.display = "none";
        return;
      }

      timerControlBtnEl.style.display = "inline-flex";
      timerControlBtnEl.textContent = "إيقاف";

      if (mode === 'q30') startCountdown(30, true);
      else if (mode === 'q45') startCountdown(45, true);
      else if (mode === 'q60') startCountdown(60, true);
      else if (mode === 'exam20') startCountdown(20 * 60, false);
      else if (mode === 'exam45') startCountdown(45 * 60, false);
    }

    function startCountdown(sec, perQuestion = false) {
      clearInterval(state.timerInterval);
      state.timerSec = sec;
      state.timerMax = sec;
      updateTimerBadge();

      state.timerInterval = setInterval(() => {
        if (state.timerPaused) return;
        state.timerSec--;
        updateTimerBadge();

        if (state.timerSec <= 0) {
          clearInterval(state.timerInterval);
          if (perQuestion) {
            handleTimeoutQuestion();
          } else {
            alert("⏰ انتهى وقت الامتحان بالكامل!");
            showResults();
          }
        }
      }, 1000);
    }

    function updateTimerBadge() {
      const m = Math.floor(state.timerSec / 60);
      const s = state.timerSec % 60;
      const str = \`\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
      timerBadgeEl.textContent = \`⏱️ \${str}\`;
      timerBadgeEl.classList.toggle("warning", state.timerSec <= 5);
    }

    function resetQuestionTimer() {
      if (['q30', 'q45', 'q60'].includes(state.timerMode)) {
        const sec = state.timerMode === 'q30' ? 30 : state.timerMode === 'q45' ? 45 : 60;
        startCountdown(sec, true);
      }
    }

    function handleTimeoutQuestion() {
      const globalIdx = state.filteredIndices[state.currentPtr];
      if (typeof state.userAnswers[globalIdx] !== "number") {
        state.userAnswers[globalIdx] = -1; // marked as timed out / wrong
        renderQuestion();
      }
    }

    timerControlBtnEl.addEventListener("click", () => {
      state.timerPaused = !state.timerPaused;
      timerControlBtnEl.textContent = state.timerPaused ? "استئناف" : "إيقاف";
    });

    // Lightbox for Images
    const lightboxEl = document.getElementById("lightbox");
    const lightboxImgEl = document.getElementById("lightboxImg");

    qImageBoxEl.addEventListener("click", () => {
      lightboxImgEl.src = qImageEl.src;
      lightboxEl.classList.add("active");
    });

    function closeLightbox() {
      lightboxEl.classList.remove("active");
    }

    // Modal Helpers
    function openModal(id) { document.getElementById(id).classList.add("active"); }
    function closeModal(id) { document.getElementById(id).classList.remove("active"); }

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (document.querySelector(".modal-overlay.active")) {
        if (e.key === "Escape") {
          document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
          closeLightbox();
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        if (state.currentPtr < state.filteredIndices.length - 1) {
          state.currentPtr++;
          renderQuestion();
        }
      } else if (e.key === "ArrowRight") {
        if (state.currentPtr > 0) {
          state.currentPtr--;
          renderQuestion();
        }
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const globalIdx = state.filteredIndices[state.currentPtr];
        const optIdx = parseInt(e.key, 10) - 1;
        const item = ALL_ITEMS[globalIdx];
        if (optIdx < item.options.length && typeof state.userAnswers[globalIdx] !== "number") {
          handleSelectOption(globalIdx, optIdx);
        }
      } else if (["a", "b", "c", "d", "e"].includes(e.key.toLowerCase())) {
        const globalIdx = state.filteredIndices[state.currentPtr];
        const map = { a: 0, b: 1, c: 2, d: 3, e: 4 };
        const optIdx = map[e.key.toLowerCase()];
        const item = ALL_ITEMS[globalIdx];
        if (optIdx < item.options.length && typeof state.userAnswers[globalIdx] !== "number") {
          handleSelectOption(globalIdx, optIdx);
        }
      } else if (e.key.toLowerCase() === "f") {
        btnFlagEl.click();
      }
    });

    // Escape HTML helper
    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Initial render
    renderQuestion();
  </script>
</body>
</html>`;
}

function buildIndexDashboardHtml(quizzes) {
  const cardsHtml = quizzes
    .map((q) => {
      const imgBadge = q.imageCount > 0
        ? `<span style="background:rgba(245, 158, 11, 0.15); color:#f59e0b; padding:4px 9px; border-radius:20px; font-size:12px; font-weight:700;">🖼️ ${q.imageCount} صورة</span>`
        : "";
      return `
      <div class="quiz-card">
        <div class="card-badge-row">
          <span class="quiz-badge">كويز ${q.partId}</span>
          ${imgBadge}
          <span class="count-badge">${q.count} سؤال</span>
        </div>
        <h3 class="quiz-card-title">${escapeHtml(q.titleAr)}</h3>
        <p class="quiz-card-desc">${escapeHtml(q.titleEn)}</p>
        <div class="card-footer">
          <span style="font-size:12.5px; color:var(--text-muted);">الملف: ${escapeHtml(q.fileName)}</span>
          <a href="${escapeHtml(q.htmlFileName)}" class="btn-launch">
            <span>ابدأ الكويز</span>
            <span>⚡</span>
          </a>
        </div>
      </div>
      `;
    })
    .join("\n");

  const totalQuestions = quizzes.reduce((sum, q) => sum + q.count, 0);
  const totalImages = quizzes.reduce((sum, q) => sum + q.imageCount, 0);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوابة كويزات الطوارئ والأشعة الشاملة - 9 ملفات تفاعلية</title>
  <style>
    :root {
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Tajawal", "Inter", sans-serif;
      --radius-md: 14px;
      --radius-lg: 20px;
    }
    [data-theme="dark"] {
      --bg-base: #090d16;
      --bg-surface: #111827;
      --bg-card: #182238;
      --border: #243452;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #0ea5e9;
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    [data-theme="light"] {
      --bg-base: #f8fafc;
      --bg-surface: #ffffff;
      --bg-card: #ffffff;
      --border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #475569;
      --accent: #0284c7;
      --accent-hover: #0369a1;
      --shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family);
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      line-height: 1.6;
      padding-bottom: 60px;
      transition: background-color 0.3s, color 0.3s;
    }
    header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      padding: 24px 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .hero h1 {
      font-size: 24px;
      font-weight: 900;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .hero p {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .theme-btn {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
    }
    main {
      max-width: 1100px;
      margin: 32px auto;
      padding: 0 20px;
    }
    .banner-all {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(16, 185, 129, 0.15));
      border: 1px solid var(--accent);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .banner-all h2 { font-size: 20px; font-weight: 800; }
    .banner-all p { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
    .btn-launch-all {
      background: var(--accent);
      color: #0b1120;
      padding: 12px 24px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: 0.2s;
    }
    .btn-launch-all:hover {
      background: var(--accent-hover);
      color: #ffffff;
      transform: translateY(-2px);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .quiz-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow);
      transition: 0.25s;
    }
    .quiz-card:hover {
      border-color: var(--accent);
      transform: translateY(-3px);
    }
    .card-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .quiz-badge {
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
    }
    .count-badge {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-right: auto;
    }
    .quiz-card-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 6px;
    }
    .quiz-card-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 18px;
      line-height: 1.4;
    }
    .card-footer {
      border-top: 1px solid var(--border);
      padding-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .btn-launch {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--accent);
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 13.5px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: 0.2s;
    }
    .btn-launch:hover {
      background: var(--accent);
      color: #0b1120;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <div class="hero">
        <h1>🚨 كويزات الطوارئ والأشعة التفاعلية (Interactive Quiz Hub)</h1>
        <p>بنك أسئلة طب وجراحة الطوارئ والإنعاش (${totalQuestions} سؤال عبر 9 ملفات مع ${totalImages} صورة طبية)</p>
      </div>
      <button id="themeToggleBtn" class="theme-btn">🌓 تبديل المظهر</button>
    </div>
  </header>

  <main>
    <!-- Master All Questions Card -->
    <div class="banner-all">
      <div>
        <h2>🎯 بنك الطوارئ الكامل الموحد (الـ ${totalQuestions} سؤال كاملة بالصور)</h2>
        <p>امتحان تجريبي شامل يضم كل الأسئلة الـ 9 معاً للمراجعة الكبرى مع حفظ الأخطاء والمؤقت والتفسيرات.</p>
      </div>
      <a href="00_All_Emergency_Medicine_Bank_334Q.html" class="btn-launch-all">
        <span>فتح الامتحان الشامل (334 س)</span>
        <span>🚀</span>
      </a>
    </div>

    <!-- 9 Standalone Quizzes Grid -->
    <div class="grid">
      ${cardsHtml}
    </div>
  </main>

  <script>
    const themeBtn = document.getElementById("themeToggleBtn");
    function applyTheme(t) {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("zeta_quiz_theme", t);
    }
    const saved = localStorage.getItem("zeta_quiz_theme") || "dark";
    applyTheme(saved);
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  </script>
</body>
</html>`;
}

// Generate all files
async function main() {
  console.log("🚀 Starting Desktop Interactive Quiz Generation...");

  const quizMetadata = [
    {
      partId: 1,
      slug: "01_Core_Emergency_Exam_50Q",
      titleAr: "امتحان الطوارئ والإنعاش الشامل",
      titleEn: "Core Emergency Medicine Exam",
      fileName: "media_1792488041938_ea006030.pdf",
    },
    {
      partId: 2,
      slug: "02_Chest_Pain_and_Cardiac_Dysrhythmias_45Q",
      titleAr: "آلام الصدر واضطراب كهربية القلب",
      titleEn: "Chest Pain and Cardiac Dysrhythmias",
      fileName: "media_1792487675199_4940c038.pdf",
    },
    {
      partId: 3,
      slug: "03_Trauma_and_Resuscitation_43Q",
      titleAr: "إصابات الحوادث والتروما والنزيف",
      titleEn: "Trauma Questions & Resuscitation",
      fileName: "media_1792487671576_3ab3fae6.pdf",
    },
    {
      partId: 4,
      slug: "04_Shock_and_Resuscitation_27Q",
      titleAr: "أنواع الصدمات والإنعاش والعناية المركزة",
      titleEn: "Shock and Resuscitation Questions",
      fileName: "media_1792487689743_1106913f.pdf",
    },
    {
      partId: 5,
      slug: "05_Gastrointestinal_Bleeding_17Q",
      titleAr: "طوارئ ونزيف الجهاز الهضمي",
      titleEn: "Gastrointestinal Bleeding Questions",
      fileName: "media_1792487690761_ff315435.pdf",
    },
    {
      partId: 6,
      slug: "06_ALS_and_ECG_Rhythm_Cases_22Q",
      titleAr: "الإنعاش المتقدم وتخطيط كهربية القلب (ALS)",
      titleEn: "ALS & Resuscitation (with ECG strips)",
      fileName: "media_1792544894995_138618a0.pdf",
    },
    {
      partId: 7,
      slug: "07_Emergency_Radiology_Cases_CT_XRay_10Q",
      titleAr: "حالات أشعة الطوارئ المقطعية والعادية (بالصور)",
      titleEn: "Emergency Radiology Cases: CT & X-Ray",
      fileName: "media_1792544902113_867ad340.pdf",
    },
    {
      partId: 8,
      slug: "08_BLS_Pretest_and_CPR_34Q",
      titleAr: "اختبار وأساسيات الإنعاش القلبي الرئوي (BLS)",
      titleEn: "Basic Life Support Pretest & CPR Questions",
      fileName: "media_1792544904111_65228e93.pdf",
    },
    {
      partId: 9,
      slug: "09_Comprehensive_BLS_First_Aid_Bank_86Q",
      titleAr: "بنك الإسعافات الأولية والإنعاش الشامل",
      titleEn: "Comprehensive CPR, First Aid & BLS Question Bank",
      fileName: "media_1792544905901_062f90f3.pdf",
    },
  ];

  const generatedQuizzes = [];

  for (const meta of quizMetadata) {
    const items = getEmergencyQuizPart(meta.partId);
    const imageCount = items.filter((it) => it.imageBase64).length;

    const htmlContent = buildQuizAppHtml({
      quizTitle: meta.titleEn,
      quizTitleAr: meta.titleAr,
      partId: meta.partId,
      items,
      totalParts: 9,
      isAll: false
    });

    const htmlFileName = `${meta.slug}.html`;
    const fullPath = path.join(OUTPUT_DIR, htmlFileName);
    fs.writeFileSync(fullPath, htmlContent, "utf8");

    console.log(`✅ Generated: ${htmlFileName} (${items.length} Qs, ${imageCount} Images) -> ${fullPath}`);

    generatedQuizzes.push({
      ...meta,
      count: items.length,
      imageCount,
      htmlFileName
    });
  }

  // Generate All 334 Questions Master Quiz
  console.log("📦 Generating Master All-In-One Quiz (334 Questions)...");
  const allItems = [];
  for (let p = 1; p <= 9; p++) {
    allItems.push(...getEmergencyQuizPart(p));
  }
  const allHtmlContent = buildQuizAppHtml({
    quizTitle: "Emergency Medicine Complete Question Bank (334 MCQs)",
    quizTitleAr: "بنك أسئلة طب وجراحة الطوارئ والأشعة الموحد",
    partId: "All",
    items: allItems,
    totalParts: 9,
    isAll: true
  });
  const allHtmlFileName = "00_All_Emergency_Medicine_Bank_334Q.html";
  fs.writeFileSync(path.join(OUTPUT_DIR, allHtmlFileName), allHtmlContent, "utf8");
  console.log(`✅ Generated Master Quiz: ${allHtmlFileName} (${allItems.length} Qs)`);

  // Generate Dashboard index.html
  console.log("📑 Generating Dashboard index.html...");
  const dashboardHtml = buildIndexDashboardHtml(generatedQuizzes);
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), dashboardHtml, "utf8");
  console.log(`✅ Generated Dashboard: index.html`);

  console.log(`\n🎉 ALL FILES GENERATED SUCCESSFULLY IN:\n${OUTPUT_DIR}\n`);
}

main().catch(err => {
  console.error("❌ Error generating desktop quizzes:", err);
  process.exit(1);
});
