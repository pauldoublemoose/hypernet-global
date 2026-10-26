// node --test scripts/event-access.test.mjs — who may edit an event page, invite, and set a role.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EVENT_PERMS,
  allows,
  canEditEvent,
  canInviteGuest,
  canManageEvent,
  cocreatorPolicyOf,
  rsvpRoleDecision,
  seatOf,
} from "../lib/event-access.ts";

const HOST = "00000000-0000-4000-8000-0000000000aa";
const ADMIN = "00000000-0000-4000-8000-0000000000bb";
const OTHER = "00000000-0000-4000-8000-0000000000cc";

function access(over) {
  return {
    viewerId: OTHER,
    hostId: HOST,
    acceptedAdmin: false,
    linkAdder: false,
    rsvpRole: null,
    ...over,
  };
}

test("host and admin can edit; a co-creator cannot", () => {
  assert.equal(canEditEvent(access({ viewerId: HOST })), true);
  assert.equal(canManageEvent(access({ viewerId: HOST })), true);
  assert.equal(canEditEvent(access({ viewerId: ADMIN, acceptedAdmin: true })), true);
  assert.equal(canManageEvent(access({ viewerId: ADMIN, acceptedAdmin: true })), true);
  assert.equal(canEditEvent(access({ rsvpRole: "cocreator" })), false);
  assert.equal(canManageEvent(access({ rsvpRole: "cocreator" })), false);
  assert.equal(seatOf(access({ rsvpRole: "cocreator" })), "cocreator");
});

test("a link adder can edit and cannot manage or change privacy", () => {
  const link = access({ linkAdder: true, hostId: null });
  assert.equal(seatOf(link), "link_adder");
  assert.equal(canEditEvent(link), true);
  assert.equal(canManageEvent(link), false);
  assert.equal(allows("privacy", "link_adder"), false);
  assert.equal(allows("privacy", "host"), true);
  assert.equal(allows("privacy", "admin"), true);
});

test("only the host removes an admin", () => {
  assert.equal(allows("removeAdmin", "host"), true);
  assert.equal(allows("removeAdmin", "admin"), false);
  assert.equal(allows("removeAdmin", "cocreator"), false);
});

test("an admin can demote a co-creator", () => {
  assert.equal(allows("demoteCocreator", "admin"), true);
  assert.equal(allows("demoteCocreator", "host"), true);
  assert.equal(allows("demoteCocreator", "cocreator"), false);
  assert.equal(allows("demoteCocreator", "attendee"), false);
});

test("open lets anyone claim co-creator, and admins refuses a self-claim", () => {
  assert.deepEqual(rsvpRoleDecision("guest", "cocreator", "open"), { write: true, value: "cocreator", pending: false });
  for (const seat of ["guest", "attendee", "cocreator", "link_adder"]) {
    const d = rsvpRoleDecision(seat, "cocreator", "admins");
    assert.equal(d.write, false);
    assert.equal(d.pending, null);
    assert.match(d.error, /admins/);
  }
  assert.deepEqual(rsvpRoleDecision("host", "cocreator", "admins"), { write: true, value: "cocreator", pending: false });
  assert.deepEqual(rsvpRoleDecision("admin", "cocreator", "admins"), { write: true, value: "cocreator", pending: false });
});

test("on request stores a pending flag and shows attendee until an admin approves", () => {
  assert.deepEqual(rsvpRoleDecision("guest", "cocreator", "request"), { write: true, value: "attendee", pending: true });
  assert.deepEqual(rsvpRoleDecision("attendee", "cocreator", "request"), { write: true, value: "attendee", pending: true });
  assert.deepEqual(rsvpRoleDecision("admin", "cocreator", "request"), { write: true, value: "cocreator", pending: false });
});

test("approve writes cocreator and decline only clears the request", () => {
  const route = readFileSync(new URL("../app/api/events/[id]/cocreators/route.ts", import.meta.url), "utf8");
  const validation = readFileSync(new URL("../lib/validation.ts", import.meta.url), "utf8");
  const rsvp = readFileSync(new URL("../app/api/events/[id]/rsvp/route.ts", import.meta.url), "utf8");
  assert.match(validation, /cocreatorPolicy: z\.enum\(\["open", "request", "admins"\]\)/);
  assert.match(validation, /action: z\.enum\(\["approve", "decline"\]\)/);
  assert.equal(allows("reviewCocreator", "guest"), false);
  assert.equal(allows("reviewCocreator", "attendee"), false);
  assert.match(route, /allows\("reviewCocreator", gate\.seat\)/);
  assert.match(route, /Only an admin of this event can review a co-creator request\./);
  assert.match(route, /role = 'cocreator', cocreator_pending = false/);
  const decline = route.slice(route.indexOf(": `update rsvps set cocreator_pending"));
  assert.match(decline, /set cocreator_pending = false/);
  assert.equal(decline.includes("role = 'cocreator'"), false);
  assert.match(rsvp, /if \(decision\.error\) throw forbidden\(decision\.error\)/);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /Cancel request/);
  assert.match(html, /HNAPI\.rsvp\(evId, \{ role:'attendee' \}\)/);
  assert.match(html, /HNAPI\.rsvp\(evId, \{ role:null \}\)/);
  assert.match(html, /data-key="approve"/);
  assert.match(html, /data-key="decline"/);
});

test("a requester can cancel or leave, and a co-creator can leave under every policy", () => {
  for (const policy of ["open", "request", "admins"]) {
    assert.deepEqual(rsvpRoleDecision("attendee", null, policy), { write: true, value: null, pending: false });
    assert.deepEqual(rsvpRoleDecision("attendee", "attendee", policy), { write: true, value: "attendee", pending: false });
    assert.deepEqual(rsvpRoleDecision("cocreator", null, policy), { write: true, value: null, pending: false });
    assert.deepEqual(rsvpRoleDecision("cocreator", "attendee", policy), { write: true, value: "attendee", pending: false });
  }
});

test("a missing policy column reads the old boolean, otherwise open", () => {
  assert.equal(cocreatorPolicyOf(null, true), "admins");
  assert.equal(cocreatorPolicyOf(undefined, false), "open");
  assert.equal(cocreatorPolicyOf("request", true), "request");
});

test("0011 adds cocreator_policy and a pending flag, and does not edit 0010", () => {
  const sql = readFileSync(new URL("../db/migrations/0011_cocreator_policy.sql", import.meta.url), "utf8");
  const old = readFileSync(new URL("../db/migrations/0010_event_admins.sql", import.meta.url), "utf8");
  assert.match(sql, /cocreator_policy text not null default 'open'/);
  assert.match(sql, /check \(cocreator_policy in \('open', 'request', 'admins'\)\)/);
  assert.match(sql, /set cocreator_policy = 'admins' where only_admins_add_cocreators/);
  assert.match(sql, /cocreator_pending boolean not null default false/);
  assert.equal(sql.includes("can_see_event"), false);
  assert.equal(old.includes("cocreator_policy"), false);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /Are you the host\?/);
  assert.match(html, /Is this a new event or did it already happen\?/);
  assert.match(html, /Who can add themselves as co-creator/);
  assert.equal(html.includes("Only admins can add co-creators"), false);
});

test("omitted role is not written and host is only the event host", () => {
  assert.deepEqual(rsvpRoleDecision("guest", undefined, "open"), { write: false, value: null, pending: null });
  assert.deepEqual(rsvpRoleDecision("host", "host", "admins"), { write: true, value: "host", pending: false });
  const denied = rsvpRoleDecision("admin", "host", "open");
  assert.equal(denied.write, false);
  assert.match(denied.error, /host/);
});

test("guests_can_invite lets an attendee, a co-creator, and someone going invite", () => {
  const base = { guestsCanInvite: true, canSee: true, going: false };
  assert.equal(canInviteGuest({ ...base, seat: "attendee", rsvpRole: "attendee" }), true);
  assert.equal(canInviteGuest({ ...base, seat: "cocreator", rsvpRole: "cocreator", going: true }), true);
  assert.equal(canInviteGuest({ ...base, seat: "guest", rsvpRole: null, going: true }), true);
  assert.equal(canInviteGuest({ ...base, seat: "host", rsvpRole: null }), true);
  assert.equal(canInviteGuest({ ...base, seat: "admin", rsvpRole: null }), true);
});

test("guests_can_invite off is admins only and interested-only cannot invite", () => {
  const closed = { guestsCanInvite: false, canSee: true, going: true, rsvpRole: "attendee", seat: "attendee" };
  assert.equal(canInviteGuest(closed), false);
  assert.equal(canInviteGuest({ ...closed, seat: "cocreator", rsvpRole: "cocreator" }), false);
  assert.equal(canInviteGuest({ ...closed, seat: "guest", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...closed, seat: "host", rsvpRole: "host" }), true);
  assert.equal(canInviteGuest({ ...closed, seat: "admin", rsvpRole: null, going: false }), true);
  assert.equal(canInviteGuest({
    guestsCanInvite: true, canSee: true, seat: "guest", rsvpRole: null, going: false,
  }), false);
  assert.equal(canInviteGuest({
    guestsCanInvite: true, canSee: false, seat: "attendee", rsvpRole: "attendee", going: true,
  }), false);
});

test("an invite does not open a private event yet in this build", () => {
  const init = readFileSync(new URL("../db/migrations/0001_init.sql", import.meta.url), "utf8");
  const fn = init.slice(init.indexOf("create function can_see_event"), init.indexOf("create function visible_events"));
  assert.equal(fn.includes("event_invites"), false);
  assert.match(fn, /e\.privacy = 'everyone'/);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const start = html.indexOf("function canSeeEvent");
  const end = html.indexOf("function canSee(");
  assert.equal(html.slice(start, end).includes("event_invites"), false);
  assert.match(html.slice(Math.max(0, start - 500), start), /later migration/);
  const sql = readFileSync(new URL("../db/migrations/0010_event_admins.sql", import.meta.url), "utf8");
  assert.match(sql, /create table event_invites \([\s\S]*unique \(event_id, invitee_id\)/);
  assert.equal(sql.includes("can_see_event"), false);
});

test("the event page copy of EVENT_PERMS matches the server table", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const m = html.match(/var EVENT_PERMS = (\{[\s\S]*?\});/);
  assert.ok(m, "index.html defines EVENT_PERMS");
  const client = Function(`"use strict"; return (${m[1]});`)();
  assert.deepEqual(client, EVENT_PERMS);
  assert.deepEqual(EVENT_PERMS.manage, ["host", "admin"]);
  assert.deepEqual(EVENT_PERMS.edit, ["host", "admin", "link_adder"]);
  assert.deepEqual(EVENT_PERMS.removeAdmin, ["host"]);
  assert.deepEqual(EVENT_PERMS.reviewCocreator, ["host", "admin"]);
});
