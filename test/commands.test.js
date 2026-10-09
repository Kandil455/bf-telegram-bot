import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PRIVATE_COMMANDS, GROUP_COMMANDS, ALIASES, commandsFor } from "../src/core/commands.js";

const here = dirname(fileURLToPath(import.meta.url));
const router = readFileSync(join(here, "..", "src", "router.js"), "utf8");

test("every published private command has a handler in the router", () => {
  for (const c of PRIVATE_COMMANDS) {
    assert.ok(router.includes(`case "/${c.name}"`), `/${c.name} is published but not handled`);
  }
});

test("every alias points at a handled command", () => {
  for (const [alias] of Object.entries(ALIASES)) {
    assert.ok(router.includes(`case "/${alias}"`), `/${alias} is not handled`);
  }
});

test("group commands are handled in group mode", () => {
  for (const c of GROUP_COMMANDS) {
    assert.ok(new RegExp(`\\\\/${c.name}\\\\b`).test(router), `group /${c.name} is not handled`);
  }
});

test("command names follow Telegram's rules: lowercase, digits and underscore, up to 32 characters", () => {
  for (const c of [...PRIVATE_COMMANDS, ...GROUP_COMMANDS]) {
    assert.match(c.name, /^[a-z0-9_]{1,32}$/);
  }
});

test("descriptions fit Telegram's limit in both languages", () => {
  for (const scope of ["private", "group"]) {
    for (const lang of ["en", "ar"]) {
      for (const c of commandsFor(scope, lang)) {
        assert.ok(c.description.length > 0 && c.description.length <= 256);
      }
    }
  }
  assert.ok(commandsFor("private", "en").length <= 100, "Telegram allows up to 100 commands per scope");
});
