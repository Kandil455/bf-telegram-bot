import { test } from "node:test";
import assert from "node:assert/strict";
import { mapLimit, imagesForPart } from "../src/render/pipeline.js";

test("mapLimit: never runs more than the limit at once, and keeps input order", async () => {
  let running = 0;
  let peak = 0;
  const out = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (x) => {
    running++;
    peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 5 * (7 - x)));
    running--;
    return x * 10;
  });
  assert.equal(peak, 2);
  assert.deepEqual(out, [10, 20, 30, 40, 50, 60]);
});

test("imagesForPart: an image goes to the part that mentions its caption", () => {
  const images = [{ caption: "Supply curve" }, { caption: "Cell membrane" }];
  const got = imagesForPart(images, "The supply curve shifts when costs change.");
  assert.deepEqual(got.map((i) => i.caption), ["Supply curve"]);
});

test("imagesForPart: when nothing matches, every image is still offered", () => {
  const images = [{ caption: "Supply curve" }, { caption: "Cell membrane" }];
  assert.equal(imagesForPart(images, "Unrelated text about history.").length, 2);
  assert.deepEqual(imagesForPart([], "anything"), []);
});
