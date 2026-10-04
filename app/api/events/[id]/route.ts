import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { currentPerson, requirePerson } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { canSee, eventColumns } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { eventPatch } from "@/lib/validation";

export const dynamic = "force-dynamic";

const e = schema.events;
type Ctx = { params: Promise<{ id: string }> };

// An id that is not a uuid, an event that doesn't exist and one you may not see all answer the same 404,
// so a private event's existence never leaks ("private or no longer here" in the UI).
async function eventId(ctx: Ctx): Promise<string> {
  const { id } = await ctx.params;
  const ok = z.uuid().safeParse(id);
  if (!ok.success) throw new HttpError(404, "not_found", "This event is private or no longer here.");
  return ok.data;
}

/** GET /api/events/:id — one event, if the viewer may see it. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const id = await eventId(ctx);
  const { person } = await currentPerson();
  const [event] = await db()
    .select(eventColumns)
    .from(e)
    .where(and(eq(e.id, id), canSee(person?.id ?? null)))
    .limit(1);
  if (!event) throw new HttpError(404, "not_found", "This event is private or no longer here.");
  return json({ event });
});

/** PATCH /api/events/:id {any event fields} — the host edits their event. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const id = await eventId(ctx);
  const me = await requirePerson();
  const patch = eventPatch.parse(await readJson(req));
  const [event] = await db()
    .update(e)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(and(eq(e.id, id), eq(e.hostId, me.id), isNull(e.deletedAt)))
    .returning(eventColumns);
  if (!event) throw new HttpError(404, "not_found", "No event of yours with that id.");
  return json({ event });
});
