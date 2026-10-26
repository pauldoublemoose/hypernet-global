// node --test scripts/rel.test.mjs — relOf is a follow boolean plus one friendship row.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { pairKey } = require("../_shared/hypernet-audience.js");
const { relOf, kind, controlOf } = require("../_shared/hypernet-rel.js");

const me = "p-michal";
const anna = "p-anna";
const mira = "p-mira";
const jon = "p-jon";
const tomas = "p-tomas";

function g(follows, friends) {
  return { follows, friends };
}

test("a logged-out viewer has no relationship", () => {
  const rel = relOf(null, anna, g({}, {}));
  assert.deepEqual(rel, { following: false, friend: "friend-none" });
  assert.equal(kind(rel), "none");
});

test("follow and friendship are independent", () => {
  const follow = { [`${me}|${anna}`]: true, [`${me}|${mira}`]: false };
  const friends = {
    [pairKey(me, anna)]: { a: anna, b: me, requestedBy: me, status: "accepted" },
    [pairKey(me, mira)]: { a: me, b: mira, requestedBy: mira, status: "accepted" },
    [pairKey(me, jon)]: { a: jon, b: me, requestedBy: me, status: "pending" },
    [pairKey(me, tomas)]: { a: me, b: tomas, requestedBy: tomas, status: "pending" },
  };
  const graph = g({ [`${me}|${anna}`]: true }, friends);
  assert.deepEqual(relOf(me, anna, graph), { following: true, friend: "friends" });
  assert.equal(kind(relOf(me, anna, graph)), "friends");
  assert.deepEqual(relOf(me, mira, g({}, friends)), { following: false, friend: "friends" });
  assert.equal(kind(relOf(me, mira, g({}, friends))), "friends");
  assert.deepEqual(relOf(me, jon, g({}, friends)), { following: false, friend: "requested-out" });
  assert.deepEqual(relOf(me, tomas, g({}, friends)), { following: false, friend: "requested-in" });
  assert.deepEqual(relOf(me, "p-kai", g({ [`${me}|p-kai`]: true }, friends)), { following: true, friend: "friend-none" });
  assert.equal(kind(relOf(me, "p-kai", g({ [`${me}|p-kai`]: true }, {}))), "following");
  assert.equal(follow[`${me}|${mira}`], false);
});

test("the relationship control is one menu for the state", () => {
  const none = { friend: "friend-none", following: false };
  assert.deepEqual(controlOf(none), { label: "Follow", tone: "primary", items: ["Follow", "Add friend", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "friend-none", following: true }), { label: "Following", tone: "on", items: ["Unfollow", "Add friend", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "requested-out", following: false }), { label: "Requested", tone: "", items: ["Cancel request", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "requested-in", following: true }), { label: "Respond", tone: "primary", items: ["Accept", "Decline", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "friends", following: true }), { label: "Friends", tone: "on", items: ["Unfriend", "Add to list"] });
});
