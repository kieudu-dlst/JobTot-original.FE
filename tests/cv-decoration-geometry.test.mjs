import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decorationLayer,
  moveDecoration,
  resizeDecoration,
} from "../src/entities/cv/model/decoration.js";
import { paginateCv } from "../src/entities/cv/model/paginate.js";
const image = { x: 10, y: 20, width: 40, height: 20 };
test("layer ordering is preserved on both sides of the document content", () => {
  assert.ok(decorationLayer(-2) < decorationLayer(-1));
  assert.ok(decorationLayer(-1) < 10 && decorationLayer(1) > 10);
  assert.ok(decorationLayer(1) < decorationLayer(2));
});
test("font callbacks during printing do not paginate a hidden measurement tree", () => {
  assert.equal(paginateCv({}, { clientHeight: 0 }), null);
});
test("movement clamps to all A4 edges", () => {
  assert.deepEqual(moveDecoration(image, -999, -999), { ...image, x: 0, y: 0 });
  assert.deepEqual(moveDecoration(image, 999, 999), { ...image, x: 170, y: 277 });
});
test("resize preserves ratio and clamps both page dimensions", () => {
  for (const [dx, dy] of [
    [30, 15],
    [999, 999],
    [-999, -999],
    [0, 20],
  ]) {
    const resized = resizeDecoration(image, dx, dy);
    assert.equal(resized.width / resized.height, 2);
    assert.ok(resized.x + resized.width <= 210 && resized.y + resized.height <= 297);
    assert.ok(resized.width > 0 && resized.height > 0);
  }
});
