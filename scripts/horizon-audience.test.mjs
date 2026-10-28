import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../db/migrations/0015_horizon_audience.sql", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/horizons/[id]/route.ts", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("0015 adds horizon audience and can_see_horizon, and is not a rewrite of 0014", () => {
  assert.match(migration, /add column audience jsonb/);
  assert.match(migration, /create or replace function can_see_horizon/);
  assert.match(migration, /accepted_at is not null/);
  assert.equal(migration.includes("can_see_event"), false);
  assert.equal(migration.includes("alter table events"), false);
  const see = html.slice(html.indexOf("function canSeeHorizon"), html.indexOf("function hzCanEdit"));
  assert.match(see, /collaboratorIds/);
  assert.match(see, /HNAudience\.canSee/);
  assert.equal(html.includes("Not enforced yet"), false);
  assert.match(html, /h\[0\] === 'horizon-north' \? \{ include:\['everyone'\], exclude:\['friends'\] \}/);
  const patch = route.slice(route.indexOf('access.role === "collaborator"'), route.indexOf("Only the owner can change who can see this"));
  assert.match(patch, /has\("audience"\)/);
});
