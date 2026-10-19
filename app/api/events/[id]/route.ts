import { and, eq, isNull, or, sql } from "drizzle-orm";
import { currentPerson, requirePerson } from "@/lib/auth";
import { db, pgCode, schema, sqlx } from "@/lib/db";
import { resolveAudience } from "@/lib/audience";
import { EVENT_GONE, eventFor, eventGone } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";
import { eventPatch, type Privacy } from "@/lib/validation";

export const dynamic = "force-dynamic";

const e = schema.events;

/** Yours to change: you host it, or nobody here does and you added it from a link (until a host claims it). */
const mine = (me: string) => or(eq(e.hostId, me), and(isNull(e.hostId), eq(e.source, "link"), eq(e.addedBy, me)));

/** GET /api/events/:id — one event, if the viewer may see it. Missing and hidden answer the same 404. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", EVENT_GONE);
  const { person } = await currentPerson();
  if (!person) throw eventGone();
  const event = await eventFor(id, person.id);
  if (!event) throw eventGone();
  return json({ event });
});

/** PATCH /api/events/:id {any event fields} — the host edits their event (details, look); whoever added a link event
 *  corrects it, its organiser's name included (only a link event's host name changes). */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", EVENT_GONE);
  const me = await requirePerson();
  const { hostName, privacy, audience, ...patch } = eventPatch.parse(await readJson(req));
  let audienceUpdate: Awaited<ReturnType<typeof resolveAudience>> | undefined;
  if (audience || privacy) {
    const cur = (await sqlx().query(
      `select privacy, host_id from events
        where id = $1 and deleted_at is null
          and (host_id = $2 or (host_id is null and source = 'link' and added_by = $2))`,
      [id, me.id],
    )) as { privacy: Privacy; host_id: string | null }[];
    if (!cur.length) throw notFound("No event of yours with that id.");
    if (audience || cur[0].privacy !== privacy) {
      if (cur[0].host_id !== me.id) throw new HttpError(400, "invalid", "A link event stays visible to every logged-in person.");
      audienceUpdate = await resolveAudience(me.id, audience ? { audience } : { privacy });
    }
  }
  try {
    const rows = await db()
      .update(e)
      .set({ ...patch, ...(audienceUpdate ? { audience: audienceUpdate } : {}), ...(hostName ? { hostName: sql`case when ${e.source} = 'link' then ${hostName} else ${e.hostName} end` } : {}), updatedAt: sql`now()` })
      .where(and(eq(e.id, id), mine(me.id), isNull(e.deletedAt)))
      .returning({ id: e.id });
    if (!rows.length) throw notFound("No event of yours with that id.");
  } catch (err) {
    if (pgCode(err) === "23514") throw new HttpError(400, "invalid", "A value is not allowed (check the dates, colours and picture).");
    throw err;
  }
  return json({ event: await eventFor(id, me.id) });
});

/** DELETE /api/events/:id — the host (or, for a link event, whoever added it) deletes it: it leaves every list,
 *  horizon and feed (kept as deleted_at). */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", EVENT_GONE);
  const me = await requirePerson();
  const rows = await db()
    .update(e)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(e.id, id), mine(me.id), isNull(e.deletedAt)))
    .returning({ id: e.id });
  if (!rows.length) throw notFound("No event of yours with that id.");
  return json({ ok: true });
});
