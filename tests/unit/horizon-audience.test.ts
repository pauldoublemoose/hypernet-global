import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canSeeHorizonSql, horizonVisible } from "../../lib/horizons";
import { horizonPatch } from "../../lib/validation";

const migration = readFileSync(new URL("../../db/migrations/0015_horizon_audience.sql", import.meta.url), "utf8");
const route = readFileSync(new URL("../../app/api/horizons/[id]/route.ts", import.meta.url), "utf8");
const follow = readFileSync(new URL("../../app/api/horizons/[id]/follow/route.ts", import.meta.url), "utf8");
const events = readFileSync(new URL("../../app/api/horizons/[id]/events/route.ts", import.meta.url), "utf8");

describe("can_see_horizon", () => {
  it("stores audience and lets the owner and an accepted collaborator through an exclude", () => {
    expect(migration).toMatch(/add column audience jsonb/);
    expect(migration).toMatch(/when published_at is not null then '\{"include":\["everyone"\],"exclude":\[\]\}'/);
    expect(migration).toMatch(/else '\{"include":\[\],"exclude":\[\]\}'/);
    expect(migration).toMatch(/check \(audience_ok\(audience\)\)/);
    const fn = migration.slice(migration.indexOf("create or replace function can_see_horizon"), migration.indexOf("insert into _migrations"));
    expect(fn).toMatch(/viewer = h\.owner_id/);
    expect(fn).toMatch(/accepted_at is not null/);
    expect(fn).toMatch(/h\.audience->'exclude'/);
    expect(fn).toMatch(/in_audience\(viewer, h\.owner_id, tok\)/);
    expect(fn).toMatch(/h\.audience->'include'/);
    expect(fn).not.toMatch(/event_invites/);
  });

  it("lists and opens through can_see_horizon, and a pending invite can still read", () => {
    expect(canSeeHorizonSql("$1")).toBe("can_see_horizon($1::uuid, h)");
    const read = horizonVisible("$2");
    expect(read).toContain("can_see_horizon($2::uuid, h)");
    expect(read).toMatch(/accepted_at is null/);
    expect(read).toMatch(/declined_at is null/);
    expect(follow).toContain("canSeeHorizonSql");
    expect(events).toContain("horizonFor(id, me.id)");
  });

  it("accepts an owner audience and rejects a collaborator's audience in the route", () => {
    expect(horizonPatch.safeParse({ audience: { include: ["friends"], exclude: [] } }).success).toBe(true);
    expect(horizonPatch.safeParse({ audience: { include: ["everyone", "friends"], exclude: [] } }).success).toBe(false);
    expect(horizonPatch.safeParse({ audience: { include: ["everyone"], exclude: ["everyone"] } }).success).toBe(false);
    expect(route).toMatch(/has\("audience"\)/);
    expect(route).toMatch(/resolveAudience/);
    const guard = route.slice(route.indexOf('access.role === "collaborator"'), route.indexOf("Only the owner can change who can see this"));
    expect(guard).toMatch(/has\("audience"\)/);
  });
});
