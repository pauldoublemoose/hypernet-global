// node --test scripts/lists.test.mjs — a contact list is a name plus member ids.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { nameProblem, planDelete, memberToggle, knownIds } = require("../_shared/hypernet-rel.js");

const WORK = "11111111-1111-4111-8111-111111111111";
const CLOSE = "22222222-2222-4222-8222-222222222222";
const work = { id: WORK, name: "Work", memberIds: ["p-anna", "p-rio"] };
const close = { id: CLOSE, name: "Close", memberIds: ["p-mira", "p-kai"] };

test("a name is 1 to 40 characters, unique for that owner, and the 51st is refused", () => {
  assert.equal(nameProblem([work], "  "), "Use a name of 1 to 40 characters.");
  assert.equal(nameProblem([work], "x".repeat(41)), "Use a name of 1 to 40 characters.");
  assert.equal(nameProblem([work], "  Work "), "You already have a list with that name.");
  assert.equal(nameProblem([work], "work"), "You already have a list with that name.");
  assert.equal(nameProblem([work], "WORK"), "You already have a list with that name.");
  assert.equal(nameProblem([work], "Work", WORK), "");
  const full = Array.from({ length: 50 }, (_, i) => ({ id: "l" + i, name: "L" + i, memberIds: [] }));
  assert.equal(nameProblem(full, "One more"), "You can keep 50 lists.");
  assert.equal(nameProblem(full, "L0", "l0"), "");
});

test("delete is refused when an event excludes the list, and include-only references are dropped", () => {
  const events = [
    { id: "e1", title: "Shift", audience: { include: ["list:" + WORK], exclude: ["list:" + WORK] } },
    { id: "e2", title: "Open", audience: { include: ["everyone", "list:" + WORK], exclude: [] } },
  ];
  const blocked = planDelete([work, close], events, WORK);
  assert.equal(blocked.ok, false);
  assert.deepEqual(blocked.events, [{ id: "e1", title: "Shift" }]);
  assert.equal(events[1].audience.include.length, 2);
  const gone = planDelete([work, close], [events[1]], WORK);
  assert.equal(gone.ok, true);
  assert.deepEqual(gone.lists.map((l) => l.id), [CLOSE]);
  assert.deepEqual(gone.events[0].audience.include, ["everyone"]);
  assert.deepEqual(events[1].audience.include, ["everyone", "list:" + WORK]);
});

test("membership toggles, and people you know leave you out", () => {
  const added = memberToggle([work], WORK, "p-lena");
  assert.deepEqual(added[0].memberIds, ["p-anna", "p-rio", "p-lena"]);
  const described = memberToggle([{ id: WORK, name: "Work", description: "Night shift", memberIds: ["p-anna"] }], WORK, "p-rio");
  assert.equal(described[0].description, "Night shift");
  assert.deepEqual(described[0].memberIds, ["p-anna", "p-rio"]);
  const removed = memberToggle(added, WORK, "p-anna");
  assert.deepEqual(removed[0].memberIds, ["p-rio", "p-lena"]);
  assert.deepEqual(work.memberIds, ["p-anna", "p-rio"]);
  const ids = knownIds("p-michal", {
    following: ["p-anna", "p-michal"],
    followers: ["p-lena"],
    friends: ["p-anna", "p-mira"],
    pending: ["p-jon"],
    listed: ["p-rio", "self"],
  });
  assert.deepEqual(ids, ["p-anna", "p-lena", "p-mira", "p-jon", "p-rio"]);
});
