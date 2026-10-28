import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const clicks = [];
global.document = {
  addEventListener(type, fn) { clicks.push(fn); }
};
global.HNAudience = null;
require("../_shared/hypernet-audience.js");
const HNCog = require("../_shared/hypernet-cog.js");

function clickSave() {
  const btn = {
    closest(sel) { return sel === '[data-act="hncog-save"]' ? btn : null; }
  };
  clicks[0]({ target: btn, preventDefault() {}, stopPropagation() {} });
}

test("canEdit false mounts nothing and off is a no-op", () => {
  const el = {};
  let opened = 0;
  global.openItemMenu = () => { opened += 1; };
  const off = HNCog.mount(el, { kind: "horizon", id: "h", canEdit: false, saveAudience() {} });
  HNCog.open(el);
  off();
  HNCog.open(el);
  assert.equal(opened, 0);
});

test("a horizon without saveAudience throws at mount", () => {
  assert.throws(
    () => HNCog.mount({}, { kind: "horizon", id: "h", canEdit: true }),
    /saveAudience/
  );
});

test("horizon menu is Visibility, then items, and danger is kept", () => {
  const el = {};
  let menu = null;
  global.openItemMenu = (btn, id, items) => { menu = items; };
  const seen = [];
  HNCog.mount(el, {
    kind: "horizon",
    id: "horizon-choir",
    title: "Winter Choir",
    canEdit: true,
    audience: { include: ["friends"], exclude: [] },
    saveAudience() { return Promise.resolve(); },
    items: [
      { id: "share", label: "Share", icon: "share", onClick() { seen.push("share"); } },
      { id: "drop", label: "Delete", icon: "trash", danger: true, onClick() { seen.push("drop"); } }
    ]
  });
  HNCog.open(el);
  assert.deepEqual(menu.map((it) => it.label), ["Visibility", "Share", "Delete"]);
  assert.equal(menu[0].icon, "eye");
  assert.equal(menu[1].danger, false);
  assert.equal(menu[2].danger, true);
  menu[1].run();
  menu[2].run();
  assert.deepEqual(seen, ["share", "drop"]);
});

test("event extras sit below Visibility and Permissions", () => {
  const el = {};
  let menu = null;
  global.openItemMenu = (btn, id, items) => { menu = items; };
  global.eventCogItems = () => [
    { heading: "Admin controls" },
    { label: "Edit", icon: "edit" },
    { label: "Visibility and Permissions", icon: "eye" },
    { label: "Delete", icon: "trash" }
  ];
  HNCog.mount(el, {
    kind: "event",
    id: "evt-1",
    title: "Supper",
    canEdit: true,
    audience: "friends",
    items: [{ id: "note", label: "Note", onClick() {} }]
  });
  HNCog.open(el);
  assert.deepEqual(menu.map((it) => it.label || it.heading), ["Admin controls", "Edit", "Visibility and Permissions", "Note", "Delete"]);
});

test("Save calls saveAudience with the normalised audience", async () => {
  const el = {};
  let menu = null;
  const dlg = {
    _hncog: null,
    querySelector(sel) { return sel === ".hncog-err" ? this.err : null; },
    err: { hidden: true, textContent: "" }
  };
  global.DLGS = [];
  global.dialog = () => { global.DLGS.push(dlg); };
  global.closeDialogs = () => { global.DLGS = []; global.closed = true; };
  global.closed = false;
  global.openItemMenu = (btn, id, items) => { menu = items; };
  let saved = null;
  HNCog.mount(el, {
    kind: "horizon",
    id: "horizon-choir",
    title: "Winter Choir",
    canEdit: true,
    audience: { include: ["friends", "everyone"], exclude: ["friends"] },
    saveAudience(aud) { saved = aud; return Promise.resolve(); },
    onChange(aud) { saved = { changed: aud }; }
  });
  HNCog.open(el);
  menu[0].run();
  clickSave();
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(saved, { changed: { include: ["everyone"], exclude: ["friends"] } });
  assert.equal(global.closed, true);
});

test("a rejected save leaves the dialog open with an error", async () => {
  const el = {};
  let menu = null;
  const dlg = {
    err: { hidden: true, textContent: "" },
    querySelector(sel) { return sel === ".hncog-err" ? this.err : null; }
  };
  global.DLGS = [];
  global.dialog = () => { global.DLGS.push(dlg); };
  global.closed = false;
  global.closeDialogs = () => { global.closed = true; };
  global.openItemMenu = (btn, id, items) => { menu = items; };
  HNCog.mount(el, {
    kind: "horizon",
    id: "h",
    canEdit: true,
    audience: { include: ["friends"], exclude: [] },
    saveAudience() { return Promise.reject(new Error("offline")); }
  });
  HNCog.open(el);
  menu[0].run();
  clickSave();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(global.closed, false);
  assert.equal(dlg.err.hidden, false);
  assert.equal(dlg.err.textContent, "offline");
  assert.equal(global.DLGS.length, 1);
});

test("off stops a later open", () => {
  const el = {};
  let opened = 0;
  global.openItemMenu = () => { opened += 1; };
  const off = HNCog.mount(el, {
    kind: "event",
    id: "evt-1",
    canEdit: true,
    saveAudience() { return Promise.resolve(); }
  });
  off();
  HNCog.open(el);
  assert.equal(opened, 0);
});
