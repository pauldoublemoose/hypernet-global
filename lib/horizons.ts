import { sqlx } from "./db";

export type HorizonRole = "owner" | "collaborator" | "stranger";
export type HorizonAccess = { ownerId: string | null; isPersonalDefault: boolean; role: HorizonRole };

export const HORIZON_JSON = `json_build_object('id', h.id, 'slug', h.slug, 'ownerId', h.owner_id, 'ownerName', h.owner_name, 'name', h.name,
  'description', h.description, 'isPersonalDefault', h.is_personal_default, 'publishedAt', h.published_at, 'look', h.look,
  'coverEventId', h.cover_event_id, 'createdAt', h.created_at,
  'eventIds', coalesce((select json_agg(he.event_id order by he.position, he.added_at) from horizon_events he join events e on e.id = he.event_id
                         where he.horizon_id = h.id and can_see_event($2::uuid, e)), '[]'),
  'followers', (select count(*) from horizon_follows hf where hf.horizon_id = h.id),
  'collaboratorIds', coalesce((select json_agg(hc.person_id order by hc.created_at, hc.person_id) from horizon_collaborators hc where hc.horizon_id = h.id), '[]'))`;

export function horizonVisible(viewer: "$1" | "$2"): string {
  return `(h.published_at is not null or h.owner_id = ${viewer}::uuid or exists (select 1 from horizon_collaborators hc where hc.horizon_id = h.id and hc.person_id = ${viewer}::uuid))`;
}

async function selectHorizon(id: string, viewer: string | null, visibleOnly: boolean): Promise<unknown | null> {
  const gate = visibleOnly ? ` and ${horizonVisible("$2")}` : "";
  const rows = (await sqlx().query(
    `select ${HORIZON_JSON} v from horizons h where h.id = $1${gate}`,
    [id, viewer],
  )) as { v: unknown }[];
  return rows[0]?.v ?? null;
}

export async function horizonFor(id: string, viewer: string | null): Promise<unknown | null> {
  return selectHorizon(id, viewer, true);
}

/** A collaborator who just left a private horizon no longer passes horizonFor. The response still returns that row, with their event list. */
export async function horizonAfterEdit(id: string, viewer: string): Promise<unknown | null> {
  return (await selectHorizon(id, viewer, true)) ?? (await selectHorizon(id, viewer, false));
}

export async function horizonAccess(horizonId: string, personId: string): Promise<HorizonAccess | null> {
  const rows = (await sqlx().query(
    `select h.owner_id, h.is_personal_default,
       case when h.owner_id = $2 then 'owner'
            when exists (select 1 from horizon_collaborators hc where hc.horizon_id = h.id and hc.person_id = $2) then 'collaborator'
            else 'stranger' end as role
     from horizons h where h.id = $1`,
    [horizonId, personId],
  )) as { owner_id: string | null; is_personal_default: boolean; role: HorizonRole }[];
  const row = rows[0];
  if (!row) return null;
  return { ownerId: row.owner_id, isPersonalDefault: row.is_personal_default, role: row.role };
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
