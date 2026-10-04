import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** PUT /api/people/:id/follow — follow someone. They then see your "Friends" events (the one-way rule). */
export const PUT = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", "Nobody here with that id.");
  const me = await requirePerson();
  if (id === me.id) throw new HttpError(400, "self", "You can’t follow yourself.");
  const rows = (await sqlx().query(
    `insert into person_follows (follower_id, followee_id) select $1, p.id from people p where p.id = $2 on conflict do nothing returning 1`,
    [me.id, id],
  )) as unknown[];
  if (!rows.length) {
    const exists = (await sqlx().query(`select 1 from people where id = $1`, [id])) as unknown[];
    if (!exists.length) throw notFound("Nobody here with that id.");
  }
  return json({ following: true });
});

/** DELETE /api/people/:id/follow — unfollow. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", "Nobody here with that id.");
  const me = await requirePerson();
  await sqlx().query(`delete from person_follows where follower_id = $1 and followee_id = $2`, [me.id, id]);
  return json({ following: false });
});
