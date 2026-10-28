// node --test scripts/callout-actions.test.mjs — HNCallouts mine, interacted, and onChange.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("../_shared/callout-actions.js", import.meta.url)), "utf8");

function boot(){
  const stored = {};
  const sandbox = {
    S: { acct: "demo", loggedIn: true },
    CALLOUTS: [
      { id: "co-old", title: "Older", body: "a", eventId: "evt-1", skill: null, expiresAt: "2026-12-01", closed: false, hostId: "p-michal", hostName: "Michal", hostAcct: "demo", createdAt: 10 },
      { id: "co-new", title: "Newer", body: "b", eventId: "evt-2", skill: "sound", expiresAt: "2026-12-02", closed: false, hostId: "p-michal", hostName: "Michal", hostAcct: "demo", createdAt: 30 },
      { id: "co-other", title: "Theirs", body: "c", eventId: "evt-3", skill: null, expiresAt: "2026-12-03", closed: false, hostId: "p-anna", hostName: "Anna Vale", hostAcct: null, createdAt: 20 },
      { id: "co-else", title: "Else", body: "d", eventId: null, skill: null, expiresAt: "2026-12-04", closed: true, hostId: "p-rio", hostName: "Rio Moss", hostAcct: null, createdAt: 5 },
    ],
    COBOOST: {},
    COMARK: {},
    REPLIES: [],
    myActor: () => "p-michal",
    isOwnCallout: (c) => !!(c && c.hostAcct === "demo"),
    calloutPostedMs: (id) => ({ "co-old": 10, "co-new": 30, "co-other": 20, "co-else": 5 })[id] || 0,
    repliesOf: (id) => sandbox.REPLIES.filter((r) => r.calloutId === id),
    isoMs: (ts) => Number(ts) || 0,
    localStorage: {
      getItem: (k) => (k in stored ? stored[k] : null),
      setItem: (k, v) => { stored[k] = v; },
    },
    storeSet: (k, v) => { stored[k] = v; return true; },
  };
  sandbox.window = sandbox;
  runInContext(source, createContext(sandbox), { filename: "callout-actions.js" });
  return { sandbox, stored };
}

test("mine is my call outs, newest first, with the call out fields", async () => {
  const { sandbox } = boot();
  const rows = await sandbox.HNCallouts.mine();
  assert.deepEqual(JSON.parse(JSON.stringify(rows.map((c) => c.id))), ["co-new", "co-old"]);
  const fields = Object.keys(JSON.parse(JSON.stringify(rows[0]))).sort();
  assert.deepEqual(fields, ["body", "closed", "eventId", "expiresAt", "hostAcct", "hostId", "hostName", "id", "skill", "title"]);
  assert.equal(JSON.parse(JSON.stringify(rows[0])).title, "Newer");
  assert.equal(JSON.parse(JSON.stringify(rows[0])).eventId, "evt-2");
});

test("interacted lists boost, bookmark and reply, newest first, excluding my own", async () => {
  const { sandbox } = boot();
  sandbox.COBOOST["co-other"] = 100;
  sandbox.COBOOST["co-new"] = 500;
  sandbox.COMARK["co-else"] = 300;
  sandbox.REPLIES.push({ calloutId: "co-other", author: "p-michal", ts: 250, text: "yes" });
  sandbox.REPLIES.push({ calloutId: "co-else", author: "p-anna", ts: 900, text: "no" });
  const rows = JSON.parse(JSON.stringify(await sandbox.HNCallouts.interacted()));
  assert.deepEqual(rows.map((row) => row.callout.id), ["co-else", "co-other"]);
  assert.deepEqual(rows[0].kinds, ["bookmark"]);
  assert.equal(rows[0].at, 300);
  assert.deepEqual(rows[1].kinds, ["boost", "reply"]);
  assert.equal(rows[1].at, 250);
  assert.equal(rows.some((row) => row.callout.id === "co-new"), false);
});

test("onChange fires until the caller turns it off", () => {
  const { sandbox } = boot();
  let n = 0;
  const off = sandbox.HNCalloutsPing && sandbox.HNCallouts.onChange(() => { n += 1; });
  sandbox.HNCalloutsPing();
  sandbox.HNCalloutsPing();
  off();
  sandbox.HNCalloutsPing();
  assert.equal(n, 2);
});

test("bookmark and boost stay in the account local store", () => {
  const { sandbox, stored } = boot();
  sandbox.COBOOST["co-other"] = 4;
  sandbox.COMARK["co-else"] = 9;
  assert.equal(sandbox.HNCalloutStore.save(), true);
  sandbox.COBOOST = {};
  sandbox.COMARK = {};
  sandbox.HNCalloutStore.load();
  assert.equal(JSON.parse(JSON.stringify(sandbox.COBOOST))["co-other"], 4);
  assert.equal(JSON.parse(JSON.stringify(sandbox.COMARK))["co-else"], 9);
  assert.match(Object.keys(stored)[0], /^hypernet-feed:callouts:demo$/);
});
