import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { horizonFor, setHorizonEvents } from "@/lib/horizons";
import { json, readJson, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";
import { horizonEvents } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** PUT /api/horizons/:id/events {eventIds} — the horizon's events, all of them, in order (add, remove, reorder). */
export const PUT = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const { eventIds } = horizonEvents.parse(await readJson(req));
  const sql = sqlx();
  const own = (await sql.query(`select 1 from horizons where id = $1 and owner_id = $2`, [id, me.id])) as unknown[];
  if (!own.length) throw notFound("No horizon of yours with that id.");
  await sql.transaction(setHorizonEvents(sql, id, eventIds, me.id));
  return json({ horizon: await horizonFor(id, me.id) });
});
