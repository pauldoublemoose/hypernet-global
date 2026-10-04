import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { json, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** PUT /api/horizons/:id/follow — follow a published horizon. */
export const PUT = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const rows = (await sqlx().query(
    `insert into horizon_follows (person_id, horizon_id)
       select $1, h.id from horizons h where h.id = $2 and (h.published_at is not null or h.owner_id = $1)
     on conflict do nothing returning 1`,
    [me.id, id],
  )) as unknown[];
  if (!rows.length) {
    const ok = (await sqlx().query(`select 1 from horizons h where h.id = $2 and (h.published_at is not null or h.owner_id = $1)`, [me.id, id])) as unknown[];
    if (!ok.length) throw notFound();
  }
  return json({ following: true });
});

/** DELETE /api/horizons/:id/follow — unfollow. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  await sqlx().query(`delete from horizon_follows where person_id = $1 and horizon_id = $2`, [me.id, id]);
  return json({ following: false });
});
