import { sqlx } from "./db";

export const HORIZON_JSON = `json_build_object('id', h.id, 'slug', h.slug, 'ownerId', h.owner_id, 'ownerName', h.owner_name, 'name', h.name,
  'description', h.description, 'isPersonalDefault', h.is_personal_default, 'publishedAt', h.published_at, 'look', h.look,
  'coverEventId', h.cover_event_id, 'createdAt', h.created_at,
  'eventIds', coalesce((select json_agg(he.event_id order by he.position, he.added_at) from horizon_events he join events e on e.id = he.event_id
                         where he.horizon_id = h.id and can_see_event($2::uuid, e)), '[]'),
  'followers', (select count(*) from horizon_follows hf where hf.horizon_id = h.id))`;

/** A horizon as the app reads it, for its owner (or anyone, when published). */
export async function horizonFor(id: string, viewer: string | null): Promise<unknown | null> {
  const rows = (await sqlx().query(
    `select ${HORIZON_JSON} v from horizons h where h.id = $1 and (h.published_at is not null or h.owner_id = $2::uuid)`,
    [id, viewer],
  )) as { v: unknown }[];
  return rows[0]?.v ?? null;
}

/** "Autumn builds" → "autumn-builds-3fa9c1" (horizon slugs are unique). */
export function hzSlug(name: string, id: string): string {
  const base = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  return `${base || "horizon"}-${id.replace(/-/g, "").slice(0, 6)}`;
}

/**
 * Sets a horizon's events to exactly `eventIds`, in that order: new ones are added by `by`, missing ones removed.
 * Only events `by` may see can be put on it. Returns the queries, to run inside the caller's transaction.
 */
export function setHorizonEvents(sql: ReturnType<typeof sqlx>, horizonId: string, eventIds: string[], by: string) {
  const ids = [...new Set(eventIds)];
  return [
    sql.query(`delete from horizon_events where horizon_id = $1 and not (event_id = any($2::uuid[]))`, [horizonId, ids]),
    sql.query(
      `insert into horizon_events (horizon_id, event_id, position, added_by)
         select $1, x.id, x.ord::int - 1, $3 from unnest($2::uuid[]) with ordinality as x(id, ord)
           join events e on e.id = x.id where can_see_event($3::uuid, e)
       on conflict (horizon_id, event_id) do update set position = excluded.position`,
      [horizonId, ids, by],
    ),
  ];
}
