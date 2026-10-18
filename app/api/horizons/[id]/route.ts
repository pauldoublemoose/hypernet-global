import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { horizonFor } from "@/lib/horizons";
import { HttpError, json, readJson, route } from "@/lib/http";
import { idParam, j, notFound, type Ctx } from "@/lib/ids";
import { personOrNotFound } from "@/lib/relations";
import { horizonPatch } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/horizons/:id — a published horizon, or your own. A logged-out viewer gets the same 404 as a missing id. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await personOrNotFound();
  const horizon = await horizonFor(id, me.id);
  if (!horizon) throw notFound();
  return json({ horizon });
});

/** PATCH /api/horizons/:id {name?, description?, published?, look?, coverEventId?} — its owner edits it. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = horizonPatch.parse(await readJson(req));
  const has = (k: string) => k in b;
  try {
    const rows = (await sqlx().query(
      `update horizons set
         name = case when $3 then $4 else name end,
         description = case when $5 then $6 else description end,
         published_at = case when not $7 then published_at when $8 then coalesce(published_at, now()) else null end,
         look = case when $9 then $10::jsonb else look end,
         cover_event_id = case when $11 then $12::uuid else cover_event_id end
       where id = $1 and owner_id = $2 returning id`,
      [id, me.id, has("name"), b.name ?? null, has("description"), b.description ?? "", has("published"), !!b.published,
       has("look"), j(b.look), has("coverEventId"), b.coverEventId ?? null],
    )) as unknown[];
    if (!rows.length) throw notFound("No horizon of yours with that id.");
  } catch (err) {
    if (pgCode(err) === "23514") throw new HttpError(400, "invalid", "A value is not allowed (check the colours and the picture).");
    throw err;
  }
  return json({ horizon: await horizonFor(id, me.id) });
});

/** DELETE /api/horizons/:id — its owner deletes it; its events stay on Hypernet. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const rows = (await sqlx().query(`delete from horizons where id = $1 and owner_id = $2 returning id`, [id, me.id])) as unknown[];
  if (!rows.length) throw notFound("No horizon of yours with that id.");
  return json({ ok: true });
});
