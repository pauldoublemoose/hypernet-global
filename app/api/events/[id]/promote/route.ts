import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { canSeeEvent, EVENT_GONE, eventGone } from "@/lib/events";
import { json, route } from "@/lib/http";
import { idParam, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** PUT /api/events/:id/promote — you promote it (your followers see it on Home). */
export const PUT = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", EVENT_GONE);
  const me = await requirePerson();
  if (!(await canSeeEvent(id, me.id))) throw eventGone();
  await sqlx().query(`insert into promotions (person_id, event_id) values ($1, $2) on conflict do nothing`, [me.id, id]);
  return json({ promoted: true });
});

/** DELETE /api/events/:id/promote — not any more. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", EVENT_GONE);
  const me = await requirePerson();
  if (!(await canSeeEvent(id, me.id))) throw eventGone();
  await sqlx().query(`delete from promotions where person_id = $1 and event_id = $2`, [me.id, id]);
  return json({ promoted: false });
});
