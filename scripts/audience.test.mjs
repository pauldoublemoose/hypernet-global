// node --test scripts/audience.test.mjs — canSee, the same rules as SQL can_see. No server, no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { canSee } = require("../_shared/hypernet-audience.js");

const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const D = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const LIST = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

const everyone = { include: ["everyone"], exclude: [] };
const graph = {
  friends: {
    [A < B ? `${A}|${B}` : `${B}|${A}`]: "accepted",
    [B < C ? `${B}|${C}` : `${C}|${B}`]: "accepted",
    [C < D ? `${C}|${D}` : `${D}|${C}`]: "accepted",
    [`${A}|${D}`]: "pending",
  },
  follows: { [`${B}|${A}`]: true },
  lists: {
    [LIST]: { owner: A, members: { [B]: true } },
    [OTHER]: { owner: C, members: { [B]: true } },
  },
};

test("a logged-out viewer sees nothing, including everyone with no exclude", () => {
  assert.equal(canSee(null, A, everyone, graph), false);
  assert.equal(canSee(null, null, everyone, graph), false);
  assert.equal(canSee(null, A, { include: ["everyone"], exclude: ["friends"] }, graph), false);
});

test("everyone matches any logged-in viewer, and an exclude beats it", () => {
  assert.equal(canSee(C, A, everyone, graph), true);
  assert.equal(canSee(B, A, { include: ["everyone"], exclude: ["friends"] }, graph), false);
  assert.equal(canSee(C, A, { include: ["everyone"], exclude: ["friends"] }, graph), true);
});

test("the owner always sees, including when excluded and when include is empty", () => {
  assert.equal(canSee(A, A, { include: [], exclude: ["everyone"] }, graph), true);
  assert.equal(canSee(A, A, { include: ["friends"], exclude: ["friends"] }, graph), true);
});

test("friends is an accepted pair, fof is that or two hops, and a pending request is neither", () => {
  assert.equal(canSee(B, A, { include: ["friends"], exclude: [] }, graph), true);
  assert.equal(canSee(C, A, { include: ["friends"], exclude: [] }, graph), false);
  assert.equal(canSee(C, A, { include: ["fof"], exclude: [] }, graph), true);
  assert.equal(canSee(D, A, { include: ["fof"], exclude: [] }, graph), false);
  assert.equal(canSee(D, A, { include: ["friends"], exclude: [] }, graph), false);
});

test("followers is the viewer following the owner, not the other way", () => {
  assert.equal(canSee(B, A, { include: ["followers"], exclude: [] }, graph), true);
  assert.equal(canSee(A, B, { include: ["followers"], exclude: [] }, graph), false);
});

test("a list matches only when the owner owns it and the viewer is on it", () => {
  assert.equal(canSee(B, A, { include: [`list:${LIST}`], exclude: [] }, graph), true);
  assert.equal(canSee(C, A, { include: [`list:${LIST}`], exclude: [] }, graph), false);
  assert.equal(canSee(B, A, { include: [`list:${OTHER}`], exclude: [] }, graph), false);
});

test("a hostless event is everyone-only for a logged-in viewer", () => {
  assert.equal(canSee(B, null, everyone, graph), true);
  assert.equal(canSee(null, null, everyone, graph), false);
  assert.equal(canSee(B, null, { include: ["friends"], exclude: [] }, graph), false);
  assert.equal(canSee(B, null, { include: ["fof"], exclude: [] }, graph), false);
  assert.equal(canSee(B, null, { include: ["followers"], exclude: [] }, graph), false);
});
