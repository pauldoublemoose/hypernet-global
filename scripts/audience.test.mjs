// node --test scripts/audience.test.mjs — canSee, the same rules as SQL can_see. No server, no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { audience } from "../lib/validation.ts";

const require = createRequire(import.meta.url);
const { canSee, canSeeEventAccess, matchesExclude, normalize, toggle, fromPrivacy, derivePrivacy, summary, pickerHTML, isPublicAudience } = require("../_shared/hypernet-audience.js");

function loadIsPublicAudience() {
  const src = readFileSync(new URL("../lib/audience.ts", import.meta.url), "utf8");
  const start = src.indexOf("export function isPublicAudience");
  let depth = 0;
  let end = -1;
  for (let i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  const js = src.slice(start, end).replace(/^export /, "").replace("(event: AudienceEvent): boolean", "(event)");
  return new Function(`${js}\nreturn isPublicAudience;`)();
}

const isPublicAudienceSql = loadIsPublicAudience();

const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const D = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const LIST = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

const everyone = { include: ["everyone"], exclude: [] };
const graph = {
  friends: {
    [A < B ? `${A}|${B}` : `${B}|${A}`]: "accepted",
    [B < C ? `${B}|${C}` : `${C}|${B}`]: "accepted",
    [C < D ? `${C}|${D}` : `${D}|${C}`]: "accepted",
    [`${A}|${D}`]: "pending",
  },
  follows: { [`${B}|${A}`]: true },
  lists: {
    [LIST]: { owner: A, members: { [B]: true } },
    [OTHER]: { owner: C, members: { [B]: true } },
  },
};

test("a logged-out viewer sees nothing, including everyone with no exclude", () => {
  assert.equal(canSee(null, A, everyone, graph), false);
  assert.equal(canSee(null, null, everyone, graph), false);
  assert.equal(canSee(null, A, { include: ["everyone"], exclude: ["friends"] }, graph), false);
});

test("everyone matches any logged-in viewer, and an exclude beats it", () => {
  assert.equal(canSee(C, A, everyone, graph), true);
  assert.equal(canSee(B, A, { include: ["everyone"], exclude: ["friends"] }, graph), false);
  assert.equal(canSee(C, A, { include: ["everyone"], exclude: ["friends"] }, graph), true);
});

test("the owner always sees, including when excluded and when include is empty", () => {
  assert.equal(canSee(A, A, { include: [], exclude: ["everyone"] }, graph), true);
  assert.equal(canSee(A, A, { include: ["friends"], exclude: ["friends"] }, graph), true);
});

test("a direct friend is not in fof", () => {
  assert.equal(canSee(B, A, { include: ["friends"], exclude: [] }, graph), true);
  assert.equal(canSee(B, A, { include: ["fof"], exclude: [] }, graph), false);
  assert.equal(canSee(C, A, { include: ["friends"], exclude: [] }, graph), false);
  assert.equal(canSee(C, A, { include: ["fof"], exclude: [] }, graph), true);
  assert.equal(canSee(D, A, { include: ["fof"], exclude: [] }, graph), false);
  assert.equal(canSee(D, A, { include: ["friends"], exclude: [] }, graph), false);
  const alsoFriend = { ...graph, friends: { ...graph.friends, [`${A}|${C}`]: "accepted" } };
  assert.equal(canSee(C, A, { include: ["fof"], exclude: [] }, alsoFriend), false);
});

test("Friends except fof shows a friend and hides a two-hop person", () => {
  const aud = { include: ["friends"], exclude: ["fof"] };
  assert.equal(canSee(B, A, aud, graph), true);
  assert.equal(canSee(C, A, aud, graph), false);
  const wide = { include: ["everyone"], exclude: ["fof"] };
  assert.equal(canSee(B, A, wide, graph), true);
  assert.equal(canSee(C, A, wide, graph), false);
});

test("including fof auto-ticks friends", () => {
  const both = toggle(fromPrivacy("everyone"), "fof", "include");
  assert.deepEqual(both, { include: ["friends", "fof"], exclude: [] });
  assert.deepEqual(toggle(both, "friends", "include"), { include: ["fof"], exclude: [] });
  assert.deepEqual(toggle(both, "fof", "include"), { include: ["friends"], exclude: [] });
  assert.deepEqual(toggle({ include: ["friends"], exclude: [] }, "fof", "exclude"), { include: ["friends"], exclude: ["fof"] });
});

test("including fof while friends is excluded keeps friends excluded", () => {
  assert.deepEqual(
    toggle({ include: ["everyone"], exclude: ["friends"] }, "fof", "include"),
    { include: ["fof"], exclude: ["friends"] },
  );
});

test("a person who is both a friend and on an excluded list is hidden", () => {
  const aud = { include: ["friends", "fof"], exclude: [`list:${LIST}`] };
  assert.equal(canSee(B, A, aud, graph), false);
  assert.equal(canSee(C, A, aud, graph), true);
});

test("fof in 0008 is the second ring only, and 0014 does not redefine in_audience", () => {
  const sql = readFileSync(new URL("../db/migrations/0008_friends_privacy.sql", import.meta.url), "utf8");
  const fof = sql.slice(sql.indexOf("when tok = 'fof'"), sql.indexOf("when tok = 'followers'"));
  assert.match(fof, /viewer <> owner/);
  assert.match(fof, /not exists \(/);
  assert.equal(fof.includes(" or exists"), false);
  const later = readFileSync(new URL("../db/migrations/0014_event_invites_visibility.sql", import.meta.url), "utf8");
  assert.equal(later.includes("create or replace function in_audience"), false);
  assert.equal(later.includes("create function in_audience"), false);
  assert.equal(later.includes("create or replace function can_see_event"), true);
  const excludeAt = later.indexOf("not exists (");
  const inviteAt = later.indexOf("from event_invites");
  assert.ok(excludeAt >= 0 && inviteAt > excludeAt);
  assert.match(later, /in_audience\(viewer, e\.host_id, tok\)/);
  assert.match(later, /status = 'accepted'/);
  assert.match(later, /role = 'cocreator' and r\.cocreator_pending = false/);
});

test("an excluded invitee cannot see the event, and an invite outside the includes can", () => {
  const hidden = { include: ["everyone"], exclude: ["friends"] };
  assert.equal(canSeeEventAccess(B, A, hidden, graph, { invited: true }), false);
  assert.equal(canSeeEventAccess(C, A, hidden, graph, { invited: true }), true);
  const friendsOnly = { include: ["friends"], exclude: [] };
  assert.equal(canSeeEventAccess(C, A, friendsOnly, graph, {}), false);
  assert.equal(canSeeEventAccess(C, A, friendsOnly, graph, { invited: true }), true);
});

test("the host, an accepted admin, and an accepted co-creator always see the event", () => {
  const closed = { include: [], exclude: ["friends"] };
  assert.equal(canSeeEventAccess(A, A, closed, graph, {}), true);
  assert.equal(canSeeEventAccess(B, A, closed, graph, { admin: true }), true);
  assert.equal(canSeeEventAccess(B, A, closed, graph, { cocreator: true }), true);
  assert.equal(canSeeEventAccess(B, A, closed, graph, { invited: true }), false);
  assert.equal(canSeeEventAccess(null, A, { include: ["everyone"], exclude: [] }, graph, { admin: true, invited: true }), false);
});

test("an excluded person is not an invite option", () => {
  const aud = { include: ["everyone"], exclude: [`list:${LIST}`] };
  assert.equal(matchesExclude(B, A, aud, graph), true);
  assert.equal(matchesExclude(C, A, aud, graph), false);
  assert.equal(matchesExclude(B, A, { include: ["everyone"], exclude: [] }, graph), false);
});

test("followers is the viewer following the owner, not the other way", () => {
  assert.equal(canSee(B, A, { include: ["followers"], exclude: [] }, graph), true);
  assert.equal(canSee(A, B, { include: ["followers"], exclude: [] }, graph), false);
});

const GROUP = "33333333-3333-4333-8333-333333333333";

test("group:<uuid> is valid in include and exclude, and a malformed group token is not", () => {
  assert.equal(audience.safeParse({ include: [`group:${GROUP}`], exclude: [] }).success, true);
  assert.equal(audience.safeParse({ include: ["everyone"], exclude: [`group:${GROUP}`] }).success, true);
  assert.equal(audience.safeParse({ include: ["group:not-a-uuid"], exclude: [] }).success, false);
  assert.equal(audience.safeParse({ include: ["everyone"], exclude: ["group:"] }).success, false);
});

test("a group token matches nobody, and the summary says a group when no name is known", () => {
  assert.equal(canSee(B, A, { include: [`group:${GROUP}`], exclude: [] }, graph), false);
  assert.equal(canSee(B, A, { include: ["everyone"], exclude: [`group:${GROUP}`] }, graph), true);
  assert.equal(summary({ include: [`group:${GROUP}`], exclude: [] }), "a group");
  assert.equal(summary({ include: ["everyone"], exclude: [`group:${GROUP}`] }), "Everyone except a group");
  const html = pickerHTML({ include: ["everyone"], exclude: [`group:${GROUP}`] }, [
    { token: "everyone", label: "Everyone" },
    { token: "friends", label: "Friends" },
  ]);
  assert.match(html, /class="audsum">Everyone except a group/);
  assert.doesNotMatch(html, /Groups/);
});

test("a list matches only when the owner owns it and the viewer is on it", () => {
  assert.equal(canSee(B, A, { include: [`list:${LIST}`], exclude: [] }, graph), true);
  assert.equal(canSee(C, A, { include: [`list:${LIST}`], exclude: [] }, graph), false);
  assert.equal(canSee(B, A, { include: [`list:${OTHER}`], exclude: [] }, graph), false);
});

test("a hostless event is everyone-only for a logged-in viewer", () => {
  assert.equal(canSee(B, null, everyone, graph), true);
  assert.equal(canSee(null, null, everyone, graph), false);
  assert.equal(canSee(B, null, { include: ["friends"], exclude: [] }, graph), false);
  assert.equal(canSee(B, null, { include: ["fof"], exclude: [] }, graph), false);
  assert.equal(canSee(B, null, { include: ["followers"], exclude: [] }, graph), false);
});

const WORK = "11111111-1111-4111-8111-111111111111";
const CLOSE = "22222222-2222-4222-8222-222222222222";
const nameOf = (id) => ({ [WORK]: "Work", [CLOSE]: "Close" })[id];

test("Everyone clears the other includes, and any other include clears Everyone", () => {
  const start = fromPrivacy("everyone");
  const friends = toggle(start, "friends", "include");
  assert.deepEqual(friends, { include: ["friends"], exclude: [] });
  const withList = toggle(friends, "list:" + CLOSE, "include");
  const except = toggle(start, "list:" + WORK, "exclude");
  const kept = toggle(toggle(except, "friends", "include"), "everyone", "include");
  assert.deepEqual(withList.include, ["friends", "list:" + CLOSE]);
  assert.deepEqual(kept, { include: ["everyone"], exclude: ["list:" + WORK] });
});

test("include and exclude cannot both hold one option, and Everyone cannot be excluded", () => {
  const start = fromPrivacy("everyone");
  assert.deepEqual(toggle(start, "everyone", "exclude"), start);
  const hidden = toggle(toggle(start, "friends", "include"), "friends", "exclude");
  assert.deepEqual(hidden, { include: [], exclude: ["friends"] });
  assert.deepEqual(toggle(hidden, "friends", "include"), { include: ["friends"], exclude: [] });
  assert.deepEqual(
    normalize({ include: ["friends", "everyone", "friends"], exclude: ["friends", "everyone"] }),
    { include: ["everyone"], exclude: ["friends"] },
  );
});

test("the summary is plain words, and the saved tokens stay in one order", () => {
  assert.equal(summary({ include: [], exclude: [] }, nameOf), "Only you");
  assert.equal(summary(fromPrivacy("everyone"), nameOf), "Everyone");
  assert.equal(summary({ include: ["everyone"], exclude: ["list:" + WORK] }, nameOf), "Everyone except Work");
  assert.equal(summary({ include: ["list:" + CLOSE, "friends"], exclude: [] }, nameOf), "Friends and Close");
  assert.equal(
    summary({ include: ["followers", "friends", "fof"], exclude: [] }, nameOf),
    "Friends, Friends of friends, and Followers",
  );
  let aud = { include: [], exclude: [] };
  ["list:" + WORK, "followers", "list:" + CLOSE, "friends"].forEach((tok) => {
    aud = toggle(aud, tok, "include");
  });
  assert.deepEqual(aud.include, ["friends", "followers", "list:" + WORK, "list:" + CLOSE]);
});

test("legacy privacy is derived the way the server derives it", () => {
  assert.equal(derivePrivacy({ include: ["everyone"], exclude: [] }), "everyone");
  assert.equal(derivePrivacy({ include: ["everyone"], exclude: ["list:" + WORK] }), "friends");
  assert.equal(derivePrivacy({ include: ["friends"], exclude: [] }), "friends");
  assert.equal(derivePrivacy({ include: [], exclude: ["friends"] }), "only_me");
  for (const p of ["everyone", "friends", "only_me"]) assert.equal(derivePrivacy(fromPrivacy(p)), p);
});

test("the picker is checkboxes, and Everyone has no hide box", () => {
  const html = pickerHTML(fromPrivacy("everyone"), [
    { token: "everyone", label: "Everyone" },
    { token: "friends", label: "Friends" },
    { token: "list:" + WORK, label: "Work" },
  ]);
  assert.match(html, /id="w-p"/);
  assert.match(html, />Show</);
  assert.match(html, />Hide</);
  assert.match(html, /aria-label="Show to Everyone"/);
  assert.match(html, /data-aud="include" data-tok="everyone" checked/);
  assert.match(html, /data-tok="everyone" checked aria-label="Show to Everyone">[\s\S]*?<\/label><span class="audph"/);
  assert.doesNotMatch(html, /Hide from Everyone/);
  assert.doesNotMatch(html, /data-aud="exclude" data-tok="everyone"/);
  assert.match(html, /aria-label="Hide from Friends"/);
  assert.match(html, /aria-label="Hide from Work"/);
  assert.match(html, /class="audsum">Everyone</);
  assert.match(html, /class="audnote" hidden/);
  assert.equal(html.includes("Hidden people can't see this event, even if invited."), true);
  assert.match(html, /Friends[\s\S]*class="auddiv"[\s\S]*Work/);
  assert.match(html, /Manage lists/);
  const excluded = pickerHTML({ include: ["everyone"], exclude: ["friends"] }, [
    { token: "everyone", label: "Everyone" },
    { token: "friends", label: "Friends" },
  ]);
  assert.match(excluded, /class="audnote">Hidden people can't see this event, even if invited\./);
  const forAdmin = pickerHTML({ include: ["everyone"], exclude: ["friends"] }, [
    { token: "everyone", label: "Everyone" },
    { token: "friends", label: "Friends" },
  ], { hostNote: false });
  assert.match(forAdmin, /class="audnote" hidden/);
  const bare = pickerHTML(fromPrivacy("everyone"), [
    { token: "everyone", label: "Everyone" },
    { token: "friends", label: "Friends" },
  ]);
  assert.doesNotMatch(bare, /auddiv/);
  assert.match(bare, /Manage lists/);
});

test("isPublicAudience is everyone in include, or the legacy privacy value when there is no audience", () => {
  for (const pub of [isPublicAudience, isPublicAudienceSql]) {
    assert.equal(pub(null), false);
    assert.equal(pub({ audience: { include: ["everyone"], exclude: ["friends"] } }), true);
    assert.equal(pub({ audience: { include: ["friends"], exclude: [] }, privacy: "everyone" }), false);
    assert.equal(pub({ audience: { include: [], exclude: [] }, privacy: "everyone" }), false);
    assert.equal(pub({ privacy: "everyone" }), true);
    assert.equal(pub({}), true);
    assert.equal(pub({ privacy: "only_me" }), false);
    assert.equal(pub({ privacy: "friends" }), false);
  }
});
