import { currentPerson, requirePerson } from "@/lib/auth";
import { db, pgCode, schema, sqlx } from "@/lib/db";
import { resolveAudience } from "@/lib/audience";
import { EVENT_JSON, presentEvent } from "@/lib/bootstrap";
import { eventFor, makeSlug } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { eventCreate, eventQuery } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD&host=<person id>&limit=100
 * The events the viewer may see. Logged out, that is none. `from` compares with the last
 * day of the event, so one that is still running is included.
 */
export const GET = route(async (req: Request) => {
  const q = eventQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { person } = await currentPerson();
  const rows = (await sqlx().query(
    `select coalesce(json_agg(v order by starts_on, title), '[]') v from (
       select ${EVENT_JSON} v, e.starts_on, e.title from events e
        where can_see_event($1::uuid, e)
          and ($2::date is null or coalesce(e.ends_on, e.starts_on) >= $2::date)
          and ($3::date is null or e.starts_on <= $3::date)
          and ($4::uuid is null or e.host_id = $4::uuid)
        order by e.starts_on, e.title limit $5) x`,
    [person?.id ?? null, q.from ?? null, q.to ?? null, q.host ?? null, q.limit],
  )) as { v: { hostId: string | null }[] }[];
  const viewer = person?.id ?? null;
  return json({ events: rows[0].v.map((e) => presentEvent(e, viewer)), viewer });
});

/** POST /api/events {id?, title, startsOn, …} — create an event hosted by the logged-in person. */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const { id, privacy, audience, ...body } = eventCreate.parse(await readJson(req));
  const aud = await resolveAudience(me.id, { audience, privacy });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [row] = await db()
        .insert(schema.events)
        .values({ ...body, ...(id ? { id } : {}), audience: aud, slug: makeSlug(body.title), hostId: me.id, hostName: me.displayName, source: "user" })
        .returning({ id: schema.events.id });
      return json({ event: await eventFor(row.id, me.id) }, 201);
    } catch (err) {
      const code = pgCode(err);
      if (code === "23505" && id && String((err as { cause?: { constraint?: string } }).cause?.constraint ?? "").includes("pkey")) {
        throw new HttpError(409, "exists", "An event with this id exists.");
      }
      if (code === "23514") throw new HttpError(400, "invalid", "A value is not allowed (check the colours and the picture).");
      if (code !== "23505") throw err; // a slug collision: try another suffix
    }
  }
  throw new HttpError(409, "slug_conflict", "Could not find a free slug; try again.");
});

