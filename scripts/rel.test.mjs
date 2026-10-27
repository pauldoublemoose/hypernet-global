// node --test scripts/rel.test.mjs — relOf is a follow boolean plus one friendship row.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { pairKey } = require("../_shared/hypernet-audience.js");
const { relOf, kind, controlOf, openContacts, ingest, ingestLists, chronicleAskIds, requestsHTML, answerWent } = require("../_shared/hypernet-rel.js");

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

test("openContacts is the tabbed page for Lists, Friends, Following, and Follows me", () => {
  const htmlSrc = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const start = htmlSrc.indexOf("function tabbedCollection(spec){");
  const end = htmlSrc.indexOf("\nfunction tabbedHosted");
  assert.ok(start >= 0 && end > start);
  global.tabbedCollection = eval("(" + htmlSrc.slice(start, end) + ")");
  const mem = {};
  global.localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
  const prev = {
    esc: global.esc, S: global.S, myPid: global.myPid, PEOPLE: global.PEOPLE, person: global.person,
    PFOLLOW: global.PFOLLOW, NETFOLLOWS: global.NETFOLLOWS, dialog: global.dialog, loginDialog: global.loginDialog, ONLINE: global.ONLINE,
  };
  global.esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  global.S = { loggedIn: true };
  global.myPid = () => "p-michal";
  global.ONLINE = false;
  global.PEOPLE = {
    "p-anna": { displayName: "Anna Vale", handle: "anna" },
    "p-mira": { displayName: "Mira Chen", handle: "mira" },
    "p-oskar": { displayName: "Oskar Lind", handle: "oskar" },
    "p-yuki": { displayName: "Yuki Sato", handle: "yuki" },
    "p-lena": { displayName: "Lena Brandt", handle: "lena" },
    "p-priya": { displayName: "Priya Raman", handle: "priya" },
    "p-rio": { displayName: "Rio Moss", handle: "rio" },
    "p-kai": { displayName: "Kai Okonkwo", handle: "kai" },
    "p-sasha": { displayName: "Sasha Reed", handle: "sasha" },
  };
  global.person = (id) => global.PEOPLE[id];
  global.PFOLLOW = { "p-anna": true, "p-rio": true, "p-kai": true, "p-sasha": true };
  global.NETFOLLOWS = {
    "p-michal": ["p-anna", "p-rio", "p-kai", "p-sasha"],
    "p-lena": ["p-michal"],
    "p-priya": ["p-michal"],
  };
  ingest({
    friendships: [
      { a: "p-anna", b: "p-michal", requestedBy: "p-michal", status: "accepted" },
      { a: "p-michal", b: "p-mira", requestedBy: "p-mira", status: "accepted" },
      { a: "p-michal", b: "p-oskar", requestedBy: "p-oskar", status: "accepted" },
      { a: "p-michal", b: "p-yuki", requestedBy: "p-michal", status: "accepted" },
    ],
  });
  ingestLists([
    { id: "11111111-1111-4111-8111-111111111111", name: "Work", memberIds: ["p-anna", "p-rio"] },
    { id: "22222222-2222-4222-8222-222222222222", name: "Close", memberIds: ["p-mira", "p-kai"] },
  ]);
  let opened = null;
  global.goFolder = (f) => { global.S.folder = { kind: f.kind, id: f.id || null }; };
  global.render = () => { opened = { folder: global.S.folder, html: global.HNRel.contactsHTML() }; };
  const tabIds = (html) => [...html.matchAll(/data-act="tctab" data-id="([^"]+)"/g)].map((m) => m[1]);
  openContacts();
  assert.equal(opened.folder.kind, "contacts");
  assert.equal(opened.folder.id, "lists");
  assert.match(opened.html, /class="tcoll"/);
  assert.match(opened.html, /class="tc-bar"/);
  assert.match(opened.html, /class="row"/);
  assert.deepEqual(tabIds(opened.html), ["lists", "friends", "following", "follows"]);
  assert.match(opened.html, /Lists/);
  assert.match(opened.html, /Friends/);
  assert.match(opened.html, /Following/);
  assert.match(opened.html, /Follows me/);
  assert.match(opened.html, />Rows</);
  assert.match(opened.html, />Squares</);
  assert.match(opened.html, /New list/);
  assert.match(opened.html, /Work/);
  assert.match(opened.html, /Close/);
  assert.match(opened.html, /2 people/);
  assert.doesNotMatch(opened.html, /Anna Vale/);
  openContacts("friends");
  for (const name of ["Anna Vale", "Mira Chen", "Oskar Lind", "Yuki Sato"]) assert.match(opened.html, new RegExp(name));
  assert.match(opened.html, /Unfriend/);
  assert.doesNotMatch(opened.html, /Work/);
  openContacts("following");
  for (const name of ["Anna Vale", "Rio Moss", "Kai Okonkwo", "Sasha Reed"]) assert.match(opened.html, new RegExp(name));
  assert.match(opened.html, /Unfollow/);
  assert.doesNotMatch(opened.html, /Lena Brandt/);
  openContacts("follows");
  assert.match(opened.html, /Lena Brandt/);
  assert.match(opened.html, /Priya Raman/);
  assert.doesNotMatch(opened.html, /Unfriend/);
  mem["hypernet-contacts-view"] = "squares";
  openContacts("friends");
  assert.match(opened.html, /tc-squares/);
  assert.match(opened.html, /card2/);
  assert.match(opened.html, /Anna Vale/);
  delete mem["hypernet-contacts-view"];
  opened = null;
  let asked = 0;
  global.S = { loggedIn: false };
  global.loginDialog = () => { asked += 1; };
  openContacts();
  assert.equal(asked, 1);
  assert.equal(opened, null);
  global.esc = prev.esc; global.S = prev.S; global.myPid = prev.myPid; global.PEOPLE = prev.PEOPLE; global.person = prev.person;
  global.PFOLLOW = prev.PFOLLOW; global.NETFOLLOWS = prev.NETFOLLOWS; global.dialog = prev.dialog; global.loginDialog = prev.loginDialog; global.ONLINE = prev.ONLINE;
});

test("the relationship control is one menu for the state", () => {
  const none = { friend: "friend-none", following: false };
  assert.deepEqual(controlOf(none), { label: "Follow", tone: "primary", items: ["Follow", "Add friend", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "friend-none", following: true }), { label: "Following", tone: "on", items: ["Unfollow", "Add friend", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "requested-out", following: false }), { label: "Requested", tone: "", items: ["Cancel request", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "requested-in", following: true }), { label: "Respond", tone: "primary", items: ["Accept", "Decline", "Add to list"] });
  assert.deepEqual(controlOf({ friend: "friends", following: true }), { label: "Friends", tone: "on", items: ["Unfriend", "Add to list"] });
});

test("Did you go lists a past Going with no chronicle, and No makes no request", () => {
  global.EVENTS = {
    past: { id: "past", title: "Late quay supper", date: "2026-08-02" },
    later: { id: "later", title: "Later", date: "2099-01-01" },
    filed: { id: "filed", title: "Filed", date: "2026-01-01" },
  };
  global.RSVP = { past: "going", later: "going", filed: "going" };
  global.WENT = { filed: true };
  global.isPast = (iso) => iso < "2026-10-26";
  global.lastDay = (e) => e.date;
  global.myPid = () => "p-michal";
  global.esc = (s) => String(s);
  global.person = (id) => ({ displayName: id, handle: id });
  global.S = { loggedIn: true };
  global.ONLINE = false;
  let posts = 0;
  global.HNAPI = { addChronicle() { posts += 1; return Promise.resolve({ chronicle: { went: true } }); } };
  assert.deepEqual(chronicleAskIds(), ["past"]);
  assert.match(requestsHTML(), /Did you go to Late quay supper/);
  answerWent("past", false);
  assert.equal(posts, 0);
  assert.deepEqual(chronicleAskIds(), []);
  global.RSVP.again = "going";
  global.EVENTS.again = { id: "again", title: "Again", date: "2026-07-01" };
  answerWent("again", true);
  assert.equal(posts, 0);
  assert.equal(global.WENT.again, true);
  global.ONLINE = true;
  global.RSVP.live = "going";
  global.EVENTS.live = { id: "live", title: "Live", date: "2026-06-01" };
  answerWent("live", true);
  assert.equal(posts, 1);
  assert.equal(global.WENT.live, undefined);
});
