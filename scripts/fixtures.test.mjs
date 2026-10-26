// node --test scripts/fixtures.test.mjs — the offline demo graph, and the seed statements it becomes. No database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { audience } from "../lib/validation.ts";
import { buildSeed, seedUuid } from "./seed.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { canSee, pairKey } = require("../_shared/hypernet-audience.js");

function loadFixtures() {
  const w = { window: null };
  w.window = w;
  vm.createContext(w);
  vm.runInContext(readFileSync(join(root, "_shared/hypernet-data.js"), "utf8"), w, { filename: "_shared/hypernet-data.js" });
  return w.HYPERNET;
}

const ME = "p-michal";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function hostOf(e, people) {
  if (e.hostName === "You" || e.hostName === "Michal") return ME;
  const hit = Object.values(people).find((p) => p.displayName === e.hostName);
  return hit ? hit.id : null;
}

function graphOf(H) {
  const friends = {};
  for (const row of H.bonds) if (row.status === "accepted" || row.status === "pending") friends[pairKey(row.a, row.b)] = row.status;
  const follows = {};
  for (const [a, b] of H.follows) follows[`${a}|${b}`] = true;
  const lists = {};
  for (const list of H.lists) {
    const members = {};
    for (const id of list.memberIds) members[id] = true;
    lists[list.id] = { owner: ME, members };
  }
  return { friends, follows, lists };
}

test("p-michal's fixture graph has friends, follows, one request each way, and two lists", () => {
  const H = loadFixtures();
  const people = Object.fromEntries(H.people.map((p) => [p.id, p]));
  const mine = H.bonds.filter((row) => row.a === ME || row.b === ME);
  const accepted = mine.filter((row) => row.status === "accepted");
  const other = (row) => (row.a === ME ? row.b : row.a);
  assert.ok(accepted.length >= 3, "several accepted friends");
  assert.deepEqual([...mine.filter((row) => row.status === "pending" && row.requestedBy !== ME).map(other)], ["p-tomas"]);
  assert.deepEqual([...mine.filter((row) => row.status === "pending" && row.requestedBy === ME).map(other)], ["p-jon"]);

  const friends = new Set(accepted.map(other));
  const following = H.follows.filter(([a]) => a === ME).map(([, b]) => b).filter((id) => !friends.has(id));
  const followers = H.follows.filter(([, b]) => b === ME).map(([a]) => a).filter((id) => !friends.has(id));
  assert.ok(following.length >= 1, "follows someone who is not a friend");
  assert.ok(followers.length >= 1, "a follower who is not a friend");
  for (const id of following.concat(followers)) assert.ok(people[id], id);

  assert.deepEqual([...H.lists.map((l) => l.name)], ["Work", "Close"]);
  for (const list of H.lists) {
    assert.match(list.id, UUID);
    assert.ok(list.memberIds.length >= 1);
    for (const id of list.memberIds) assert.ok(people[id], id);
  }
});

test("fixture audiences cover the mixed cases, and one event stays hidden from p-michal", () => {
  const H = loadFixtures();
  const people = Object.fromEntries(H.people.map((p) => [p.id, p]));
  const work = H.lists.find((l) => l.name === "Work");
  const close = H.lists.find((l) => l.name === "Close");
  const want = [
    { include: ["everyone"], exclude: [] },
    { include: ["friends"], exclude: [] },
    { include: ["fof"], exclude: [] },
    { include: ["followers"], exclude: [] },
    { include: [`list:${close.id}`], exclude: [] },
    { include: ["everyone"], exclude: [`list:${work.id}`] },
    { include: ["friends"], exclude: [`list:${work.id}`] },
  ];
  for (const aud of want) {
    assert.ok(H.events.some((e) => JSON.stringify(e.audience) === JSON.stringify(aud)), JSON.stringify(aud));
  }
  const graph = graphOf(H);
  const hidden = H.events.filter((e) => {
    if (!e.audience) return false;
    const host = hostOf(e, people);
    return host && host !== ME && !canSee(ME, host, e.audience, graph) && canSee(host, host, e.audience, graph);
  });
  assert.equal(hidden.length, 1);
  assert.equal(hostOf(hidden[0], people), "p-sasha");
  const friends = new Set(H.bonds.filter((row) => row.status === "accepted" && (row.a === ME || row.b === ME)).map((row) => (row.a === ME ? row.b : row.a)));
  const second = H.people.map((p) => p.id).filter((id) => id !== ME && !friends.has(id) && canSee(id, ME, { include: ["fof"], exclude: [] }, graph));
  assert.ok(second.length >= 1, "a pure two-hop person");
  for (const id of second) assert.equal(canSee(id, ME, { include: ["friends"], exclude: [] }, graph), false);
});

test("seed.mjs checks, and its friendship, list, and audience statements match the fixture", () => {
  execFileSync(process.execPath, ["--check", join(root, "scripts/seed.mjs")], { stdio: "pipe" });
  const H = loadFixtures();
  const stmts = buildSeed("dev", { now: Date.UTC(2026, 9, 1, 10) });
  const friendships = stmts.filter((s) => s.startsWith("insert into friendships"));
  let pending = 0, accepted = 0;
  for (const s of friendships) {
    const m = s.match(/values \('([0-9a-f-]{36})', '([0-9a-f-]{36})', '([0-9a-f-]{36})', '(accepted|pending)', (null|'[^']+'::timestamptz),/);
    assert.ok(m, s);
    assert.ok(m[1] < m[2], s);
    assert.ok(m[3] === m[1] || m[3] === m[2], s);
    if (m[4] === "pending") { assert.equal(m[5], "null"); pending++; }
    else { assert.notEqual(m[5], "null"); accepted++; }
  }
  assert.ok(accepted >= 3);
  assert.equal(pending, 2);

  const lists = stmts.filter((s) => s.startsWith("insert into contact_lists"));
  assert.equal(lists.length, 2);
  assert.ok(lists.some((s) => s.includes("'Work'")));
  assert.ok(lists.some((s) => s.includes("'Close'")));
  assert.equal(stmts.filter((s) => s.startsWith("insert into contact_list_members")).length, 4);

  const idOf = Object.fromEntries(H.people.map((p) => [seedUuid("person:" + p.id), p.id]));
  idOf[seedUuid("person:p-michal")] = "p-michal";
  const follows = stmts.filter((s) => s.startsWith("insert into person_follows")).map((s) => {
    const m = s.match(/values \('([0-9a-f-]{36})', '([0-9a-f-]{36})'/);
    return `${idOf[m[1]]}|${idOf[m[2]]}`;
  }).sort();
  assert.deepEqual(follows, [...H.follows.map(([a, b]) => `${a}|${b}`)].sort());

  const blobs = [];
  for (const s of stmts) {
    const re = /'((?:[^']|'')*)'::jsonb/g;
    let m;
    while ((m = re.exec(s))) {
      let v;
      try { v = JSON.parse(m[1].replace(/''/g, "'")); } catch { continue; }
      if (v && Array.isArray(v.include) && Array.isArray(v.exclude) && Object.keys(v).length === 2) blobs.push(v);
    }
  }
  assert.ok(blobs.length >= 7);
  for (const blob of blobs) assert.equal(audience.safeParse(blob).success, true, JSON.stringify(blob));
  const work = H.lists.find((l) => l.name === "Work").id;
  const close = H.lists.find((l) => l.name === "Close").id;
  for (const aud of [
    { include: ["everyone"], exclude: [] },
    { include: ["friends"], exclude: [] },
    { include: ["fof"], exclude: [] },
    { include: ["followers"], exclude: [] },
    { include: [`list:${close}`], exclude: [] },
    { include: ["everyone"], exclude: [`list:${work}`] },
    { include: ["friends"], exclude: [`list:${work}`] },
  ]) assert.ok(blobs.some((b) => JSON.stringify(b) === JSON.stringify(aud)), JSON.stringify(aud));
});
