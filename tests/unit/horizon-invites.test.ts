import { describe, expect, it } from "vitest";
import { inviteBody, parseInviteBody } from "../../lib/horizon-invites";

const states = ["pending", "accepted", "declined", "cancelled"] as const;

describe("invite bodies", () => {
  it("collaborator bodies are the state word with no suffix", () => {
    for (const state of states) {
      expect(inviteBody(state, "collaborator")).toBe(state);
      expect(parseInviteBody(state)).toEqual({ state, role: "collaborator" });
    }
  });

  it("follower bodies keep the state word and the suffix", () => {
    for (const state of states) {
      const body = `${state} follower`;
      expect(inviteBody(state, "follower")).toBe(body);
      expect(parseInviteBody(body)).toEqual({ state, role: "follower" });
    }
  });

  it("a body that is not an invite parses to null", () => {
    expect(parseInviteBody("hello")).toBeNull();
    expect(parseInviteBody("")).toBeNull();
    expect(parseInviteBody("pending followers")).toBeNull();
    expect(parseInviteBody("follower")).toBeNull();
    expect(parseInviteBody("Pending")).toBeNull();
    expect(parseInviteBody("accepted  follower")).toBeNull();
  });
});
