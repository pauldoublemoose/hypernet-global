// node --test scripts/palette.test.mjs — the page palette (_shared/hypernet-palette.js) and the look's picks
// (_shared/hypernet-themes.js). Both are browser scripts; here they run on globalThis.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
globalThis.window = globalThis;
const P = require("../_shared/hypernet-palette.js");
require("../_shared/hypernet-themes.js");
const c = P.contrast;
const HEX = /^#[0-9a-f]{6}$/;

/* the fixture looks, the Customize starting points, and the colours people reach for first */
const SAMPLES = [
  ["#ffffff"], ["#000000"], ["#f8f7f3"], ["#808080"], ["#9b9b9b"], ["#5a5a5a"], ["#ff0000"], ["#00ff00"], ["#0000ff"],
  ["#ffff00"], ["#ff8800"], ["#1e5eff"], ["#f6e7b0"], ["#39ff88"], ["#2e7d32"], ["#7a3cff"],
  ["#000000", "#ff2fd0"], ["#0d1b2e", "#5ea8ff"], ["#06080e", "#6fd6c8"], ["#f6f0e4", "#d98d3f"], ["#3a2a12", "#e6b23c"],
  ["#7a3cff", "#ffd400", "#111111"], ["#e8f4ff", "#ff3366", "#0b2a4a"], ["#fbe9d8", "#c8552f", "#ffffff"],
];
const lcg = (s => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)(7);
const rnd = () => "#" + [0, 0, 0].map(() => Math.floor(lcg() * 256).toString(16).padStart(2, "0")).join("");
const RANDOM = Array.from({ length: 1500 }, () => [rnd(), lcg() < 0.6 ? rnd() : null, lcg() < 0.4 ? rnd() : null]);

/* AA: 4.5:1 for every text colour on the surface it sits on; the square's glyph is a graphic (3:1) */
function checkAA(p, label) {
  const pairs = [["ink", "bg", 7], ["dim", "bg", 4.5], ["accentInk", "bg", 4.5], ["ink", "chip", 4.5],
                 ["bandInk", "band", 4.5], ["bandDim", "band", 4.5], ["bandAccent", "band", 4.5], ["sqGlyph", "sq", 3]];
  for (const [fg, bg, need] of pairs)
    assert.ok(c(p[fg], p[bg]) >= need, `${label}: ${fg} ${p[fg]} on ${bg} ${p[bg]} is ${c(p[fg], p[bg]).toFixed(2)}, needs ${need}`);
}

test("every colour it gives is a #rrggbb hex", () => {
  for (const s of SAMPLES.concat(RANDOM)) {
    const p = P(...s);
    for (const [k, v] of Object.entries(p)) if (typeof v === "string") assert.match(v, HEX, `${s} ${k}`);
  }
});

test("text is always AA (body ink 7:1), on the samples and 1,500 random picks", () => {
  for (const s of SAMPLES) checkAA(P(...s), s.join(" "));
  for (const s of RANDOM) checkAA(P(...s), s.join(" "));
});

test("one colour colours the page: it is the ground unless it is a mid-tone, which moves off the middle", () => {
  for (const h of ["#ffffff", "#f6e7b0", "#39ff88", "#000000", "#0d1b2e", "#ffff00", "#ff8800"]) {
    const p = P(h);
    assert.equal(p.bg, h); assert.equal(p.nudged, false);
  }
  for (const h of ["#808080", "#ff0000", "#1e5eff"]) {
    const p = P(h);
    assert.notEqual(p.bg, h); assert.equal(p.nudged, true);
    /* the header keeps the colour exactly as picked */
    assert.equal(p.band, h);
    /* the hue survives the move (within a few degrees) */
    const a = P.lch(h), b = P.lch(p.bg);
    if (a.C > 0.05) assert.ok(Math.abs(Math.atan2(Math.sin(a.h - b.h), Math.cos(a.h - b.h))) < 0.12, `${h} hue moved`);
  }
});

test("text is never a surprise: dark ink on light pages, light ink on dark ones, tinted with the page's hue", () => {
  /* sweep one hue from black to white: the ink flips from light to dark exactly once */
  let flips = 0, prev = null;
  for (let L = 0.02; L <= 0.99; L += 0.01) {
    const p = P(P.fromLch(L, 0.12, 4.2));
    const darkInk = P.lch(p.ink).L < 0.5;
    if (prev !== null && darkInk !== prev) flips++;
    prev = darkInk;
    assert.equal(darkInk, !p.dark, `L ${L.toFixed(2)}: the ink matches the side of the page`);
  }
  assert.equal(flips, 1);
  /* tinted: the ink of a coloured page leans to the page's hue */
  for (const h of ["#0d1b2e", "#f6e7b0", "#2e7d32"]) {
    const p = P(h), a = P.lch(p.bg), b = P.lch(p.ink);
    assert.ok(b.C > 0.004 && Math.abs(Math.atan2(Math.sin(a.h - b.h), Math.cos(a.h - b.h))) < 0.35, `${h}: ink ${p.ink} keeps the hue`);
  }
});

test("colour 2 is the accent; colour 3 the header; without them they come from colour 1", () => {
  const one = P("#0d1b2e"), two = P("#0d1b2e", "#5ea8ff"), three = P("#0d1b2e", "#5ea8ff", "#ffd400");
  assert.equal(two.accent, "#5ea8ff");
  assert.equal(two.bg, one.bg); assert.equal(two.ink, one.ink);
  assert.notEqual(one.accent, two.accent);
  assert.equal(three.band, "#ffd400");
  assert.equal(three.bg, two.bg);
  /* a yellow header takes dark ink even on a dark page */
  assert.ok(P.lch(three.bandInk).L < 0.5);
  /* the default header is a step from the page, not the page */
  assert.notEqual(one.band, one.bg);
  /* a grey page's default accent is its ink */
  assert.equal(P("#ffffff").accent, P("#ffffff").ink);
});

test("the same picks always give the same page", () => {
  assert.deepEqual(P("#3a2a12", "#e6b23c"), P("#3A2A12", "#e6b23c"));
  assert.deepEqual(P("#abc"), P("#aabbcc"));
});

test("a look's picks: new looks carry them, old looks read as page + accent, anything else is dropped", () => {
  assert.deepEqual(window.HN_COLORS(["#FFF", null, "#123456"]), ["#ffffff", null, "#123456"]);
  assert.deepEqual(window.HN_COLORS(["#000000", "red", null]), ["#000000"]);
  assert.equal(window.HN_COLORS(["url(x)"]), null);
  assert.equal(window.HN_COLORS("nope"), null);
  assert.deepEqual(window.HN_LOOK_PICKS({ bg: "#06080e", ink: "#e9e7e0", accent: "#6fd6c8" }), ["#06080e", "#6fd6c8"]);
  assert.deepEqual(window.HN_LOOK_PICKS({ bg: "#06080e", ink: "#e9e7e0", accent: "#6fd6c8", colors: ["#112233"] }), ["#112233"]);
  /* an old look migrates to the same five fields as before; a new one keeps its picks */
  assert.deepEqual(window.HN_MIGRATE_LOOK({ palette: { bg: "#06080E", ink: "#e9e7e0", accent: "#6fd6c8" }, square: { glyph: "☾" } }),
                   { bg: "#06080e", ink: "#e9e7e0", accent: "#6fd6c8", image: null, glyph: "☾" });
  assert.deepEqual(window.HN_MIGRATE_LOOK({ bg: "#000000", ink: "#ffffff", accent: "#ff2fd0", glyph: "◉", colors: ["#000000", "#ff2fd0", "expression(1)"] }),
                   { bg: "#000000", ink: "#ffffff", accent: "#ff2fd0", image: null, glyph: "◉", colors: ["#000000", "#ff2fd0"] });
});
