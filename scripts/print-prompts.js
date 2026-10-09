#!/usr/bin/env node
// Prints the live prompts (the exact text the bot sends) so they can be reviewed in one place.
import { buildDocumentPrompt, buildOscePrompt, buildMergePrompt, buildRepairPrompt } from "../src/prompts/summary.js";

const sample = "Price elasticity measures how quantity demanded responds to a change in price.";
const out = [];
out.push("# Live prompts\n\nGenerated from src/prompts/summary.js. These are the exact strings the bot sends.\n");
out.push("## 1. Master contract (system prompt, identical for every template)\n");
out.push("```text\n" + buildDocumentPrompt({ template: "cram", lang: "en", text: sample }).system + "\n```\n");
for (const t of ["cram", "cornell", "table", "flow", "qa"]) {
  const p = buildDocumentPrompt({ template: t, lang: "en", title: "Sample", text: sample, detail: "standard" });
  out.push(`## Template: ${t}\n\nUser message (the template brief is the part that changes):\n\n\`\`\`text\n${p.user.split("\n\n").slice(0, 2).join("\n\n")}\n\`\`\`\n`);
}
out.push("## OSCE contract\n\n```text\n" + buildOscePrompt({ lang: "bilingual", text: sample }).system + "\n```\n");
out.push("## Merge step (long lectures)\n\n```text\n" + buildMergePrompt({ template: "table", lang: "en", title: "T", sectionsJson: "[]" }).user + "\n```\n");
out.push("## Repair step (malformed JSON)\n\n```text\n" + buildRepairPrompt("{bad").user + "\n```\n");
console.log(out.join("\n"));
