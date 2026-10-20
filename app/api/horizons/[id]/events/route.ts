import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { horizonAccess, horizonEventOrder, horizonFor, setHorizonEvents } from "@/lib/horizons";
import { json, readJson, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";
import { horizonEvents } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** PUT /api/horizons/:id/events {eventIds}. The owner or a collaborator sets the events, in order. */
export const PUT = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const { eventIds } = horizonEvents.parse(await readJson(req));
  const access = await horizonAccess(id, me.id);
  if (!access || access.role === "stranger") throw notFound("No horizon of yours with that id.");
  const sql = sqlx();
  const order = await horizonEventOrder(id, eventIds, me.id);
  await sql.transaction(setHorizonEvents(sql, id, order, me.id));
  return json({ horizon: await horizonFor(id, me.id) });
});
