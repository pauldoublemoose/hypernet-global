import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { canManageEvent } from "@/lib/event-access";
import { eventGate } from "@/lib/event-gate";
import { json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { demoteBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/events/:id/demote {userId} — an admin sets someone else's co-creator label back to attendee. */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = demoteBody.parse(await readJson(req));
  const gate = await eventGate(id, me.id);
  if (!gate) throw notFound();
  if (!canManageEvent(gate.access)) throw forbidden("Only an admin of this event can demote a co-creator.");
  if (b.userId === me.id) throw forbidden("Demote changes someone else's role.");
  const rows = (await sqlx().query(
    `update rsvps set role = 'attendee', updated_at = now() where event_id = $1 and person_id = $2 and role = 'cocreator' returning person_id`,
    [id, b.userId],
  )) as { person_id: string }[];
  if (!rows.length) throw notFound("They are not a co-creator.");
  return json({ ok: true, role: "attendee" });
});
