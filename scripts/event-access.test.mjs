// node --test scripts/event-access.test.mjs — who may edit an event page, invite, and set a role.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CHRONICLE_ACT,
  CHRONICLE_HELP,
  EVENT_PERMS,
  PAST_INVITE_ACT,
  allows,
  canEditEvent,
  canInviteGuest,
  canManageEvent,
  cocreatorPolicyOf,
  eventChrome,
  eventDayLabel,
  eventListWindow,
  pastInviteNotice,
  chronicleAddRole,
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

test("a logged event refuses every invite", () => {
  const logged = { guestsCanInvite: true, canSee: true, going: true, logged: true, past: false };
  assert.equal(canInviteGuest({ ...logged, seat: "host", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...logged, seat: "admin", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...logged, seat: "guest", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...logged, seat: "link_adder", rsvpRole: null, going: true }), false);
});

test("a past event lets the host, a co-creator, or an attendee add people", () => {
  const past = { guestsCanInvite: true, canSee: true, going: false, past: true, logged: false };
  assert.equal(canInviteGuest({ ...past, seat: "host", rsvpRole: null }), true);
  assert.equal(canInviteGuest({ ...past, seat: "cocreator", rsvpRole: "cocreator" }), true);
  assert.equal(canInviteGuest({ ...past, seat: "attendee", rsvpRole: "attendee" }), true);
  assert.equal(canInviteGuest({ ...past, seat: "admin", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...past, seat: "guest", rsvpRole: null, going: true }), false);
});

test("past and logged pages hide the upcoming admin chrome", () => {
  const past = eventChrome({ past: true, logged: false, seat: "host", loggedIn: true });
  assert.equal(past.inviteLabel, "Add people who were there");
  assert.equal(past.chronicle, true);
  assert.equal(past.edit, true);
  assert.equal(past.privacy, true);
  assert.equal(past.eventControls, true);
  for (const key of ["inviteAdmin", "guestInviteToggle", "cocreatorPolicy", "demote", "removeAdmin", "tickets", "newCallout", "promote", "rsvp"]) {
    assert.equal(past[key], false, key);
  }
  const guest = eventChrome({ past: true, logged: false, seat: "guest", loggedIn: true });
  assert.equal(guest.chronicle, true);
  assert.equal(guest.edit, false);
  assert.equal(guest.eventControls, false);
  const logged = eventChrome({ past: false, logged: true, seat: "link_adder", loggedIn: true });
  assert.equal(logged.edit, true);
  assert.equal(logged.privacy, false);
  assert.equal(logged.eventControls, false);
  assert.equal(logged.inviteAdmin, false);
  assert.equal(logged.chronicle, false);
  const loggedGuest = eventChrome({ past: false, logged: true, seat: "guest", loggedIn: true });
  assert.equal(loggedGuest.edit, false);
});

test("the chronicle list is an opt-in and the past invite says so", () => {
  assert.equal(eventListWindow(undefined), "current");
  assert.equal(eventListWindow("only"), "past");
  assert.equal(eventDayLabel("2026-10-01"), "Thu 1 Oct");
  assert.equal(
    pastInviteNotice("Ada", "Thu 1 Oct", "Supper"),
    "Ada added you to a past event (Thu 1 Oct): Supper. Add it to your chronicle?",
  );
  assert.equal(CHRONICLE_ACT, "Add to Chronicle");
  assert.equal(PAST_INVITE_ACT, "Add people who were there");
  assert.equal(
    CHRONICLE_HELP,
    "Your Chronicle is your list of past events, shown on your profile page. You choose who can see each event there.",
  );
  assert.equal(chronicleAddRole({ host: false, role: null }), "attendee");
  assert.equal(chronicleAddRole({ host: true, role: null }), null);
  assert.equal(chronicleAddRole({ host: false, role: "cocreator" }), "cocreator");
  assert.equal(chronicleAddRole({ host: true, role: "host" }), "host");
});

test("the page shows Add to Chronicle with a help button, and search leaves past events out", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const search = html.slice(html.indexOf("function searchItems"), html.indexOf("function sortItems"));
  assert.match(search, /!isPast\(lastDay\(e\)\)/);
  assert.match(html, /Add to Chronicle/);
  assert.match(html, /Add people who were there/);
  assert.match(html, /added you to a past event/);
  assert.match(html, /function helpTip\(text\)/);
  assert.match(html, /class="helptip-btn"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /data-act="helptip"/);
  assert.match(html, /\/\* HELP TIP/);
  assert.equal(html.includes('class="btn helptip'), false);
  assert.match(html, /'chaccept'/);
  const claim = html.slice(html.indexOf("function chronicleClaimHTML"), html.indexOf("function paneControls"));
  assert.match(claim, /Add to Chronicle/);
  assert.match(claim, /helpTip\(CHRONICLE_HELP_TEXT\)/);
  assert.match(html, /Your Chronicle is your list of past events, shown on your profile page\. You choose who can see each event there\./);
  const policy = html.slice(html.indexOf("function cocreatorPolicyHTML"), html.indexOf("function cocreatorRequestRows"));
  assert.match(policy, /helpTip\(/);
  assert.match(policy, /A co-creator is someone who may have contributed to the event\. They don't own the event page and have no admin access to it\./);
  assert.match(policy, /class="helprow"/);
  assert.equal(html.includes("I was there"), false);
  assert.match(html, /function openPastEvent\(role, into\)/);
  assert.match(html, /openPastEvent\(pastRole\)/);
  const ask = html.slice(html.indexOf("var newEventDialog"), html.indexOf("function adminInviteBanner"));
  assert.match(ask, /if \(CHRONICLE_ADD\)/);
  assert.equal(ask.includes("eventDraftDirty"), false);
  const profile = html.slice(html.indexOf("/* PROFILE — Chronicle"), html.indexOf("/* The slot stays empty"));
  assert.equal(profile.includes("past=only"), false);
  assert.equal(profile.includes("helptip"), false);
  assert.equal(profile.includes("chhelp"), false);
  const list = readFileSync(new URL("../app/api/events/route.ts", import.meta.url), "utf8");
  assert.match(list, /past=only/);
  assert.match(list, /\$6/);
  assert.match(list, /coalesce\(e\.ends_on, e\.starts_on\)/);
  const invites = readFileSync(new URL("../app/api/events/[id]/invites/route.ts", import.meta.url), "utf8");
  assert.match(invites, /pastInviteNotice/);
  assert.match(invites, /Only events hosted here can take an invite/);
  assert.match(invites, /chronicle/);
  const client = html.slice(html.indexOf("function canInviteToEvent"), html.indexOf("function linkSite"));
  assert.match(client, /isLinkEvent/);
  assert.match(client, /isPast\(lastDay\(e\)\)/);
  const went = html.slice(html.indexOf("var setWent"), html.indexOf("function acceptChronicle"));
  assert.match(went, /addChronicle\(evId\)/);
  const accept = html.slice(html.indexOf("function acceptChronicle"), html.indexOf("function closeHelpTips"));
  assert.match(accept, /addChronicle\(evId\)/);
  assert.equal(accept.includes("HNAPI.rsvp"), false);
  const api = readFileSync(new URL("../_shared/hypernet-api.js", import.meta.url), "utf8");
  assert.match(api, /POST', '\/api\/events\/' \+ id \+ '\/chronicle'/);
  const chronicle = readFileSync(new URL("../app/api/events/[id]/chronicle/route.ts", import.meta.url), "utf8");
  assert.match(chronicle, /export const POST/);
  assert.match(chronicle, /not_past/);
  assert.match(chronicle, /went = true/);
  assert.match(chronicle, /chronicleAddRole/);
  assert.match(chronicle, /coalesce\(r\.role, excluded\.role\)/);
  assert.equal(chronicle.includes("readJson"), false);
});

test("the boost action is labeled Boost", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /aria-label="Boost"/);
  assert.match(html, /label:'Boost'/);
  assert.match(html, /it\.check \? 'Boosted' : 'Boost'/);
  assert.match(html, /data-act="v-promote"/);
  assert.match(html, /code:'promote'/);
  assert.equal(html.includes("'Promote'"), false);
  assert.equal(html.includes('"Promote"'), false);
  assert.equal(html.includes("'Promoted'"), false);
  assert.equal(html.includes('"Promoted"'), false);
  assert.equal(html.includes("Not promoted"), false);
});

test("the admin block is labeled Admin controls", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /heading:'Admin controls'/);
  assert.match(html, /dialog\('Admin controls'/);
  assert.equal(html.includes("Event controls"), false);
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
