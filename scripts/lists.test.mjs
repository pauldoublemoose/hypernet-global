// node --test scripts/lists.test.mjs — a contact list is a name plus member ids.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { nameProblem, planDelete, memberToggle, knownIds } = require("../_shared/hypernet-rel.js");

const work = { id: "list-work", name: "Work", memberIds: ["p-anna", "p-rio"] };
const close = { id: "list-close", name: "Close", memberIds: ["p-mira", "p-kai"] };

test("a name is 1 to 40 characters, unique for that owner, and the 51st is refused", () => {
  assert.equal(nameProblem([work], "  "), "Use a name of 1 to 40 characters.");
  assert.equal(nameProblem([work], "x".repeat(41)), "Use a name of 1 to 40 characters.");
  assert.equal(nameProblem([work], "  Work "), "You already have a list with that name.");
  assert.equal(nameProblem([work], "work"), "You already have a list with that name.");
  assert.equal(nameProblem([work], "WORK"), "You already have a list with that name.");
  assert.equal(nameProblem([work], "Work", "list-work"), "");
  const full = Array.from({ length: 50 }, (_, i) => ({ id: "l" + i, name: "L" + i, memberIds: [] }));
  assert.equal(nameProblem(full, "One more"), "You can keep 50 lists.");
  assert.equal(nameProblem(full, "L0", "l0"), "");
});

test("delete is refused when an event excludes the list, and include-only references are dropped", () => {
  const events = [
    { id: "e1", title: "Shift", audience: { include: ["list:list-work"], exclude: ["list:list-work"] } },
    { id: "e2", title: "Open", audience: { include: ["everyone", "list:list-work"], exclude: [] } },
  ];
  const blocked = planDelete([work, close], events, "list-work");
  assert.equal(blocked.ok, false);
  assert.deepEqual(blocked.events, [{ id: "e1", title: "Shift" }]);
  assert.equal(events[1].audience.include.length, 2);
  const gone = planDelete([work, close], [events[1]], "list-work");
  assert.equal(gone.ok, true);
  assert.deepEqual(gone.lists.map((l) => l.id), ["list-close"]);
  assert.deepEqual(gone.events[0].audience.include, ["everyone"]);
  assert.deepEqual(events[1].audience.include, ["everyone", "list:list-work"]);
});

test("membership toggles, and people you know leave you out", () => {
  const added = memberToggle([work], "list-work", "p-lena");
  assert.deepEqual(added[0].memberIds, ["p-anna", "p-rio", "p-lena"]);
  const removed = memberToggle(added, "list-work", "p-anna");
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
