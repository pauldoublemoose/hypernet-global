// node --test scripts/look-validation.test.mjs — the API's look shape (lib/validation.ts), without a server or a database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { look } from "../lib/validation.ts";

const base = { bg: "#000000", ink: "#f5f5f5", accent: "#ff2fd0" };

test("a look from before 2026-10-05 (no picks) is still a look", () => {
  assert.deepEqual(look.parse({ ...base, glyph: "◉" }), { ...base, glyph: "◉" });
});

test("a look keeps its picks: the page colour, then an accent or null, then a header or null", () => {
  assert.deepEqual(look.parse({ ...base, colors: ["#000", null, "#FF2FD0"] }).colors, ["#000000", null, "#ff2fd0"]);
  assert.deepEqual(look.parse({ ...base, colors: ["#123456"] }).colors, ["#123456"]);
  assert.equal(look.parse({ ...base, colors: null }).colors, null);
});

test("picks must be one to three hex colours, the first one there", () => {
  for (const colors of [[], ["red"], [null, "#ffffff"], ["#000000", "#111111", "#222222", "#333333"], ["#000000", "url(x)"], "nope"])
    assert.equal(look.safeParse({ ...base, colors }).success, false, JSON.stringify(colors));
});

test("anything else on a look is dropped, as before", () => {
  assert.deepEqual(look.parse({ ...base, mood: "x", plain: true }), base);
});
