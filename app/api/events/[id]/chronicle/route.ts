import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { chronicleAddRole } from "@/lib/event-access";
import { canSeeEvent } from "@/lib/events";
import { HttpError, json, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/:id/chronicle — add this past event to the caller's chronicle.
 * No body. Idempotent. Sets went, and attendee when no role is stored and the caller is not the host.
 * A stored role is left alone. "No" and dismissing a prompt do not call this route.
 */
export const POST = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  if (!(await canSeeEvent(id, me.id))) throw notFound();
  const found = (await sqlx().query(
    `select host_id, (coalesce(ends_on, starts_on) < current_date) as past from events where id = $1`,
    [id],
  )) as { host_id: string | null; past: boolean }[];
  const event = found[0];
  if (!event) throw notFound();
  if (!event.past) throw new HttpError(409, "not_past", "Only a past event can be added to a chronicle.");
  const host = event.host_id != null && event.host_id === me.id;
  const role = chronicleAddRole({ host, role: null });
  let rows: { v: { went: boolean; role: string | null; status: string | null } }[];
  try {
    rows = (await sqlx().query(
      `insert into rsvps as r (person_id, event_id, went, role)
         values ($1, $2, true, $3)
       on conflict (person_id, event_id) do update set
         went = true,
         role = coalesce(r.role, excluded.role)
       returning json_build_object('went', r.went, 'role', r.role, 'status', r.status) v`,
      [me.id, id, role],
    )) as { v: { went: boolean; role: string | null; status: string | null } }[];
  } catch (err) {
    if (pgCode(err) !== "42703") throw err;
    rows = (await sqlx().query(
      `insert into rsvps as r (person_id, event_id, went)
         values ($1, $2, true)
       on conflict (person_id, event_id) do update set went = true
       returning json_build_object('went', r.went, 'role', null, 'status', r.status) v`,
      [me.id, id],
    )) as { v: { went: boolean; role: string | null; status: string | null } }[];
  }
  return json({ chronicle: rows[0].v });
});
