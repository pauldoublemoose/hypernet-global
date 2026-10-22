import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { rsvpRoleDecision, seatOf } from "@/lib/event-access";
import { roleGate } from "@/lib/event-gate";
import { canSeeEvent } from "@/lib/events";
import { json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { rsvpPut } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * PUT /api/events/:id/rsvp {status: "going"|"interested"|null, went?, shiftIndex?, role?} — what you are to this event.
 * The activity time moves only when the status changes (un-going removes you from "going" at once).
 * role is host, cocreator or attendee. Omit it to leave the stored role alone.
 * Anyone who can see the event may set their own role to cocreator, attendee or null.
 * host only when the viewer is the event's host_id.
 * When only_admins_add_cocreators is on, a non-admin cannot claim cocreator. Leaving stays allowed.
 */
export const PUT = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = rsvpPut.parse(await readJson(req));
  if (!(await canSeeEvent(id, me.id))) throw notFound();
  const role = await rsvpRoleWrite(me.id, id, b.role);
  const rows = (await sqlx().query(
    `insert into rsvps as r (person_id, event_id, status, went, shift_index, role)
       values ($1, $2, $3::rsvp, coalesce($4, false), $5, $8)
     on conflict (person_id, event_id) do update set
       status = excluded.status,
       went = case when $6 then excluded.went else r.went end,
       shift_index = case when $7 then excluded.shift_index else r.shift_index end,
       role = case when $9 then excluded.role else r.role end,
       updated_at = case when r.status is distinct from excluded.status then now() else r.updated_at end
     returning json_build_object('status', r.status, 'went', r.went, 'shiftIndex', r.shift_index, 'role', r.role, 'updatedAt', r.updated_at) v`,
    [me.id, id, b.status, b.went ?? null, b.shiftIndex ?? null, b.went !== undefined, b.shiftIndex !== undefined, role.value, role.write],
  )) as { v: unknown }[];
  return json({ rsvp: rows[0].v });
});

/** Omit role to leave the stored one. cocreator, attendee and null are anyone's, unless only admins may add co-creators.
 *  host is the event host's. A co-creator can still leave while that toggle is on. */
async function rsvpRoleWrite(viewerId: string, eventId: string, role: "host" | "cocreator" | "attendee" | null | undefined): Promise<{ write: boolean; value: "host" | "cocreator" | "attendee" | null }> {
  if (role === undefined) return { write: false, value: null };
  const gate = await roleGate(eventId, viewerId);
  const seat = seatOf({
    viewerId,
    hostId: gate.hostId,
    acceptedAdmin: gate.acceptedAdmin,
    linkAdder: false,
    rsvpRole: null,
  });
  const decision = rsvpRoleDecision(seat, role, gate.onlyAdminsAddCocreators);
  if (decision.error) throw forbidden(decision.error);
  return { write: decision.write, value: decision.value };
}
