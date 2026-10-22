// One table for event-page rights. Co-creator and attendee are RSVP labels and grant nothing here.
// Loosen a rule by editing EVENT_PERMS. index.html keeps the same object.

export const EVENT_PERMS = {
  manage: ["host", "admin"],
  edit: ["host", "admin", "link_adder"],
  privacy: ["host", "admin"],
  inviteAdmin: ["host", "admin"],
  removeAdmin: ["host"],
  demoteCocreator: ["host", "admin"],
  setCocreatorRule: ["host", "admin"],
  setGuestInvite: ["host", "admin"],
} as const;

export type Seat = "host" | "admin" | "cocreator" | "attendee" | "link_adder" | "guest";
export type RsvpRole = "host" | "cocreator" | "attendee";
export type Perm = keyof typeof EVENT_PERMS;

export type AccessInput = {
  viewerId: string | null;
  hostId: string | null;
  acceptedAdmin: boolean;
  linkAdder: boolean;
  rsvpRole: RsvpRole | null;
};

export type RoleDecision = {
  write: boolean;
  value: RsvpRole | null;
  error?: string;
};

export function seatOf(a: AccessInput): Seat {
  if (!a.viewerId) return "guest";
  if (a.hostId && a.viewerId === a.hostId) return "host";
  if (a.acceptedAdmin) return "admin";
  if (a.linkAdder) return "link_adder";
  if (a.rsvpRole === "cocreator") return "cocreator";
  if (a.rsvpRole === "attendee" || a.rsvpRole === "host") return "attendee";
  return "guest";
}

export function allows(action: Perm, seat: Seat): boolean {
  return (EVENT_PERMS[action] as readonly Seat[]).includes(seat);
}

export function canManageEvent(a: AccessInput): boolean {
  return allows("manage", seatOf(a));
}

export function canEditEvent(a: AccessInput): boolean {
  return allows("edit", seatOf(a));
}

/** Omit role to leave it. host is the event host only. The co-creator toggle blocks a non-admin from claiming it.
 *  Attendee and null stay open, so a co-creator can leave while the toggle is on. */
export function rsvpRoleDecision(seat: Seat, role: RsvpRole | null | undefined, onlyAdminsAddCocreators: boolean): RoleDecision {
  if (role === undefined) return { write: false, value: null };
  if (role === "host") {
    if (seat === "host") return { write: true, value: "host" };
    return { write: false, value: null, error: "Only the event host can set that role." };
  }
  if (role === "cocreator" && onlyAdminsAddCocreators && seat !== "host" && seat !== "admin") {
    return { write: false, value: null, error: "Only admins can add co-creators." };
  }
  if (role === null || role === "attendee" || role === "cocreator") return { write: true, value: role };
  return { write: false, value: null, error: "Only the event host can set that role." };
}

/** Admins can always invite. Otherwise the guest toggle, visibility, and an attendee-shaped RSVP all have to hold.
 *  Going with no stored role counts as attendee. Interested with no role does not. */
export function canInviteGuest(input: {
  seat: Seat;
  guestsCanInvite: boolean;
  canSee: boolean;
  rsvpRole: string | null;
  going: boolean;
}): boolean {
  if (input.seat === "host" || input.seat === "admin") return true;
  if (!input.guestsCanInvite || !input.canSee) return false;
  if (input.rsvpRole === "attendee" || input.rsvpRole === "cocreator") return true;
  return input.going && !input.rsvpRole;
}
