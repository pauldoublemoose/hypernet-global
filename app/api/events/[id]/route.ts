import { and, eq, isNull, sql } from "drizzle-orm";
import { currentPerson, requirePerson } from "@/lib/auth";
import { db, pgCode, schema } from "@/lib/db";
import { canEditEvent, canManageEvent } from "@/lib/event-access";
import { eventGate } from "@/lib/event-gate";
import { eventFor } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { eventPatch } from "@/lib/validation";

export const dynamic = "force-dynamic";

const e = schema.events;
const HIDDEN = "This event is private or no longer here.";

/** GET /api/events/:id — one event, if the viewer may see it. Missing and hidden answer the same 404. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", HIDDEN);
  const { person } = await currentPerson();
  const event = await eventFor(id, person?.id ?? null);
  if (!event) throw notFound(HIDDEN);
  return json({ event });
});

const NOT_YOURS = "No event of yours with that id.";

/** PATCH /api/events/:id {any event fields} — a host or accepted admin edits the event. Whoever added a link event
 *  corrects it, its organiser's name included (only a link event's host name changes). Privacy, who can send
 *  invites, and the co-creator rule stay with the host and accepted admins. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", HIDDEN);
  const me = await requirePerson();
  const { hostName, ...patch } = eventPatch.parse(await readJson(req));
  const gate = await eventGate(id, me.id);
  if (!gate || !canEditEvent(gate.access)) throw notFound(NOT_YOURS);
  const adminField = "privacy" in patch || "cocreatorPolicy" in patch || "invitePolicy" in patch;
  if (adminField && !canManageEvent(gate.access)) throw forbidden("Only an admin of this event can change that.");
  try {
    const rows = await db()
      .update(e)
      .set({ ...patch, ...(hostName ? { hostName: sql`case when ${e.source} = 'link' then ${hostName} else ${e.hostName} end` } : {}), updatedAt: sql`now()` })
      .where(and(eq(e.id, id), isNull(e.deletedAt)))
      .returning({ id: e.id });
    if (!rows.length) throw notFound(NOT_YOURS);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (pgCode(err) === "23514") throw new HttpError(400, "invalid", "A value is not allowed (check the dates, colours and picture).");
    if (pgCode(err) === "42703" && "invitePolicy" in patch) throw new HttpError(400, "invalid", "Invite policy needs migration 0010.");
    if (pgCode(err) === "42703" && "cocreatorPolicy" in patch) throw new HttpError(400, "invalid", "Co-creator policy needs migration 0011.");
    throw err;
  }
  return json({ event: await eventFor(id, me.id) });
});

/** DELETE /api/events/:id — a host, an accepted admin, or whoever added a link event deletes it: it leaves every
 *  list, horizon and feed (kept as deleted_at). */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", HIDDEN);
  const me = await requirePerson();
  const gate = await eventGate(id, me.id);
  if (!gate || !canEditEvent(gate.access)) throw notFound(NOT_YOURS);
  const rows = await db()
    .update(e)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(e.id, id), isNull(e.deletedAt)))
    .returning({ id: e.id });
  if (!rows.length) throw notFound(NOT_YOURS);
  return json({ ok: true });
});
