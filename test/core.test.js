import test from "node:test";
import assert from "node:assert/strict";
import { act, parseAct, ACTIONS } from "../src/core/actions.js";
import { button, render, isButtonError } from "../src/core/buttons.js";
import { detectLang, pickLang } from "../src/core/lang.js";
import { GLYPH, icon, parsePremiumMap } from "../src/core/icons.js";
import { detectIntent } from "../src/core/intent.js";
import { normaliseCards, normaliseQuiz } from "../src/core/quiz.js";
import { chunk, esc, parseJsonLoose, progress, sanitizeHtml, stripTags, wordCount } from "../src/core/text.js";
import { copy } from "../src/core/copy.js";

test("language: Arabic wins only on Arabic majority; session choice beats detection", () => {
  assert.equal(detectLang("لخّص المحاضرة"), "ar");
  assert.equal(detectLang("summarize this"), "en");
  assert.equal(detectLang("123"), null);
  assert.equal(pickLang({ lang: "ar" }, "hello"), "ar");
  assert.equal(pickLang({}, "hello"), "en");
  assert.equal(pickLang({ detectedLang: "ar" }, ""), "ar");
});

test("premium map: keeps valid known icons, drops junk", () => {
  assert.deepEqual(parsePremiumMap('{"summary":"5123456789012","bogus":"5123456789012","quiz":"x"}'), { summary: "5123456789012" });
  assert.deepEqual(parsePremiumMap("{broken"), {});
  assert.equal(icon("quiz", {}), GLYPH.quiz);
  assert.match(icon("quiz", { quiz: "5123456789012" }), /<tg-emoji emoji-id="5123456789012">/);
});

test("callbacks: round-trip, length limit, unknown names refused", () => {
  assert.equal(act("sum", "basic"), "a:sum:basic");
  assert.deepEqual(parseAct("a:qa:2:1"), { name: "qa", args: ["2", "1"] });
  assert.equal(parseAct("x:sum"), null);
  assert.equal(parseAct("a:nope"), null);
  assert.throws(() => act("sum", "x".repeat(80)));
  assert.throws(() => act("unknown"));
  assert.ok(ACTIONS.includes("qn"));
});

test("buttons: premium label stands alone, plain label keeps the glyph, fields dropped in plain mode", () => {
  const premium = { summary: "5123456789012" };
  const b = button({ label: "Summarize", icon: "summary", action: act("sum", "basic"), style: "primary", premium });
  assert.equal(b.text, "Summarize");
  assert.equal(b.icon_custom_emoji_id, "5123456789012");
  const noPremium = button({ label: "Summarize", icon: "summary", action: act("sum", "basic"), style: "primary", premium: {} });
  assert.equal(noPremium.text, `${GLYPH.summary} Summarize`);

  const modern = render([[b]], { modern: true }).inline_keyboard[0][0];
  assert.equal(modern.icon_custom_emoji_id, "5123456789012");
  assert.equal(modern.style, "primary");
  const plain = render([[b]], { modern: false }).inline_keyboard[0][0];
  assert.equal(plain.icon_custom_emoji_id, undefined);
  assert.equal(plain.style, undefined);
  assert.equal(plain.text, `${GLYPH.summary} Summarize`);
  assert.equal(plain.callback_data, "a:sum:basic");
});

test("buttons: web_app and url kinds keep their target", () => {
  const web = render([[button({ label: "Open", webApp: "https://example.com/x", premium: {} })]], { modern: false }).inline_keyboard[0][0];
  assert.deepEqual(web.web_app, { url: "https://example.com/x" });
  assert.equal(web.callback_data, undefined);
});

test("button errors: only button-related rejections trigger the fallback", () => {
  assert.equal(isButtonError("Bad Request: BUTTON_DATA_INVALID"), true);
  assert.equal(isButtonError("Forbidden: bot was blocked"), false);
});

test("sanitizeHtml keeps allowed tags, drops the rest, escapes strays", () => {
  const out = sanitizeHtml('<b>ok</b><script>x</script> a & b < c <tg-spoiler>s</tg-spoiler>');
  assert.match(out, /<b>ok<\/b>/);
  assert.doesNotMatch(out, /<script/);
  assert.match(out, /a &amp; b &lt; c/);
  assert.match(out, /<tg-spoiler>s<\/tg-spoiler>/);
  assert.equal(stripTags("<i>a</i> <b>b</b>"), "a b");
  assert.equal(esc("<&>"), "&lt;&amp;&gt;");
});

test("chunk: every piece fits and nothing is lost", () => {
  const text = Array.from({ length: 500 }, (_, i) => `row ${i} some words here`).join("\n");
  const parts = chunk(text, 900);
  assert.ok(parts.length > 1 && parts.every((p) => p.length <= 900));
  assert.equal(parts.join(" ").replace(/\s+/g, " "), text.replace(/\s+/g, " "));
});

test("parseJsonLoose: fenced, embedded and invalid", () => {
  assert.deepEqual(parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJsonLoose('Here: {"q":"x"} thanks'), { q: "x" });
  assert.equal(parseJsonLoose("nothing"), null);
});

test("quiz and cards: invalid items are dropped, limits respected", () => {
  const quiz = normaliseQuiz({
    questions: [
      { q: "ok", options: ["a", "b", "c", "d"], answer: 3, explanation: "e" },
      { q: "bad", options: ["a", "b"], answer: 9 },
      { q: "", options: ["a", "b"], answer: 0 },
    ],
  }, 5);
  assert.equal(quiz.length, 1);
  assert.equal(normaliseCards({ cards: [{ q: "q", a: "a" }, { q: "", a: "x" }] }, 8).length, 1);
});

test("intent: English and Arabic requests map to the right intent", () => {
  assert.equal(detectIntent("summarize this lecture"), "summary");
  assert.equal(detectIntent("لخّص المحاضرة"), "summary");
  assert.equal(detectIntent("quiz me"), "quiz");
  assert.equal(detectIntent("اعملي كويز"), "quiz");
  assert.equal(detectIntent("flashcards please"), "cards");
  assert.equal(detectIntent("what is elasticity?"), "explain");
  assert.equal(detectIntent("hi"), "greeting");
  assert.equal(detectIntent("show my progress"), "stats");
  assert.equal(detectIntent("  "), "empty");
  assert.equal(detectIntent("tell me about the moon"), "chat");
});

test("text helpers: word count and progress bar", () => {
  assert.equal(wordCount("one two  three"), 3);
  assert.equal(progress(2, 5), "▰▰▱▱▱ 2/5");
});

test("copy: both languages exist for every button key", () => {
  const en = Object.keys(copy("en").btn);
  const ar = Object.keys(copy("ar").btn);
  assert.deepEqual(en.sort(), ar.sort());
});

test("premium glyphs: swapped for custom emoji once, never doubled", async () => {
  const { applyPremiumGlyphs } = await import("../src/core/icons.js");
  const premium = { quiz: "5123456789012" };
  const once = applyPremiumGlyphs(`${GLYPH.quiz} Quiz time ${GLYPH.quiz}`, premium);
  assert.equal(once.split("<tg-emoji").length - 1, 2);
  const twice = applyPremiumGlyphs(once, premium);
  assert.equal(twice, once);
  assert.equal(applyPremiumGlyphs("plain", premium), "plain");
});
