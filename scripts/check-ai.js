#!/usr/bin/env node
// Checks which Gemini models your key can actually use, and which of the configured
// models the bot will try. Run it once after setting keys:
//   node --env-file=.env scripts/check-ai.js
// A model name that is not on the list returns "not found" on every call, and the bot then
// falls through to the next provider. This script shows that before users see it.

const key = String(process.env.GEMINI_API_KEY || "").split(/[,;\s]+/).filter(Boolean)[0];
const configured = String(process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-3.5-flash")
  .split(/[,;\s]+/)
  .filter(Boolean);

if (!key) {
  console.error("GEMINI_API_KEY is not set, so Gemini is not used at all.");
  process.exit(1);
}

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200`, {
  headers: { "x-goog-api-key": key },
});
if (!res.ok) {
  console.error(`Listing models failed with HTTP ${res.status}. Check the key and its project's API access.`);
  process.exit(1);
}
const data = await res.json();
const available = new Set((data.models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent")).map((m) => m.name.replace(/^models\//, "")));

console.log(`Your key can call ${available.size} models that support generateContent.\n`);
for (const name of configured) {
  console.log(`${available.has(name) ? "OK     " : "MISSING"}  ${name}`);
}
if (!configured.some((n) => available.has(n))) {
  console.log("\nNone of your configured Gemini models is available. Replace them with names from the list below.");
}
console.log("\nAvailable (first 40):");
console.log([...available].slice(0, 40).join("\n"));
