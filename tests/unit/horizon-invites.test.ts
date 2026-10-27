import { describe, expect, it } from "vitest";
import { inviteBody, parseInviteBody, respondInvite } from "../../lib/horizon-invites";

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

  it("accept, decline, and undo move one invite, and a cancelled invite stays put", () => {
    expect(respondInvite({ state: "pending", role: "collaborator" }, "accept")).toEqual({ state: "accepted", role: "collaborator" });
    expect(respondInvite({ state: "accepted", role: "collaborator" }, "undo")).toEqual({ state: "pending", role: "collaborator" });
    expect(respondInvite({ state: "pending", role: "collaborator" }, "decline")).toEqual({ state: "declined", role: "collaborator" });
    expect(respondInvite({ state: "declined", role: "collaborator" }, "undo")).toEqual({ state: "pending", role: "collaborator" });
    expect(respondInvite({ state: "pending", role: "follower" }, "accept")).toEqual({ state: "accepted", role: "follower" });
    expect(respondInvite({ state: "accepted", role: "follower" }, "undo")).toEqual({ state: "pending", role: "follower" });
    expect(respondInvite({ state: "declined", role: "follower" }, "undo")).toEqual({ state: "pending", role: "follower" });
    expect(respondInvite({ state: "accepted", role: "collaborator" }, "accept")).toBeNull();
    expect(respondInvite({ state: "pending", role: "collaborator" }, "undo")).toBeNull();
    expect(respondInvite({ state: "cancelled", role: "collaborator" }, "undo")).toBeNull();
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
