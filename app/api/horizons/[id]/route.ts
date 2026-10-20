import { requirePerson } from "@/lib/auth";
import { currentPerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { horizonAccess, horizonFollowed, horizonFor } from "@/lib/horizons";
import { HttpError, json, readJson, route } from "@/lib/http";
import { forbidden, idParam, j, notFound, type Ctx } from "@/lib/ids";
import { horizonPatch } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/horizons/:id, when it is published or the viewer owns or collaborates on it. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const { person } = await currentPerson();
  const horizon = await horizonFor(id, person?.id ?? null);
  if (!horizon) throw notFound();
  return json({ horizon });
});

/** PATCH /api/horizons/:id {name?, description?, published?, look?, coverEventId?}. The owner edits all of it. A collaborator edits the name and the description. A follower cannot. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = horizonPatch.parse(await readJson(req));
  const access = await horizonAccess(id, me.id);
  if (!access || access.role === "stranger") {
    if (access?.role === "stranger" && (await horizonFollowed(id, me.id))) throw forbidden();
    throw notFound("No horizon of yours with that id.");
  }
  const has = (k: string) => k in b;
  if (access.role === "collaborator" && (has("published") || has("look") || has("coverEventId"))) {
    throw forbidden("Only the owner can change who can see this, its look, or its cover.");
  }
  try {
    const rows = (await sqlx().query(
      `update horizons set
         name = case when $3 then $4 else name end,
         description = case when $5 then $6 else description end,
         published_at = case when not $7 then published_at when $8 then coalesce(published_at, now()) else null end,
         look = case when $9 then $10::jsonb else look end,
         cover_event_id = case when $11 then $12::uuid else cover_event_id end
       where id = $1 and (owner_id = $2 or exists (
         select 1 from horizon_collaborators hc where hc.horizon_id = $1 and hc.person_id = $2 and hc.accepted_at is not null
       )) returning id`,
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

/** DELETE /api/horizons/:id. Its owner deletes it. A collaborator cannot. Its events stay on Hypernet. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const access = await horizonAccess(id, me.id);
  if (!access || access.role === "stranger") throw notFound("No horizon of yours with that id.");
  if (access.role === "collaborator") throw forbidden();
  const rows = (await sqlx().query(`delete from horizons where id = $1 and owner_id = $2 returning id`, [id, me.id])) as unknown[];
  if (!rows.length) throw notFound("No horizon of yours with that id.");
  return json({ ok: true });
});
