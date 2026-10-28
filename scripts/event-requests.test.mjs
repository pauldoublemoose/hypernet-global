// node --test scripts/event-requests.test.mjs — event request providers and the invite role picker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("../_shared/event-requests.js", import.meta.url)), "utf8");

function boot(opts){
  opts = opts || {};
  const calls = { changed: 0, rsvp: [], chronicle: [], admin: [], review: [] };
  const providers = [];
  const sandbox = {
    location: { search: opts.search == null ? "?offline=1" : opts.search },
    RSVP: {},
    ROLE: {},
    WENT: {},
    EVENT_INVITES: {},
    EVENT_ADMINS: {},
    COREQUESTS: {},
    COINVITES: {},
    CHRON: {},
    EVENTS: {
      "evt-harbour-walk": { title: "Harbour night walk", date: "2026-11-01", city: "Stockholm" },
      "evt-chronicle-supper": { title: "Midsummer supper", date: "2026-06-20", city: "Stockholm" },
      "evt-dj-night": { title: "West stage set", date: "2026-11-02", city: "Malmö" },
      "evt-deep-listening": { title: "Deep Listening Lab", date: "2026-11-04", city: "Stockholm" },
    },
    ONLINE: !!opts.online,
    HNAPI: {
      rsvp(id, fields){ calls.rsvp.push({ id, fields }); return Promise.resolve(); },
      addChronicle(id){ calls.chronicle.push(id); return Promise.resolve(); },
      answerAdmin(id, status){ calls.admin.push({ id, status }); return Promise.resolve(); },
      reviewCocreator(id, pid, action){ calls.review.push({ id, pid, action }); return Promise.resolve(); },
    },
    myActor: () => opts.me || "p-michal",
    person: (id) => ({ displayName: id }),
    isPast: (day) => day < "2026-10-01",
    lastDay: (e) => e && e.date,
    fmtShort: (iso) => iso,
    canManageEvent: (id) => !!opts.manage && opts.manage[id],
    cocreatorPolicyOf: (id) => (opts.policy && opts.policy[id]) || "open",
  };
  sandbox.window = sandbox;
  if (opts.hnrel !== false){
    sandbox.HNRel = {
      registerRequestProvider(p){ providers.push(p); return function off(){ const i = providers.indexOf(p); if (i >= 0) providers.splice(i, 1); }; },
      requestsChanged(){ calls.changed += 1; },
      openRequests(arg){ calls.open = arg; },
    };
  }
  if (opts.before) opts.before(sandbox);
  runInContext(source, createContext(sandbox), { filename: "event-requests.js" });
  return { sandbox, providers, calls };
}

function byType(providers, type){
  return providers.filter((p) => p.type === type)[0];
}

test("providers register in order and replace the inbox with two offline rows each", () => {
  const { providers } = boot();
  assert.deepEqual(providers.map((p) => p.type), ["event_invite", "admin_invite", "cocreator_request"]);
  const event = byType(providers, "event_invite");
  const admin = byType(providers, "admin_invite");
  const coco = byType(providers, "cocreator_request");
  assert.equal(event.list().length, 2);
  assert.equal(admin.list().length, 2);
  assert.equal(coco.list().length, 2);
  assert.equal(event.count(), 2);
  const past = event.list().filter((item) => item.past)[0];
  const upcoming = event.list().filter((item) => !item.past)[0];
  assert.match(past.primary, /added you to a past event/);
  assert.equal(past.primary.includes("invited to attend"), false);
  assert.match(upcoming.primary, /invited you to attend/);
  const dirs = JSON.parse(JSON.stringify(coco.list().map((item) => item.direction).sort()));
  assert.deepEqual(dirs, ["invite", "request"]);
  for (const item of event.list().concat(admin.list(), coco.list())){
    const html = event.render ? null : null;
    const rendered = (item.direction === "request" || item.direction === "invite") && coco.list().includes(item)
      ? coco.render(item)
      : admin.list().includes(item) ? admin.render(item) : event.render(item);
    assert.match(rendered, /data-act="openreq"/);
    assert.match(rendered, new RegExp('data-id="' + item.id + '"'));
  }
});

test("a provider registers when HNRel arrives later", () => {
  const { sandbox, providers } = boot({ hnrel: false });
  assert.equal(providers.length, 0);
  const seen = [];
  sandbox.HNRel = {
    registerRequestProvider(p){ seen.push(p.type); return function(){}; },
    requestsChanged(){},
  };
  assert.deepEqual(seen, ["event_invite", "admin_invite", "cocreator_request"]);
});

test("accept, decline and undo an event invite through the stub", async () => {
  const { sandbox, providers, calls } = boot({ online: true });
  const event = byType(providers, "event_invite");
  const upcoming = event.list().filter((item) => !item.past)[0];
  const past = event.list().filter((item) => item.past)[0];
  await event.accept(upcoming);
  assert.equal(sandbox.RSVP[upcoming.eventId], "going");
  assert.equal(sandbox.ROLE[upcoming.eventId], "attendee");
  assert.equal(calls.rsvp.at(-1).fields.role, "attendee");
  assert.equal(event.list().some((item) => item.id === upcoming.id), false);
  await event.undo(upcoming);
  assert.equal(sandbox.RSVP[upcoming.eventId], undefined);
  assert.equal(sandbox.ROLE[upcoming.eventId], undefined);
  assert.equal(event.list().some((item) => item.id === upcoming.id), true);
  await event.accept(past);
  assert.equal(sandbox.WENT[past.eventId], true);
  assert.equal(sandbox.ROLE[past.eventId], "attendee");
  assert.deepEqual(calls.chronicle, [past.eventId]);
  await event.undo(past);
  assert.equal(sandbox.WENT[past.eventId], undefined);
  await event.decline(upcoming);
  assert.equal(event.list().some((item) => item.id === upcoming.id), false);
  await event.undo(upcoming);
  assert.equal(event.list().some((item) => item.id === upcoming.id), true);
  assert.ok(calls.changed > 0);
});

test("accept, decline and undo an admin invite", async () => {
  const { sandbox, providers, calls } = boot({ online: true });
  const admin = byType(providers, "admin_invite");
  const item = admin.list()[0];
  await admin.accept(item);
  assert.equal(calls.admin.at(-1).status, "accepted");
  assert.equal(admin.list().some((row) => row.id === item.id), false);
  await admin.undo(item);
  assert.equal(admin.list().some((row) => row.id === item.id), true);
  const again = admin.list().filter((row) => row.id === item.id)[0];
  await admin.decline(again);
  assert.equal(calls.admin.at(-1).status, "declined");
  assert.equal(admin.list().some((row) => row.id === again.id), false);
  await admin.undo(again);
  assert.equal(admin.list().some((row) => row.id === again.id), true);
  assert.equal((sandbox.EVENT_ADMINS[again.eventId] || []).some((row) => row.status === "pending"), true);
});

test("co-creator request and invite accept, decline and undo", async () => {
  const { sandbox, providers, calls } = boot({ online: true, manage: { "evt-chronicle-supper": true }, policy: { "evt-harbour-walk": "open" } });
  const coco = byType(providers, "cocreator_request");
  const request = coco.list().filter((item) => item.direction === "request")[0];
  const invite = coco.list().filter((item) => item.direction === "invite")[0];
  await coco.accept(request);
  assert.equal(calls.review.at(-1).action, "approve");
  assert.equal(sandbox.CHRON[request.personId][request.eventId], "cocreator");
  await coco.undo(request);
  assert.equal(sandbox.CHRON[request.personId][request.eventId], undefined);
  assert.equal(coco.list().some((item) => item.id === request.id), true);
  const request2 = coco.list().filter((item) => item.id === request.id)[0];
  await coco.decline(request2);
  assert.equal(calls.review.at(-1).action, "decline");
  await coco.undo(request2);
  await coco.accept(invite);
  assert.equal(sandbox.ROLE[invite.eventId], "cocreator");
  assert.equal(calls.rsvp.at(-1).fields.role, "cocreator");
  await coco.undo(invite);
  assert.equal(sandbox.ROLE[invite.eventId], undefined);
  await coco.decline(invite);
  assert.equal(coco.list().some((item) => item.id === invite.id), false);
  await coco.undo(invite);
  assert.equal(coco.list().some((item) => item.id === invite.id), true);
});

test("managers see three invite roles and each sends its type", () => {
  const { sandbox } = boot({ search: "" });
  const html = sandbox.EventRequests.rolePickerHTML(true);
  assert.match(html, /class="ccrole"/);
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /> Guest</);
  assert.match(html, /> Co-creator</);
  assert.match(html, /> Admin</);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.EventRequests.inviteRoles(true))), ["guest", "cocreator", "admin"]);
  const guestOnly = sandbox.EventRequests.rolePickerHTML(false);
  assert.match(guestOnly, /> Guest</);
  assert.equal(guestOnly.includes("Co-creator"), false);
  assert.equal(guestOnly.includes("Admin"), false);
  const base = { eventId: "evt-harbour-walk", personId: "p-anna", canInvite: true };
  assert.equal(sandbox.EventRequests.send({ ...base, role: "guest", canManage: true }).type, "event_invite");
  assert.equal(sandbox.EventRequests.send({ ...base, role: "cocreator", canManage: true }).type, "cocreator_request");
  assert.equal(sandbox.COINVITES["evt-harbour-walk"][0].inviteeId, "p-anna");
  assert.equal(sandbox.EventRequests.send({ ...base, role: "admin", canManage: true }).type, "admin_invite");
  assert.equal(sandbox.EVENT_ADMINS["evt-harbour-walk"][0].status, "pending");
  assert.equal(sandbox.EventRequests.send({ ...base, role: "admin", canManage: false }).type, "event_invite");
  assert.equal(sandbox.EventRequests.send({ ...base, role: "guest", canManage: false, canInvite: false }), null);
  assert.equal(sandbox.EventRequests.send({ ...base, role: "admin", canManage: true, canInvite: false }).type, "admin_invite");
});

test("offline fixtures stay out when the page is not offline", () => {
  const { providers } = boot({ search: "" });
  assert.equal(byType(providers, "event_invite").list().length, 0);
  assert.equal(byType(providers, "admin_invite").list().length, 0);
  assert.equal(byType(providers, "cocreator_request").list().length, 0);
});
