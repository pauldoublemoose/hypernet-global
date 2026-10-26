// node --test scripts/message-card-type.test.mjs — messages.card_type must accept every value the code writes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const migDir = fileURLToPath(new URL("../db/migrations/", import.meta.url));

function quoted(listSql) {
  return [...listSql.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function cardInLists(sql) {
  return [...sql.matchAll(/card_type\s+in\s*\(([^)]*)\)/gi)].map((m) => quoted(m[1]));
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|js|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

function writtenCardTypes() {
  const found = new Set();
  for (const dir of ["app", "lib", "_shared"]) {
    for (const file of walk(join(root, dir))) {
      const text = readFileSync(file, "utf8");
      if (!/insert\s+into\s+messages/i.test(text) || !/card_type/.test(text)) continue;
      const slice = text.slice(text.indexOf("card_type"));
      const end = slice.indexOf(");");
      const region = slice.slice(0, end === -1 ? slice.length : end);
      for (const m of region.matchAll(/["']([a-z][a-z_]*)["']/g)) {
        // inviteBody("pending", …) is the message text, not card_type.
        const before = region.slice(Math.max(0, m.index - 24), m.index);
        if (/inviteBody\(\s*$/.test(before)) continue;
        found.add(m[1]);
      }
    }
  }
  return found;
}

test("the message card check allows chronicle and every earlier value", () => {
  const files = readdirSync(migDir).filter((name) => name.endsWith(".sql")).sort();
  const required = new Set();
  let constraint = null;
  for (const name of files) {
    const sql = readFileSync(join(migDir, name), "utf8");
    const lists = cardInLists(sql);
    const redefines = /drop\s+constraint\s+if\s+exists\s+messages_card_type_check/i.test(sql)
      && /add\s+constraint\s+messages_card_type_check/i.test(sql);
    if (redefines) {
      assert.equal(lists.length, 1, `${name} should state the card_type list once`);
      constraint = { name, allowed: lists[0], sql };
    } else {
      for (const list of lists) for (const value of list) required.add(value);
    }
  }
  assert.ok(constraint, "a migration drops and re-adds messages_card_type_check");
  assert.ok(required.has("event") && required.has("horizon") && required.has("callout"), "0001 values are the baseline");
  required.add("horizon_invite");
  required.add("chronicle");
  for (const value of required) {
    assert.ok(constraint.allowed.includes(value), `${constraint.name} omits ${value}`);
  }
  assert.deepEqual(constraint.allowed, ["event", "horizon", "callout", "horizon_invite", "chronicle"]);
  assert.match(constraint.sql, /check \(card_type is null or card_type in \(/);
  const written = writtenCardTypes();
  assert.ok(written.has("chronicle"));
  assert.ok(written.has("event"));
  for (const value of written) {
    assert.ok(constraint.allowed.includes(value), `code writes card_type ${value}`);
  }
});
