// node --test scripts/requests-provider.test.mjs — request providers, including undo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const dialogs = [];
const listeners = {};
const badge = { className: "ncnt", textContent: "0", removed: false };
const navRow = {
  children: [badge],
  querySelector(sel) {
    if (sel === ".ncnt" && !badge.removed) return badge;
    return null;
  },
  appendChild(node) {
    node.parent = this;
    this.children.push(node);
    badge.removed = false;
  },
};

function makeDlg() {
  const body = { innerHTML: "" };
  const title = { textContent: "" };
  const foot = { innerHTML: "" };
  const dlg = {
    attrs: {},
    _rel: null,
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; },
    querySelector(sel) {
      if (sel === ".dbody") return body;
      if (sel === ".dtitle") return title;
      if (sel === ".dfoot") return foot;
      return null;
    },
    classList: { contains(c) { return c === "rel-dlg"; } },
    remove() {
      const i = dialogs.indexOf(this);
      if (i >= 0) dialogs.splice(i, 1);
    },
  };
  dlg.body = body;
  dlg.title = title;
  dialogs.push(dlg);
  return dlg;
}

global.document = {
  addEventListener(type, fn) {
    (listeners[type] || (listeners[type] = [])).push(fn);
  },
  querySelector(sel) {
    if (sel === '.nrow[data-act="navrel"][data-id="openRequests"]') return navRow;
    return null;
  },
  querySelectorAll(sel) {
    if (sel === ".dlg.rel-dlg") return dialogs.slice();
    return [];
  },
  getElementById() { return null; },
  createElement() {
    return { className: "", textContent: "", remove() { this.removed = true; } };
  },
};
const bus = new EventTarget();
global.addEventListener = bus.addEventListener.bind(bus);
global.removeEventListener = bus.removeEventListener.bind(bus);
global.dispatchEvent = bus.dispatchEvent.bind(bus);
global.Event = Event;

require("../_shared/hypernet-audience.js");
const HNRel = require("../_shared/hypernet-rel.js");

global.esc = (s) => String(s == null ? "" : s);
global.S = { loggedIn: true };
global.ONLINE = false;
global.myPid = () => null;
global.person = (id) => ({ displayName: String(id), handle: String(id) });
global.toast = () => {};
global.dialog = (title, html, foot) => {
  const dlg = makeDlg();
  dlg.title.textContent = title;
  dlg.body.innerHTML = html;
  dlg.foot = { innerHTML: foot || "" };
  return dlg;
};

function body() {
  return dialogs.length ? dialogs[dialogs.length - 1].body.innerHTML : "";
}

function click(act, type, id) {
  const button = {
    tagName: "BUTTON",
    getAttribute(k) {
      if (k === "data-rel-act") return act;
      if (k === "data-type") return type;
      if (k === "data-id") return id;
      return null;
    },
    closest(sel) { return sel === "[data-rel-act]" ? button : null; },
  };
  const ev = { target: button, preventDefault() {}, stopPropagation() {} };
  for (const fn of listeners.click || []) fn(ev);
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

function provider(extra) {
  const items = extra.items || [{ id: "a", label: "Alpha" }];
  const bag = {
    type: extra.type,
    label: extra.label || extra.type,
    list: extra.list || (() => items.filter((item) => !bag.gone[item.id])),
    count: extra.count || (() => bag.list().length),
    render: extra.render || ((item) => item.label || item.id),
    accept: extra.accept || ((item) => { bag.gone[item.id] = true; return Promise.resolve(); }),
    decline: extra.decline || ((item) => { bag.gone[item.id] = true; return Promise.resolve(); }),
    gone: {},
    items,
  };
  if (extra.undo) bag.undo = extra.undo;
  if (extra.undoAccept === false) bag.undoAccept = false;
  if (extra.acceptLabel) bag.acceptLabel = extra.acceptLabel;
  if (extra.declineLabel) bag.declineLabel = extra.declineLabel;
  if (extra.hideEmpty) bag.hideEmpty = true;
  const off = HNRel.registerRequestProvider(bag);
  return { off, bag };
}

test("register, replace, and unregister change the count sum", () => {
  const base = HNRel.incomingCount();
  const first = provider({ type: "note", label: "Notes", items: [{ id: "a", label: "A" }, { id: "b", label: "B" }] });
  assert.equal(HNRel.incomingCount(), base + 2);
  const second = provider({ type: "note", label: "Notes again", count: () => 4, list: () => [{ id: "c", label: "C" }] });
  assert.equal(HNRel.incomingCount(), base + 4);
  first.off();
  assert.equal(HNRel.incomingCount(), base + 4);
  HNRel.openRequests();
  assert.match(body(), /Notes again/);
  assert.match(body(), /C/);
  assert.doesNotMatch(body(), /Notes</);
  second.off();
  assert.equal(HNRel.incomingCount(), base);
  HNRel.openRequests();
  assert.doesNotMatch(body(), /Notes again/);
});

test("a throwing provider stays in its own section", () => {
  const base = HNRel.incomingCount();
  const good = provider({ type: "good", label: "Good", items: [{ id: "g", label: "Kept" }] });
  const bad = HNRel.registerRequestProvider({
    type: "bad",
    label: "Bad",
    list() { throw new Error("nope"); },
    count() { throw new Error("nope"); },
    render() { return ""; },
    accept() { return Promise.resolve(); },
    decline() { return Promise.resolve(); },
  });
  assert.equal(HNRel.incomingCount(), base + 1);
  HNRel.openRequests();
  assert.match(body(), /Couldn't load/);
  assert.match(body(), /Kept/);
  assert.match(body(), /Good/);
  good.off();
  bad();
});

test("openRequests highlights a matching item and still opens when it is missing", () => {
  const reg = provider({ type: "spot", label: "Spot", items: [{ id: "hit", label: "Here" }] });
  HNRel.openRequests({ type: "spot", id: "hit" });
  assert.equal(dialogs.at(-1).title.textContent, "Requests");
  assert.match(body(), /reqhit/);
  assert.match(body(), /data-req-id="hit"/);
  assert.match(body(), /Here/);
  HNRel.openRequests({ type: "spot", id: "missing" });
  assert.equal(dialogs.at(-1).title.textContent, "Requests");
  assert.doesNotMatch(body(), /reqhit/);
  assert.match(body(), /Here/);
  reg.off();
});

test("undo keeps the row, drops the badge, and restores Accept and Decline", async () => {
  const base = HNRel.incomingCount();
  badge.textContent = "9";
  let undone = 0;
  let changed = 0;
  const onChanged = () => { changed += 1; };
  global.addEventListener("hn:requests-changed", onChanged);
  let release;
  const reg = provider({
    type: "ping",
    label: "Pings",
    items: [{ id: "1", label: "Ping" }],
    accept: (item) => new Promise((resolve) => { release = () => { reg.bag.gone[item.id] = true; resolve(); }; }),
    decline: (item) => { reg.bag.gone[item.id] = true; return Promise.resolve(); },
    undo: (item) => { undone += 1; delete reg.bag.gone[item.id]; return Promise.resolve(); },
  });
  assert.equal(HNRel.incomingCount(), base + 1);
  HNRel.openRequests();
  click("req-accept", "ping", "1");
  assert.match(body(), /disabled/);
  assert.match(body(), /Accept/);
  release();
  await flush();
  assert.match(body(), /Accepted · /);
  assert.match(body(), /req-undo/);
  assert.match(body(), />Undo</);
  assert.equal(HNRel.incomingCount(), base);
  assert.equal(badge.textContent, String(base));
  assert.ok(changed >= 1);
  const beforeUndo = changed;
  click("req-undo", "ping", "1");
  await flush();
  assert.equal(undone, 1);
  assert.ok(changed > beforeUndo);
  assert.match(body(), />Accept</);
  assert.match(body(), />Decline</);
  assert.doesNotMatch(body(), /reqstate/);
  assert.equal(HNRel.incomingCount(), base + 1);
  click("req-decline", "ping", "1");
  await flush();
  assert.match(body(), /Declined · /);
  assert.match(body(), />Undo</);
  assert.equal(HNRel.incomingCount(), base);
  reg.off();
  global.removeEventListener("hn:requests-changed", onChanged);
});

test("a provider without undo loses the row when the action resolves", async () => {
  const reg = provider({
    type: "plain",
    label: "Plain",
    items: [{ id: "z", label: "Zap" }],
    accept: () => Promise.resolve(),
  });
  HNRel.openRequests();
  assert.match(body(), /Zap/);
  click("req-accept", "plain", "z");
  await flush();
  assert.doesNotMatch(body(), /Zap/);
  assert.doesNotMatch(body(), /Undo/);
  reg.off();
});

test("an async list is read once until it resolves", async () => {
  let calls = 0;
  let release;
  const reg = HNRel.registerRequestProvider({
    type: "later",
    label: "Later",
    list() {
      calls += 1;
      return new Promise((resolve) => { release = () => resolve([{ id: "q", label: "Queued" }]); });
    },
    count: () => 0,
    render: (item) => item.label,
    accept: () => Promise.resolve(),
    decline: () => Promise.resolve(),
  });
  HNRel.openRequests();
  HNRel.requestsHTML();
  assert.equal(calls, 1);
  assert.doesNotMatch(body(), /Queued/);
  release();
  await flush();
  assert.match(body(), /Queued/);
  reg();
});

test("did_you_go undoes No and not Yes", async () => {
  const mem = {};
  global.localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
  global.myPid = () => "p-michal";
  global.EVENTS = { past: { id: "past", title: "Late quay supper", date: "2026-08-02" } };
  global.RSVP = { past: "going" };
  global.WENT = {};
  global.isPast = (iso) => iso < "2026-10-26";
  global.lastDay = (e) => e.date;
  global.HNAPI = { addChronicle() { throw new Error("offline"); } };
  assert.deepEqual(HNRel.chronicleAskIds(), ["past"]);
  HNRel.openRequests();
  assert.match(body(), /Did you go\? Late quay supper/);
  assert.match(body(), />Yes</);
  assert.match(body(), />No</);
  click("req-decline", "did_you_go", "past");
  await flush();
  assert.match(body(), /Declined · /);
  assert.match(body(), />Undo</);
  assert.deepEqual(HNRel.chronicleAskIds(), []);
  assert.match(mem["hn-went-dismiss"], /past/);
  click("req-undo", "did_you_go", "past");
  await flush();
  assert.deepEqual(HNRel.chronicleAskIds(), ["past"]);
  assert.doesNotMatch(mem["hn-went-dismiss"] || "", /past/);
  assert.match(body(), />Yes</);
  assert.match(body(), />No</);
  assert.doesNotMatch(body(), /reqstate/);
  click("req-accept", "did_you_go", "past");
  await flush();
  assert.equal(global.WENT.past, true);
  assert.doesNotMatch(body(), /Late quay supper/);
  assert.doesNotMatch(body(), /Undo/);
});

test("friend_request has no undo after accept or cancel", async () => {
  global.myPid = () => "p-michal";
  global.person = (id) => ({ "p-tomas": { displayName: "Tomas Berg", handle: "tomas" }, "p-jon": { displayName: "Jon Hale", handle: "jon" } }[id] || { displayName: id, handle: id });
  global.ONLINE = false;
  HNRel.ingest({
    friendships: [
      { a: "p-michal", b: "p-tomas", requestedBy: "p-tomas", status: "pending" },
      { a: "p-jon", b: "p-michal", requestedBy: "p-michal", status: "pending" },
    ],
  });
  HNRel.openRequests();
  assert.match(body(), /Friend requests/);
  assert.match(body(), /Incoming/);
  assert.match(body(), /Outgoing/);
  assert.match(body(), /Tomas Berg/);
  assert.match(body(), />Accept</);
  assert.match(body(), />Decline</);
  assert.match(body(), /Jon Hale/);
  assert.match(body(), />Cancel</);
  click("req-accept", "friend_request", "in:p-tomas");
  await flush();
  assert.doesNotMatch(body(), /Tomas Berg/);
  assert.doesNotMatch(body(), /Accepted · /);
  assert.match(body(), /No incoming requests/);
  click("req-decline", "friend_request", "out:p-jon");
  await flush();
  assert.doesNotMatch(body(), /Jon Hale/);
  assert.doesNotMatch(body(), /Declined · /);
  assert.match(body(), /No outgoing requests/);
});
