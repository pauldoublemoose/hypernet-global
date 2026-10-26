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

const INVITE = " or exists (select 1 from event_invites where event_id = ALIAS.id and invitee_id = VIEWER::uuid)";

test("the predicate is can_see_event or an invite row for the viewer parameter and the events alias", () => {
  assert.equal(canSeeEventSql("$1"), "can_see_event($1::uuid, e)" + INVITE.replace("ALIAS", "e").replace("VIEWER", "$1"));
  assert.equal(canSeeEventSql("$2", "ce"), "can_see_event($2::uuid, ce)" + INVITE.replace("ALIAS", "ce").replace("VIEWER", "$2"));
  assert.equal(canSeeEventSql("$12", "e2"), "can_see_event($12::uuid, e2)" + INVITE.replace("ALIAS", "e2").replace("VIEWER", "$12"));
});

test("a viewer parameter or alias that is not a placeholder is refused", () => {
  for (const [param, alias] of [["1", "e"], ["$0", "e"], ["$1; drop", "e"], ["$1", "e.id"], ["$1", "e e"]]) {
    assert.throws(() => canSeeEventSql(param, alias));
  }
});
