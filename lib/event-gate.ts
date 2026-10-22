import { pgCode, sqlx } from "./db";
import { seatOf, type AccessInput, type Seat } from "./event-access";

/** 0010 is not applied on every database yet. A missing table or column means no admins and the old defaults. */
export function relationMissing(err: unknown): boolean {
  const code = pgCode(err);
  return code === "42P01" || code === "42703";
}

type EventBase = {
  id: string;
  host_id: string | null;
  source: string;
  added_by: string | null;
  privacy: string;
  title: string;
  deleted_at: string | null;
  guests_can_invite?: boolean | null;
  only_admins_add_cocreators?: boolean | null;
};

export type EventGate = {
  viewerId: string;
  hostId: string | null;
  source: string;
  addedBy: string | null;
  privacy: string;
  title: string;
  guestsCanInvite: boolean;
  onlyAdminsAddCocreators: boolean;
  acceptedAdmin: boolean;
  pendingAdmin: boolean;
  linkAdder: boolean;
  seat: Seat;
  access: AccessInput;
};

export async function roleGate(eventId: string, viewerId: string): Promise<{ hostId: string | null; onlyAdminsAddCocreators: boolean; acceptedAdmin: boolean }> {
  try {
    const rows = (await sqlx().query(
      `select host_id, only_admins_add_cocreators,
              exists (select 1 from event_admins a where a.event_id = events.id and a.user_id = $2 and a.status = 'accepted') as accepted_admin
         from events where id = $1`,
      [eventId, viewerId],
    )) as { host_id: string | null; only_admins_add_cocreators?: boolean | null; accepted_admin?: boolean }[];
    const row = rows[0];
    return {
      hostId: row?.host_id ?? null,
      onlyAdminsAddCocreators: !!row?.only_admins_add_cocreators,
      acceptedAdmin: !!row?.accepted_admin,
    };
  } catch (err) {
    if (!relationMissing(err)) throw err;
    const rows = (await sqlx().query(`select host_id from events where id = $1`, [eventId])) as { host_id: string | null }[];
    return { hostId: rows[0]?.host_id ?? null, onlyAdminsAddCocreators: false, acceptedAdmin: false };
  }
}

export async function eventGate(eventId: string, viewerId: string): Promise<EventGate | null> {
  let row: EventBase | undefined;
  let guestsCanInvite = true;
  let onlyAdminsAddCocreators = false;
  let migrated = true;
  try {
    const rows = (await sqlx().query(
      `select id, host_id, source, added_by, privacy, title, deleted_at, guests_can_invite, only_admins_add_cocreators
         from events where id = $1`,
      [eventId],
    )) as EventBase[];
    row = rows[0];
    if (row) {
      guestsCanInvite = row.guests_can_invite !== false;
      onlyAdminsAddCocreators = !!row.only_admins_add_cocreators;
    }
  } catch (err) {
    if (!relationMissing(err)) throw err;
    migrated = false;
    const rows = (await sqlx().query(
      `select id, host_id, source, added_by, privacy, title, deleted_at from events where id = $1`,
      [eventId],
    )) as EventBase[];
    row = rows[0];
  }
  if (!row || row.deleted_at) return null;
  let acceptedAdmin = false;
  let pendingAdmin = false;
  if (migrated) {
    try {
      const admins = (await sqlx().query(
        `select status from event_admins where event_id = $1 and user_id = $2`,
        [eventId, viewerId],
      )) as { status: string }[];
      acceptedAdmin = admins[0]?.status === "accepted";
      pendingAdmin = admins[0]?.status === "pending";
    } catch (err) {
      if (!relationMissing(err)) throw err;
    }
  }
  const linkAdder = row.host_id == null && row.source === "link" && row.added_by === viewerId;
  const access: AccessInput = {
    viewerId,
    hostId: row.host_id,
    acceptedAdmin,
    linkAdder,
    rsvpRole: null,
  };
  return {
    viewerId,
    hostId: row.host_id,
    source: row.source,
    addedBy: row.added_by,
    privacy: row.privacy,
    title: row.title,
    guestsCanInvite,
    onlyAdminsAddCocreators,
    acceptedAdmin,
    pendingAdmin,
    linkAdder,
    seat: seatOf(access),
    access,
  };
}

export async function viewerRsvp(eventId: string, viewerId: string): Promise<{ status: string | null; role: string | null }> {
  const rows = (await sqlx().query(
    `select status, role from rsvps where event_id = $1 and person_id = $2`,
    [eventId, viewerId],
  )) as { status: string | null; role: string | null }[];
  return rows[0] ?? { status: null, role: null };
}
