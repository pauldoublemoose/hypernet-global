// node --test scripts/can-see-sql.test.mjs — the SQL predicate, with no database.
// The function lives in lib/audience.ts. This loads that source so the test cannot drift from it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function loadCanSeeEventSql() {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../lib/audience.ts"), "utf8");
  const start = src.indexOf("export function canSeeEventSql");
  assert.notEqual(start, -1, "canSeeEventSql is in lib/audience.ts");
  let depth = 0;
  let end = -1;
  for (let i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const js = src.slice(start, end).replace(/^export /, "").replace(/:\s*string/g, "");
  return new Function(`${js}\nreturn canSeeEventSql;`)();
}

const canSeeEventSql = loadCanSeeEventSql();

function expectSql(viewer, alias) {
  const v = viewer + "::uuid";
  const id = alias + ".id";
  return (
    "(can_see_event(" + v + ", " + alias + ") or (" +
    alias + ".deleted_at is null and " + v + " is not null and (" +
    "exists (select 1 from event_admins where event_id = " + id + " and user_id = " + v + " and status = 'accepted')" +
    " or exists (select 1 from rsvps where event_id = " + id + " and person_id = " + v + " and role = 'cocreator' and cocreator_pending = false)" +
    " or (not exists (select 1 from jsonb_array_elements_text(" + alias + ".audience->'exclude') tok where in_audience(" + v + ", " + alias + ".host_id, tok))" +
    " and exists (select 1 from event_invites where event_id = " + id + " and invitee_id = " + v + "))" +
    ")))"
  );
}

test("an exclude beats an invite, and the host, an admin, and a co-creator still see the event", () => {
  assert.equal(canSeeEventSql("$1"), expectSql("$1", "e"));
  assert.equal(canSeeEventSql("$2", "ce"), expectSql("$2", "ce"));
  assert.equal(canSeeEventSql("$12", "e2"), expectSql("$12", "e2"));
  const sql = canSeeEventSql("$1");
  const excludeAt = sql.indexOf("not exists (select 1 from jsonb_array_elements_text");
  const inviteAt = sql.indexOf("from event_invites");
  assert.ok(excludeAt >= 0 && inviteAt > excludeAt);
  assert.equal(sql.includes(" or exists (select 1 from event_invites"), false);
});

test("a viewer parameter or alias that is not a placeholder is refused", () => {
  for (const [param, alias] of [["1", "e"], ["$0", "e"], ["$1; drop", "e"], ["$1", "e.id"], ["$1", "e e"]]) {
    assert.throws(() => canSeeEventSql(param, alias));
  }
});
