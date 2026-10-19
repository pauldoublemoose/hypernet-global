import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { CALLOUT_JSON } from "@/lib/bootstrap";
import { canSeeEvent, eventGone } from "@/lib/events";
import { json, readJson, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";
import { calloutPatch } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** PATCH /api/callouts/:id {title?, body?, eventId?, skill?, expiresOn?, closed?} — its author edits, closes or reopens it. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = calloutPatch.parse(await readJson(req));
  if (b.eventId && !(await canSeeEvent(b.eventId, me.id))) throw eventGone();
  const has = (k: string) => k in b;
  const rows = (await sqlx().query(
    `update callouts as c set
       title = case when $3 then $4 else title end,
       body = case when $5 then $6 else body end,
       event_id = case when $7 then $8::uuid else event_id end,
       skill = case when $9 then $10 else skill end,
       expires_on = case when $11 then $12::date else expires_on end,
       closed_at = case when not $13 then closed_at when $14 then coalesce(closed_at, now()) else null end,
       updated_at = now()
     where id = $1 and author_id = $2 returning ${CALLOUT_JSON} v`,
    [id, me.id, has("title"), b.title ?? null, has("body"), b.body ?? "", has("eventId"), b.eventId ?? null, has("skill"), b.skill || null,
     has("expiresOn"), b.expiresOn ?? null, has("closed"), !!b.closed],
  )) as { v: unknown }[];
  if (!rows.length) throw notFound("No call out of yours with that id.");
  return json({ callout: rows[0].v });
});
