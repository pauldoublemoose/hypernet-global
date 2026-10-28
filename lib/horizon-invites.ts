const STATES = ["pending", "accepted", "declined", "cancelled"] as const;
export type InviteState = (typeof STATES)[number];
export type InviteRole = "collaborator" | "follower";
export type ParsedInvite = { state: InviteState; role: InviteRole };

export function inviteBody(state: InviteState, role: InviteRole): string {
  return role === "follower" ? `${state} follower` : state;
}

export function parseInviteBody(body: string): ParsedInvite | null {
  for (const state of STATES) {
    if (body === inviteBody(state, "collaborator")) return { state, role: "collaborator" };
    if (body === inviteBody(state, "follower")) return { state, role: "follower" };
  }
  return null;
}

export type InviteAnswer = "accept" | "decline" | "undo";

export function respondInvite(current: ParsedInvite, answer: InviteAnswer): ParsedInvite | null {
  if (current.state === "cancelled") return null;
  if (answer === "accept" && current.state === "pending") return { state: "accepted", role: current.role };
  if (answer === "decline" && current.state === "pending") return { state: "declined", role: current.role };
  if (answer === "undo" && (current.state === "accepted" || current.state === "declined")) return { state: "pending", role: current.role };
  return null;
}
