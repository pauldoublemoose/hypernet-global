import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { canSeeEvent, EVENT_GONE, eventGone } from "@/lib/events";
import { json, readJson, route } from "@/lib/http";
import { idParam, type Ctx } from "@/lib/ids";
import { rsvpPut } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * PUT /api/events/:id/rsvp {status: "going"|"interested"|null, went?, shiftIndex?, role?} — what you are to this event.
 * The activity time moves only when the status changes (un-going removes you from "going" at once).
 * role is host, cocreator or attendee. Omit it to leave the stored role alone.
 */
export const PUT = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", EVENT_GONE);
  const me = await requirePerson();
  const b = rsvpPut.parse(await readJson(req));
  if (!(await canSeeEvent(id, me.id))) throw eventGone();
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
    [me.id, id, b.status, b.went ?? null, b.shiftIndex ?? null, b.went !== undefined, b.shiftIndex !== undefined, b.role ?? null, b.role !== undefined],
  )) as { v: unknown }[];
  return json({ rsvp: rows[0].v });
});
