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
  reviewCocreator: ["host", "admin"],
  setGuestInvite: ["host", "admin"],
} as const;

export type Seat = "host" | "admin" | "cocreator" | "attendee" | "link_adder" | "guest";
export type RsvpRole = "host" | "cocreator" | "attendee";
export type CocreatorPolicy = "open" | "request" | "admins";
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
  /** null leaves cocreator_pending alone. false clears it. true stores a request. */
  pending: boolean | null;
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

/** Read path when 0011 is not applied yet. The old boolean meant admins, and everything else was open. */
export function cocreatorPolicyOf(raw: string | null | undefined, onlyAdmins?: boolean | null): CocreatorPolicy {
  if (raw === "open" || raw === "request" || raw === "admins") return raw;
  return onlyAdmins ? "admins" : "open";
}

/** Omit role to leave it. host is the event host only.
 *  open writes cocreator. request stores a pending flag and shows attendee until an admin approves.
 *  admins refuses a self-claim. attendee and null always write and clear a pending request, so someone can cancel or leave. */
export function rsvpRoleDecision(seat: Seat, role: RsvpRole | null | undefined, policy: CocreatorPolicy): RoleDecision {
  if (role === undefined) return { write: false, value: null, pending: null };
  if (role === "host") {
    if (seat === "host") return { write: true, value: "host", pending: false };
    return { write: false, value: null, pending: null, error: "Only the event host can set that role." };
  }
  if (role === null || role === "attendee") return { write: true, value: role, pending: false };
  if (role === "cocreator") {
    if (seat === "host" || seat === "admin" || policy === "open") return { write: true, value: "cocreator", pending: false };
    if (policy === "admins") return { write: false, value: null, pending: null, error: "Only admins can add co-creators." };
    return { write: true, value: "attendee", pending: true };
  }
  return { write: false, value: null, pending: null, error: "Only the event host can set that role." };
}

export const CHRONICLE_ACT = "Add to Chronicle";
export const PAST_INVITE_ACT = "Add people who were there";
export const CHRONICLE_HELP =
  "Your Chronicle is your list of past events, shown on your profile page. You choose who can see each event there.";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The short day the page uses in a past invite. */
export function eventDayLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${WEEK[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

/** What the invitee reads when someone adds them to a past event. */
export function pastInviteNotice(name: string, date: string, title: string): string {
  return `${name} added you to a past event (${date}): ${title}. Add it to your chronicle?`;
}

/** Which events a list returns. Omitted means current and upcoming. `only` is the chronicle picker. */
export function eventListWindow(past: string | undefined): "current" | "past" {
  return past === "only" ? "past" : "current";
}

export type EventChrome = {
  inviteLabel: string;
  inviteAdmin: boolean;
  guestInviteToggle: boolean;
  cocreatorPolicy: boolean;
  demote: boolean;
  removeAdmin: boolean;
  tickets: boolean;
  newCallout: boolean;
  promote: boolean;
  rsvp: boolean;
  chronicle: boolean;
  edit: boolean;
  privacy: boolean;
  eventControls: boolean;
};

/** What the event page shows. A logged event has no host here. A past event is a chronicle entry. */
export function eventChrome(input: { past: boolean; logged: boolean; seat: Seat; loggedIn: boolean }): EventChrome {
  const manager = input.seat === "host" || input.seat === "admin";
  const past = input.past;
  const logged = input.logged;
  return {
    inviteLabel: past ? PAST_INVITE_ACT : "Invite",
    inviteAdmin: !past && !logged && manager,
    guestInviteToggle: !past && !logged && manager,
    cocreatorPolicy: !past && !logged && manager,
    demote: !past && !logged && manager,
    removeAdmin: !past && !logged && input.seat === "host",
    tickets: !past,
    newCallout: !past && !logged && input.seat === "host",
    promote: !past,
    rsvp: !past,
    chronicle: past && input.loggedIn,
    edit: logged ? input.seat === "link_adder" : input.seat === "host" || input.seat === "admin",
    privacy: !logged && manager,
    eventControls: !logged && manager,
  };
}

/** Admins can always invite to an upcoming hosted event. Otherwise the guest toggle, visibility, and an
 *  attendee-shaped RSVP all have to hold. Going with no stored role counts as attendee. Interested with no role does not.
 *  A logged event (no host here) is never invitable. A past event is a chronicle add: the host, a co-creator, or an attendee. */
export function canInviteGuest(input: {
  seat: Seat;
  guestsCanInvite: boolean;
  canSee: boolean;
  rsvpRole: string | null;
  going: boolean;
  logged?: boolean;
  past?: boolean;
}): boolean {
  if (input.logged) return false;
  if (input.past) {
    if (input.seat === "host") return true;
    return input.rsvpRole === "attendee" || input.rsvpRole === "cocreator";
  }
  if (input.seat === "host" || input.seat === "admin") return true;
  if (!input.guestsCanInvite || !input.canSee) return false;
  if (input.rsvpRole === "attendee" || input.rsvpRole === "cocreator") return true;
  return input.going && !input.rsvpRole;
}
