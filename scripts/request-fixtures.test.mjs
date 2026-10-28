// node --test scripts/request-fixtures.test.mjs — offline inbox fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
global.location = { search: "?offline=1" };
require("../_shared/hypernet-audience.js");
const HNRel = require("../_shared/hypernet-rel.js");

global.esc = (s) => String(s == null ? "" : s);
global.myPid = () => "p-michal";
global.S = { loggedIn: true, acct: "demo", folder: { kind: "home", id: null } };
global.person = (id) => ({
  "p-anna": { displayName: "Anna Vale", handle: "anna" },
  "p-rio": { displayName: "Rio Moss", handle: "rio" },
  "p-kai": { displayName: "Kai Okonkwo", handle: "kai" },
  "p-sasha": { displayName: "Sasha Reed", handle: "sasha" },
}[id] || { displayName: id, handle: id });
global.avHTML = () => "<span class=\"av\"></span>";
global.fmtShort = (iso) => iso;
global.EVENTS = {
  "evt-harbour-walk": { title: "Harbour night walk", date: "2026-10-01", city: "Stockholm" },
  "evt-dj-night": { title: "West stage set", date: "2026-10-02", city: "Malmö" },
  "evt-chronicle-supper": { title: "Midsummer supper", date: "2026-06-20", city: "Stockholm" },
};
global.isPast = () => false;
global.lastDay = (e) => e && e.date;

test("offline fixtures fill the four invite categories and a real provider replaces one", () => {
  const html = HNRel.requestsHTML();
  for (const line of [
    "Anna Vale invited you to Harbour night walk",
    "Rio Moss invited you to be an admin of West stage set",
    "Kai Okonkwo asked to be a co-creator of Midsummer supper",
    "Sasha Reed invited you to follow Winter Choir",
  ]) assert.match(html, new RegExp(line));
  const bands = [...html.matchAll(/class="band">([^<]+)/g)].map((m) => m[1].trim());
  assert.deepEqual(bands, ["Event invites", "Admin invites", "Co-creator requests", "Horizon invites"]);
  assert.equal(HNRel.incomingCount(), 4);
  const off = HNRel.registerRequestProvider({
    type: "event_invite",
    label: "Real event invites",
    list: () => [{ id: "live", personId: "p-anna", primary: "Live invite", secondary: "Now" }],
    count: () => 1,
    render: (item) => item.primary,
    accept: () => Promise.resolve(),
    decline: () => Promise.resolve(),
  });
  const replaced = HNRel.requestsHTML();
  assert.match(replaced, /Real event invites/);
  assert.match(replaced, /Live invite/);
  assert.doesNotMatch(replaced, /Harbour night walk/);
  assert.match(replaced, /Winter Choir/);
  off();
  const restored = HNRel.requestsHTML();
  assert.match(restored, /Harbour night walk/);
  assert.doesNotMatch(restored, /Real event invites/);
});
