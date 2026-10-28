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
  invitePolicyOf,
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

test("open lets anyone claim co-creator, and a host or admin can set one under request", () => {
  for (const seat of ["guest", "attendee", "cocreator", "link_adder"]) {
    assert.deepEqual(rsvpRoleDecision(seat, "cocreator", "open"), { write: true, value: "cocreator", pending: false });
  }
  assert.deepEqual(rsvpRoleDecision("host", "cocreator", "request"), { write: true, value: "cocreator", pending: false });
  assert.deepEqual(rsvpRoleDecision("admin", "cocreator", "request"), { write: true, value: "cocreator", pending: false });
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
  assert.match(validation, /cocreatorPolicy: z\.enum\(\["open", "request"\]\)/);
  assert.match(validation, /invitePolicy: z\.enum\(\["admins", "cocreators", "invited"\]\)/);
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
  for (const policy of ["open", "request"]) {
    assert.deepEqual(rsvpRoleDecision("attendee", null, policy), { write: true, value: null, pending: false });
    assert.deepEqual(rsvpRoleDecision("attendee", "attendee", policy), { write: true, value: "attendee", pending: false });
    assert.deepEqual(rsvpRoleDecision("cocreator", null, policy), { write: true, value: null, pending: false });
    assert.deepEqual(rsvpRoleDecision("cocreator", "attendee", policy), { write: true, value: "attendee", pending: false });
  }
});

test("a missing policy column reads the old boolean as request, otherwise open", () => {
  assert.equal(cocreatorPolicyOf(null, true), "request");
  assert.equal(cocreatorPolicyOf(undefined, false), "open");
  assert.equal(cocreatorPolicyOf("request", true), "request");
  assert.equal(cocreatorPolicyOf("admins", false), "open");
});

test("0011 adds cocreator_policy and a pending flag, and does not edit 0010", () => {
  const sql = readFileSync(new URL("../db/migrations/0011_cocreator_policy.sql", import.meta.url), "utf8");
  const old = readFileSync(new URL("../db/migrations/0010_event_admins.sql", import.meta.url), "utf8");
  assert.match(sql, /cocreator_policy text not null default 'open'/);
  assert.match(sql, /check \(cocreator_policy in \('open', 'request'\)\)/);
  assert.equal(sql.includes("'admins'"), false);
  assert.match(sql, /cocreator_pending boolean not null default false/);
  assert.equal(sql.includes("can_see_event"), false);
  assert.equal(old.includes("cocreator_policy"), false);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /Are you the host\?/);
  assert.match(html, /Is this a new event or did it already happen\?/);
  assert.match(html, /Who can be listed as a co-creator\?/);
  const policyUi = html.slice(html.indexOf("function cocreatorPolicyHTML"), html.indexOf("function cocreatorRequestRows"));
  assert.equal(policyUi.includes("Only admins can add co-creators"), false);
  assert.match(html, /function chronicleCrewDecision[\s\S]*Only admins can add co-creators/);
});

test("omitted role is not written and host is only the event host", () => {
  assert.deepEqual(rsvpRoleDecision("guest", undefined, "open"), { write: false, value: null, pending: null });
  assert.deepEqual(rsvpRoleDecision("host", "host", "request"), { write: true, value: "host", pending: false });
  const denied = rsvpRoleDecision("admin", "host", "open");
  assert.equal(denied.write, false);
  assert.match(denied.error, /host/);
});

test("invite_policy invited lets an attendee, a co-creator, and someone going invite", () => {
  const base = { invitePolicy: "invited", canSee: true, going: false };
  assert.equal(canInviteGuest({ ...base, seat: "attendee", rsvpRole: "attendee" }), true);
  assert.equal(canInviteGuest({ ...base, seat: "cocreator", rsvpRole: "cocreator", going: true }), true);
  assert.equal(canInviteGuest({ ...base, seat: "guest", rsvpRole: null, going: true }), true);
  assert.equal(canInviteGuest({ ...base, seat: "host", rsvpRole: null }), true);
  assert.equal(canInviteGuest({ ...base, seat: "admin", rsvpRole: null }), true);
  assert.equal(canInviteGuest({ ...base, seat: "guest", rsvpRole: null, going: false }), false);
  assert.equal(canInviteGuest({ ...base, seat: "attendee", rsvpRole: "attendee", canSee: false }), false);
  assert.equal(invitePolicyOf(null), "invited");
  assert.equal(invitePolicyOf("nope"), "invited");
  assert.equal(canInviteGuest({ canSee: true, going: true, seat: "guest", rsvpRole: null }), true);
});

test("invite_policy admins is admins only", () => {
  const closed = { invitePolicy: "admins", canSee: true, going: true, rsvpRole: "attendee", seat: "attendee" };
  assert.equal(canInviteGuest(closed), false);
  assert.equal(canInviteGuest({ ...closed, seat: "cocreator", rsvpRole: "cocreator" }), false);
  assert.equal(canInviteGuest({ ...closed, seat: "guest", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...closed, seat: "host", rsvpRole: "host" }), true);
  assert.equal(canInviteGuest({ ...closed, seat: "admin", rsvpRole: null, going: false }), true);
});

test("invite_policy cocreators lets a co-creator invite and not an attendee", () => {
  const base = { invitePolicy: "cocreators", canSee: true, going: true };
  assert.equal(canInviteGuest({ ...base, seat: "cocreator", rsvpRole: "cocreator" }), true);
  assert.equal(canInviteGuest({ ...base, seat: "attendee", rsvpRole: "attendee" }), false);
  assert.equal(canInviteGuest({ ...base, seat: "guest", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...base, seat: "host", rsvpRole: null, going: false }), true);
  assert.equal(canInviteGuest({ ...base, seat: "admin", rsvpRole: null, going: false }), true);
  assert.equal(canInviteGuest({ ...base, seat: "cocreator", rsvpRole: "cocreator", canSee: false }), false);
});

test("0010 stores invite_policy and the Permissions window uses two dropdowns", () => {
  const sql = readFileSync(new URL("../db/migrations/0010_event_admins.sql", import.meta.url), "utf8");
  assert.match(sql, /invite_policy text not null default 'invited'/);
  assert.match(sql, /check \(invite_policy in \('admins', 'cocreators', 'invited'\)\)/);
  assert.equal(sql.includes("guests_can_invite"), false);
  assert.equal(sql.includes("cocreator_policy"), false);
  const gate = readFileSync(new URL("../lib/event-gate.ts", import.meta.url), "utf8");
  assert.match(gate, /invite_policy/);
  assert.equal(gate.includes("guests_can_invite"), false);
  const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(schema, /invitePolicy: text\("invite_policy"\)\.notNull\(\)\.default\("invited"\)/);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const body = html.slice(html.indexOf("function eventControlsBody"), html.indexOf("function settleEventControl"));
  const ret = body.slice(body.indexOf("return '<div class=\"ev-controls\">'"));
  assert.ok(ret.indexOf("inviteBtn") < ret.indexOf("<h3>Admins</h3>"));
  assert.ok(ret.indexOf("<h3>Admins</h3>") < ret.indexOf("cocreatorPolicyHTML"));
  assert.ok(ret.indexOf("cocreatorPolicyHTML") < ret.indexOf("invitePolicy"));
  assert.match(body, /Who can invite guests\?/);
  assert.match(body, /This event is public, so anyone can already see it\./);
  assert.match(body, /isEventPublic\(e\)/);
  const pubAt = html.indexOf("// Public is HNAudience.isPublicAudience.");
  const pub = html.slice(pubAt, html.indexOf("function eventControlsBody"));
  assert.ok(pubAt >= 0 && pubAt < html.indexOf("function isEventPublic"));
  assert.match(pub, /even with excludes/);
  assert.match(pub, /function isEventPublic\(ev\)\{ return !!\(ev && window\.HNAudience && HNAudience\.isPublicAudience\(ev\)\); \}/);
  assert.equal(html.split("function isEventPublic").length, 2);
  const setInvite = html.slice(html.indexOf("function setInvitePolicy"), html.indexOf("var INVITE"));
  assert.match(setInvite, /isEventPublic\(e\)/);
  const policy = html.slice(html.indexOf("function cocreatorPolicyHTML"), html.indexOf("function cocreatorRequestRows"));
  const select = html.slice(html.indexOf("function policySelect"), html.indexOf("function cocreatorPolicyHTML"));
  assert.match(select, /<select/);
  assert.match(policy, /policySelect\(evId, 'evpolicy'/);
  assert.match(policy, /Who can be listed as a co-creator\?/);
  assert.match(policy, /Open – anyone can list themselves as a co-creator/);
  assert.match(policy, /On request – admins must approve requests/);
  assert.equal(policy.includes("'admins'"), false);
  assert.equal(policy.includes("hostask-opt"), false);
  assert.equal(html.includes("guestsCanInvite"), false);
  assert.equal(html.includes("ev-switch"), false);
  const css = html.slice(html.indexOf("/* EVENT CONTROLS */"), html.indexOf("/* HOST ASK */"));
  assert.match(css, /select:disabled\{[^}]*color:var\(--dim\)/);
  assert.match(css, /\.ev-policy-why\{[^}]*color:var\(--ink2\)/);
});

test("the merged dialog renders both sections and one Save writes both", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const open = html.slice(html.indexOf("function eventAccessDialog"), html.indexOf("function eventControlsDialog"));
  const save = html.slice(html.indexOf("function saveEventPrivacy"), html.indexOf("function setInvitePolicy"));
  assert.match(open, /Visibility and Permissions/);
  assert.match(open, /eventAccessHTML\(evId\)/);
  const parts = html.slice(html.indexOf("function eventAccessHTML"), html.indexOf("function eventAccessDialog"));
  assert.match(parts, /privacyHTML\(DRAFT\)/);
  assert.match(parts, /eventControlsBody\(evId\)/);
  assert.match(open, /evprivacy-save/);
  assert.match(save, /applyDraftAudience\(e\)/);
  assert.match(save, /audience:e\.audience/);
  assert.match(save, /cocreatorPolicy/);
  assert.match(save, /invitePolicy/);
  assert.equal(save.includes("sel.value"), false);
  assert.match(html, /Who can be listed as a co-creator\?/);
  assert.match(html, /Who can invite guests\?/);
  assert.match(html, /hostNote: hostNote/);
  assert.match(html, /!DRAFT\.editing \|\| isMine\(DRAFT\.editing\)/);
  const cog = html.slice(html.indexOf("function eventCogItems"), html.indexOf("function openItemMenu"));
  assert.match(cog, /label:'Visibility and Permissions', icon:'eye'/);
  assert.equal(cog.includes("label:'Visibility',"), false);
  assert.equal(cog.includes("label:'Permissions'"), false);
  assert.equal(cog.includes("eventPrivacyDialog"), false);
  assert.equal(cog.includes("eventControlsDialog"), false);
});

test("an invite lets that person see a private event", () => {
  const init = readFileSync(new URL("../db/migrations/0001_init.sql", import.meta.url), "utf8");
  const fn = init.slice(init.indexOf("create function can_see_event"), init.indexOf("create function visible_events"));
  assert.equal(fn.includes("event_invites"), false);
  assert.match(fn, /e\.privacy = 'everyone'/);
  const older = readFileSync(new URL("../db/migrations/0008_friends_privacy.sql", import.meta.url), "utf8");
  const oldFn = older.slice(older.indexOf("create or replace function can_see_event"), older.indexOf("insert into _migrations"));
  assert.equal(oldFn.includes("event_invites"), false);
  const sql = readFileSync(new URL("../db/migrations/0010_event_admins.sql", import.meta.url), "utf8");
  assert.match(sql, /create table event_invites \([\s\S]*unique \(event_id, invitee_id\)/);
  assert.equal(sql.includes("can_see_event"), false);
  const next = readFileSync(new URL("../db/migrations/0014_event_invites_visibility.sql", import.meta.url), "utf8");
  assert.match(next, /viewer = e\.host_id/);
  assert.match(next, /status = 'accepted'/);
  assert.match(next, /role = 'cocreator' and r\.cocreator_pending = false/);
  const excludeAt = next.indexOf("not exists (");
  const inviteAt = next.indexOf("from event_invites");
  assert.ok(excludeAt >= 0 && inviteAt > excludeAt);
  assert.match(next, /'0014_event_invites_visibility'/);
  assert.equal(/drop\s+constraint\s+if\s+exists\s+messages_card_type_check/i.test(next), false);
  assert.equal(/add\s+constraint\s+messages_card_type_check/i.test(next), false);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const start = html.indexOf("function canSeeEvent");
  const end = html.indexOf("function canSee(");
  const body = html.slice(start, end);
  assert.match(body, /EVENT_INVITES\[e\.id\]/);
  assert.match(body, /r\.inviteeId === me/);
  assert.match(body, /matchesExclude/);
  assert.ok(body.indexOf("matchesExclude") < body.indexOf("if (invited) return true"));
  assert.match(body, /adminStatus\(e\.id, me\) === 'accepted'/);
  assert.match(body, /ROLE\[e\.id\] === 'cocreator'/);
});

test("a logged event refuses every invite", () => {
  const logged = { invitePolicy: "invited", canSee: true, going: true, logged: true, past: false };
  assert.equal(canInviteGuest({ ...logged, seat: "host", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...logged, seat: "admin", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...logged, seat: "guest", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...logged, seat: "link_adder", rsvpRole: null, going: true }), false);
});

test("a past event lets the host, a co-creator, or an attendee add people", () => {
  const past = { invitePolicy: "admins", canSee: true, going: false, past: true, logged: false };
  assert.equal(canInviteGuest({ ...past, seat: "host", rsvpRole: null }), true);
  assert.equal(canInviteGuest({ ...past, seat: "cocreator", rsvpRole: "cocreator" }), true);
  assert.equal(canInviteGuest({ ...past, seat: "attendee", rsvpRole: "attendee" }), true);
  assert.equal(canInviteGuest({ ...past, seat: "admin", rsvpRole: null }), false);
  assert.equal(canInviteGuest({ ...past, seat: "guest", rsvpRole: null, going: true }), false);
});

test("past and logged pages hide the upcoming admin chrome", () => {
  const past = eventChrome({ past: true, logged: false, seat: "host", loggedIn: true });
  assert.equal(past.inviteLabel, "Add people");
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
  assert.equal(PAST_INVITE_ACT, "Add people");
  assert.equal(
    CHRONICLE_HELP,
    "Your Chronicle is your list of past events, shown on your profile page. You choose who can see each event there.",
  );
  assert.equal(chronicleAddRole({ host: false, role: null }), "attendee");
  assert.equal(chronicleAddRole({ host: true, role: null }), null);
  assert.equal(chronicleAddRole({ host: false, role: "cocreator" }), "cocreator");
  assert.equal(chronicleAddRole({ host: true, role: "host" }), "host");
});

test("the page shows Add to Chronicle without a help button, and search leaves past events out", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const search = html.slice(html.indexOf("function searchItems"), html.indexOf("function sortItems"));
  assert.match(search, /!isPast\(lastDay\(e\)\)/);
  assert.match(html, /Add to Chronicle/);
  assert.match(html, /'Add people'/);
  assert.equal(html.includes("Add people who were there"), false);
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
  assert.equal(claim.includes("helpTip("), false);
  assert.match(html, /Your Chronicle is your list of past events, shown on your profile page\. You choose who can see each event there\./);
  const policy = html.slice(html.indexOf("function cocreatorPolicyHTML"), html.indexOf("function cocreatorRequestRows"));
  assert.equal(policy.includes("helpTip("), false);
  assert.match(html, /var COCREATOR_HELP_TEXT = /);
  assert.match(html, /A co-creator is someone who may have contributed to the event\. They don't own the event page and have no admin access to it\./);
  const menu = html.slice(html.indexOf("function ctxMenuEl"), html.indexOf("function ctxPlace"));
  const sheet = html.slice(html.indexOf("function ctxSheetBody"), html.indexOf("function ctxSheetPaint"));
  assert.equal(menu.includes("helpTip("), false);
  assert.equal(sheet.includes("helpTip("), false);
  assert.equal(html.includes("I was there"), false);
  assert.match(html, /function openPastEvent\(role, into\)/);
  assert.match(html, /data-act="chrolemenu"/);
  assert.match(html, /chronicleCycleLabel\(role\)/);
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
  assert.match(html, /on \? 'Boosted' : 'Boost'/);
  assert.match(html, /data-act="v-promote"/);
  assert.match(html, /code:'promote'/);
  const plan = html.slice(html.indexOf("function eventBarPlan"), html.indexOf("function eventBarHTML"));
  assert.match(plan, /if \(!past\) show\.push\('boost'\)/);
  assert.equal(html.includes("data-sharemenu"), false);
  assert.equal(html.includes("openShareMenu"), false);
  assert.equal(html.includes("'Promote'"), false);
  assert.equal(html.includes('"Promote"'), false);
  assert.equal(html.includes("'Promoted'"), false);
  assert.equal(html.includes('"Promoted"'), false);
  assert.equal(html.includes("Not promoted"), false);
});

test("the event bar is Add to, Share, and a cog for admins", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const plan = html.slice(html.indexOf("function eventBarPlan"), html.indexOf("function eventBarHTML"));
  assert.match(plan, /show\.push\('rsvp'\)/);
  assert.match(plan, /show\.push\('invite'\)/);
  assert.match(plan, /show\.push\('addto'\)/);
  assert.match(plan, /show\.push\('share'\)/);
  assert.match(plan, /if \(!past\) show\.push\('boost'\)/);
  assert.match(plan, /show\.push\('cog'\)/);
  assert.equal(plan.includes("show.push('edit')"), false);
  assert.equal(plan.includes("show.push('chronicle')"), false);
  assert.equal(plan.indexOf("show.push('boost')") < plan.indexOf("show.push('cog')"), true);
  const bar = html.slice(html.indexOf("function eventBarHTML"), html.indexOf("function entryLinkOf"));
  assert.match(bar, /'evaddto'/);
  assert.match(bar, /'Add people'/);
  assert.match(bar, /boostLabel\(evId\)/);
  assert.equal(bar.includes("data-sharemenu"), false);
  assert.match(bar, /'evcog'/);
  assert.match(bar, /paneControls\(evId\)/);
  assert.match(html, /label:'Chronicle', icon:'scroll'/);
  assert.match(html, /Add to Chronicle', 'scroll'/);
  assert.match(html, /label:'Horizon'/);
  assert.match(html, /label:'Visibility and Permissions', icon:'eye'/);
  assert.match(html, /icon:'eye'/);
  assert.match(html, /fill="currentColor"/);
  const gear = html.slice(html.indexOf("cog:'"), html.indexOf("key:'"));
  assert.match(gear, /<circle /);
  assert.match(gear, /Z"/);
  assert.equal(gear.includes("M10 2.5v2"), false);
  const cog = html.slice(html.indexOf("function eventCogItems"), html.indexOf("function openItemMenu"));
  assert.match(cog, /heading:'Admin controls'/);
  assert.match(cog, /label:'Edit'/);
  assert.match(cog, /label:'Visibility and Permissions', icon:'eye'/);
  assert.equal(cog.includes("label:'Permissions'"), false);
  assert.match(cog, /label:'New call out'/);
  assert.match(cog, /label:'Delete', icon:'trash'/);
  assert.match(cog, /!logged && \(seat === 'host' \|\| seat === 'admin'\)/);
  assert.match(cog, /seat === 'host' \|\| seat === 'link_adder'/);
  assert.equal(cog.includes("danger"), false);
  assert.match(html, /class="btn alert" data-act="confirmok">Delete/);
  assert.match(html, /\.dlg \.dfoot \.btn\.alert\{ background:var\(--alert\); color:var\(--white\); \}/);
  assert.match(html, /This can't be undone\./);
  assert.match(html, /data-slot="constellation"/);
  assert.match(html, /WEDGE = 8/);
  assert.match(html, /y0 = WEDGE/);
  assert.match(html, /review-markers\.js/);
});

test("the admin block is labeled Admin controls", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const cog = html.slice(html.indexOf("function eventCogItems"), html.indexOf("function openItemMenu"));
  assert.match(cog, /heading:'Admin controls'/);
  assert.match(html, /dialog\('Visibility and Permissions'/);
  assert.match(html, /data-act="evprivacy-save"/);
  assert.equal(html.includes("dialog('Permissions'"), false);
  assert.equal(html.includes("Event controls"), false);
  assert.equal(html.includes("dialog('Admin controls'"), false);
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

test("an excluded person is absent from the invite options", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const paint = html.slice(html.indexOf("function paintInvite"), html.indexOf("function personExcluded"));
  assert.match(paint, /personExcluded\(INVITE\.evId, k\)/);
  assert.equal(html.includes("Hidden by visibility settings"), false);
  const send = html.slice(html.indexOf("function sendEventInvite"), html.indexOf("function sendAdminInvite"));
  assert.match(send, /if \(personExcluded\(evId, pid\)\) return;/);
});

test("the invite route answers like a normal invite and writes nothing when the person is excluded", () => {
  const route = readFileSync(new URL("../app/api/events/[id]/invites/route.ts", import.meta.url), "utf8");
  const post = route.slice(route.indexOf("export const POST"));
  const early = post.indexOf("if (hidden[0]?.hidden) return json({ ok: true }, 201);");
  const insert = post.indexOf("insert into event_invites");
  const message = post.indexOf("insert into messages");
  assert.ok(early >= 0 && early < insert && early < message);
  assert.equal(post.includes('409, "excluded"'), false);
  assert.match(post, /in_audience\(\$2, e\.host_id, tok\)/);
  assert.match(post, /return json\(\{ ok: true \}, 201\)/);
});

test("a hidden event card shows no event details", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const conv = html.slice(html.indexOf("function convHTML"), html.indexOf("function growBox"));
  assert.match(conv, /This event isn't available/);
  assert.match(conv, /hiddenCard \? '' : esc\(m\.text\)/);
  assert.match(conv, /class="evcard gone"/);
  assert.match(conv, /m\.cardType !== 'horizon_invite'/);
  const preview = html.slice(html.indexOf("function msgPreview"), html.indexOf("function unreadChats"));
  assert.match(preview, /This event isn't available/);
  assert.match(preview, /m\.cardType !== 'horizon_invite'/);
  const boot = readFileSync(new URL("../lib/bootstrap.ts", import.meta.url), "utf8");
  const messages = boot.slice(boot.indexOf("export function messagesJson"), boot.indexOf("export type Bootstrap"));
  assert.match(messages, /m\.card_type in \('event', 'chronicle'\)/);
  assert.match(messages, /This event isn''t available/);
  assert.equal(messages.includes("horizon_invite"), false);
  assert.match(boot, /messagesJson\("\$1"\)/);
});
