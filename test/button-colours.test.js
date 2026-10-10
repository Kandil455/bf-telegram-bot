import { test } from "node:test";
import assert from "node:assert/strict";
import { button, styleFor, STYLE_BY_ICON } from "../src/core/buttons.js";

test("colours: confirm and approve are green, reject and exclude are red", () => {
  assert.equal(button({ label: "Approve", icon: "done", action: "x" }).style, "success");
  assert.equal(button({ label: "Exclude", icon: "wrong", action: "x" }).style, "danger");
});

test("colours: main actions are blue, navigation has no colour", () => {
  assert.equal(button({ label: "Quiz", icon: "quiz", action: "x" }).style, "primary");
  assert.equal(button({ label: "Back", icon: "back", action: "x" }).style, undefined);
  assert.equal(button({ label: "Menu", icon: "home", action: "x" }).style, undefined);
});

test("colours: an explicit style always wins over the icon's colour", () => {
  assert.equal(button({ label: "Q", icon: "quiz", style: "danger", action: "x" }).style, "danger");
});

test("colours: an unknown or missing icon gets no colour", () => {
  assert.equal(styleFor("nope", null), null);
  assert.equal(styleFor(null, null), null);
  assert.ok(Object.values(STYLE_BY_ICON).every((v) => v === null || ["success", "danger", "primary"].includes(v)));
});
