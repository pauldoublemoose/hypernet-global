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

test("only_admins_add_cocreators blocks a non-admin from self-claiming cocreator", () => {
  for (const seat of ["guest", "attendee", "cocreator", "link_adder"]) {
    const d = rsvpRoleDecision(seat, "cocreator", true);
    assert.equal(d.write, false);
    assert.match(d.error, /admins/);
  }
  assert.equal(rsvpRoleDecision("host", "cocreator", true).write, true);
  assert.equal(rsvpRoleDecision("admin", "cocreator", true).write, true);
  assert.deepEqual(rsvpRoleDecision("guest", "cocreator", false), { write: true, value: "cocreator" });
});

test("a co-creator can leave even when only admins can add co-creators", () => {
  assert.deepEqual(rsvpRoleDecision("cocreator", "attendee", true), { write: true, value: "attendee" });
  assert.deepEqual(rsvpRoleDecision("cocreator", null, true), { write: true, value: null });
  assert.deepEqual(rsvpRoleDecision("attendee", null, true), { write: true, value: null });
});

test("omitted role is not written and host is only the event host", () => {
  assert.deepEqual(rsvpRoleDecision("guest", undefined, false), { write: false, value: null });
  assert.deepEqual(rsvpRoleDecision("host", "host", true), { write: true, value: "host" });
  const denied = rsvpRoleDecision("admin", "host", false);
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
});
