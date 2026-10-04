import { and, asc, eq, lte, sql, type SQL } from "drizzle-orm";
import { currentPerson, requirePerson } from "@/lib/auth";
import { db, pgCode, schema } from "@/lib/db";
import { canSee, eventColumns, makeSlug } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { eventCreate, eventQuery } from "@/lib/validation";

export const dynamic = "force-dynamic";

const e = schema.events;

/**
 * GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD&host=<person id>&limit=100
 * The events the viewer may see (logged out: public ones only), soonest first. `from` compares with the last
 * day of the event, so one that is still running is included.
 */
export const GET = route(async (req: Request) => {
  const q = eventQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { person } = await currentPerson();
  const where: SQL[] = [canSee(person?.id ?? null)];
  if (q.from) where.push(sql`coalesce(${e.endsOn}, ${e.startsOn}) >= ${q.from}`);
  if (q.to) where.push(lte(e.startsOn, q.to));
  if (q.host) where.push(eq(e.hostId, q.host));
  const events = await db()
    .select(eventColumns)
    .from(e)
    .where(and(...where))
    .orderBy(asc(e.startsOn), asc(e.startTime), asc(e.title))
    .limit(q.limit);
  return json({ events, viewer: person?.id ?? null });
});

/** POST /api/events {title, startsOn, …} — create an event hosted by the logged-in person. */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const body = eventCreate.parse(await readJson(req));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [created] = await db()
        .insert(e)
        .values({ ...body, slug: makeSlug(body.title), hostId: me.id, hostName: me.displayName, source: "user" })
        .returning(eventColumns);
      return json({ event: created }, 201);
    } catch (err) {
      if (pgCode(err) !== "23505") throw err; // a slug collision: try another suffix
    }
  }
  throw new HttpError(409, "slug_conflict", "Could not find a free slug; try again.");
});
