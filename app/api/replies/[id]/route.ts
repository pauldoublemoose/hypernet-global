import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { json, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** DELETE /api/replies/:id — its author takes it off, or the call out's author does. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const rows = (await sqlx().query(
    `delete from callout_replies r using callouts c
      where r.id = $1 and c.id = r.callout_id and (r.author_id = $2 or c.author_id = $2) returning r.id`,
    [id, me.id],
  )) as unknown[];
  if (!rows.length) throw notFound("No reply you can delete with that id.");
  return json({ ok: true });
});
