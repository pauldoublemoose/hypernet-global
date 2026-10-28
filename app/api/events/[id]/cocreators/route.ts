import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { allows } from "@/lib/event-access";
import { eventGate, relationMissing } from "@/lib/event-gate";
import { json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { cocreatorReviewBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/events/:id/cocreators — pending requests, for a host or accepted admin. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const gate = await eventGate(id, me.id);
  if (!gate) throw notFound();
  if (!allows("reviewCocreator", gate.seat)) throw forbidden("Only an admin of this event can see co-creator requests.");
  try {
    const rows = (await sqlx().query(
      `select person_id from rsvps where event_id = $1 and cocreator_pending order by updated_at`,
      [id],
    )) as { person_id: string }[];
    return json({ requests: rows.map((r) => r.person_id) });
  } catch (err) {
    if (relationMissing(err) || pgCode(err) === "42703") return json({ requests: [] });
    throw err;
  }
});

/** POST /api/events/:id/cocreators {userId, action} — approve writes cocreator and clears the request. Decline clears it. */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = cocreatorReviewBody.parse(await readJson(req));
  const gate = await eventGate(id, me.id);
  if (!gate) throw notFound();
  if (!allows("reviewCocreator", gate.seat)) throw forbidden("Only an admin of this event can review a co-creator request.");
  const rows = (await sqlx().query(
    b.action === "approve"
      ? `update rsvps set role = 'cocreator', cocreator_pending = false, updated_at = now()
           where event_id = $1 and person_id = $2 and cocreator_pending returning person_id`
      : `update rsvps set cocreator_pending = false, updated_at = now()
           where event_id = $1 and person_id = $2 and cocreator_pending returning person_id`,
    [id, b.userId],
  )) as { person_id: string }[];
  if (!rows.length) throw notFound("No co-creator request from that person.");
  return json({ ok: true, action: b.action, role: b.action === "approve" ? "cocreator" : "attendee" });
});
