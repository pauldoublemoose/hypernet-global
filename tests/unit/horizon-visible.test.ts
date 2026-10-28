import { describe, expect, it } from "vitest";
import { HORIZON_JSON, horizonFollowable, horizonVisible } from "../../lib/horizons";

describe("horizon visibility", () => {
  it("a pending invite can read a private horizon, and that row does not make it followable", () => {
    const read = horizonVisible("$2");
    const follow = horizonFollowable("$1");
    expect(read).toContain("from horizon_collaborators hc");
    expect(read).not.toMatch(/accepted_at is not null/);
    expect(read).toMatch(/declined_at is null/);
    expect(follow).toMatch(/accepted_at is not null/);
    expect(follow).not.toBe(read);
    const pending = HORIZON_JSON.split("pendingCollaboratorIds")[1] + HORIZON_JSON.split("pendingFollowerIds")[1];
    expect(pending).toMatch(/declined_at is null/);
    expect(HORIZON_JSON).toMatch(/collaboratorIds'[\s\S]*accepted_at is not null/);
  });
});
