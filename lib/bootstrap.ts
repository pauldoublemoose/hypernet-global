import { sqlx } from "./db";

// Everything the first screen needs, for one viewer, in ONE request to the database (one read-only transaction,
// so every list agrees with the others). Privacy is decided here, in SQL, with can_see_event: an event the
// viewer may not see never leaves the database — not as a row, a count, an RSVP, a horizon entry or an activity.
//
// Scale assumed (docs/research/neon-schema-v1.md): ~2,000 sign-ups, ~100 active. Whole-network lists are fine.

/** The columns of an event as the app reads them (dates stay YYYY-MM-DD strings). */
export const EVENT_JSON = `json_build_object(
  'id', e.id, 'slug', e.slug, 'hostId', e.host_id, 'hostName', e.host_name, 'title', e.title, 'description', e.description,
  'startsOn', e.starts_on, 'endsOn', e.ends_on, 'startTime', to_char(e.start_time, 'HH24:MI'), 'endTime', to_char(e.end_time, 'HH24:MI'),
  'timezone', e.timezone, 'kind', e.kind, 'privacy', e.privacy, 'city', e.city, 'region', e.region, 'country', e.country,
  'venue', e.venue, 'access', e.access, 'whatToBring', e.what_to_bring, 'details', e.details, 'look', e.look, 'source', e.source,
  'sourceUrl', e.source_url, 'addedBy', e.added_by,
  'previousEditionId', e.previous_edition_id, 'createdAt', e.created_at, 'updatedAt', e.updated_at)`;

export const PERSON_JSON = `json_build_object('id', p.id, 'handle', p.handle, 'displayName', p.display_name, 'bio', p.bio,
  'skills', p.skills, 'cities', p.cities, 'look', p.look, 'lastSeenAt', p.last_seen_at, 'createdAt', p.created_at)`;

export const CALLOUT_JSON = `json_build_object('id', c.id, 'authorId', c.author_id, 'eventId', c.event_id, 'title', c.title, 'body', c.body,
  'skill', c.skill, 'expiresOn', c.expires_on, 'closedAt', c.closed_at, 'createdAt', c.created_at)`;

const VISIBLE_CALLOUT = `(c.event_id is null or exists (select 1 from events ce where ce.id = c.event_id and can_see_event($1::uuid, ce)))`;

export type Bootstrap = {
  hypernet: 1;
  people: unknown[];
  follows: [string, string][];
  events: unknown[];
  rsvps: unknown[];
  promotions: [string, string][];
  horizons: unknown[];
  hzFollows: [string, string][];
  callouts: unknown[];
  replies: unknown[];
  activity: unknown[];
  chats: unknown[];
};

/** The bootstrap for a viewer (a person id, or null when logged out / not joined). */
export async function loadBootstrap(viewer: string | null): Promise<Bootstrap> {
  const sql = sqlx();
  const one = (text: string) => sql.query(text, [viewer]);
  const none = (text: string) => sql.query(text, []);
  const results = await sql.transaction(
    [
      none(`select coalesce(json_agg(${PERSON_JSON} order by p.created_at), '[]') v from people p`),
      none(`select coalesce(json_agg(json_build_array(f.follower_id, f.followee_id)), '[]') v from person_follows f`),
      one(`select coalesce(json_agg(${EVENT_JSON} order by e.starts_on), '[]') v from events e where can_see_event($1::uuid, e)`),
      one(`select coalesce(json_agg(json_build_object('personId', r.person_id, 'eventId', r.event_id, 'status', r.status, 'went', r.went,
             'shiftIndex', r.shift_index, 'updatedAt', r.updated_at)), '[]') v
             from rsvps r join events e on e.id = r.event_id where can_see_event($1::uuid, e)`),
      one(`select coalesce(json_agg(json_build_array(pr.person_id, pr.event_id)), '[]') v
             from promotions pr join events e on e.id = pr.event_id where can_see_event($1::uuid, e)`),
      one(`select coalesce(json_agg(json_build_object('id', h.id, 'slug', h.slug, 'ownerId', h.owner_id, 'ownerName', h.owner_name, 'name', h.name,
             'description', h.description, 'isPersonalDefault', h.is_personal_default, 'publishedAt', h.published_at, 'look', h.look,
             'coverEventId', h.cover_event_id, 'createdAt', h.created_at,
             'eventIds', coalesce((select json_agg(he.event_id order by he.position, he.added_at) from horizon_events he join events e on e.id = he.event_id
                                    where he.horizon_id = h.id and can_see_event($1::uuid, e)), '[]'),
             'followers', (select count(*) from horizon_follows hf where hf.horizon_id = h.id))
             order by h.created_at), '[]') v
             from horizons h where h.published_at is not null or (h.owner_id is not null and h.owner_id = $1::uuid)`),
      one(`select coalesce(json_agg(json_build_array(hf.person_id, hf.horizon_id)), '[]') v
             from horizon_follows hf join horizons h on h.id = hf.horizon_id where h.published_at is not null or h.owner_id = $1::uuid`),
      one(`select coalesce(json_agg(${CALLOUT_JSON} order by c.created_at desc), '[]') v from callouts c where ${VISIBLE_CALLOUT}`),
      one(`select coalesce(json_agg(json_build_object('id', r.id, 'calloutId', r.callout_id, 'authorId', r.author_id, 'text', r.text,
             'createdAt', r.created_at) order by r.created_at), '[]') v
             from callout_replies r join callouts c on c.id = r.callout_id where ${VISIBLE_CALLOUT}`),
      // the last three weeks of the network, each row only if what it points at is visible to the viewer
      one(`select coalesce(json_agg(json_build_object('actor', a.actor, 'verb', a.verb, 'objType', a.obj_type, 'objId', a.obj_id,
             'ts', a.ts, 'extra', a.extra) order by a.ts desc), '[]') v
             from (select * from activity a where a.ts > now() - interval '21 days' and a.actor is not null
                     and case a.obj_type
                           when 'event' then exists (select 1 from events e where e.id = a.obj_id and can_see_event($1::uuid, e))
                           when 'horizon' then exists (select 1 from horizons h where h.id = a.obj_id and (h.published_at is not null or h.owner_id = $1::uuid))
                           when 'callout' then exists (select 1 from callouts c where c.id = a.obj_id and ${VISIBLE_CALLOUT})
                           else true end
                   order by a.ts desc limit 600) a`),
      one(`select coalesce(json_agg(json_build_object('threadId', t.id, 'personId', case when t.a = $1::uuid then t.b else t.a end,
             'lastReadAt', (select tr.last_read_at from thread_reads tr where tr.thread_id = t.id and tr.person_id = $1::uuid),
             'messages', coalesce((select json_agg(json_build_object('id', m.id, 'senderId', m.sender_id, 'body', m.body, 'createdAt', m.created_at)
                                   order by m.created_at) from messages m where m.thread_id = t.id), '[]'))), '[]') v
             from dm_threads t where $1::uuid is not null and (t.a = $1::uuid or t.b = $1::uuid)`),
    ],
    { readOnly: true, isolationLevel: "RepeatableRead" },
  );
  const v = (i: number) => (results[i] as { v: unknown }[])[0].v as never;
  const visibleEvents = new Set((v(2) as { id: string }[]).map((e) => e.id));
  // a horizon's "added" row lists only the events the viewer may see (activityRows does the same in the browser)
  const activity = (v(9) as { verb: string; extra: { eventIds?: string[] } | null }[]).flatMap((a) => {
    if (a.verb !== "added_to_horizon" || !a.extra?.eventIds) return [a];
    const ids = a.extra.eventIds.filter((id) => visibleEvents.has(id));
    return ids.length ? [{ ...a, extra: { ...a.extra, eventIds: ids } }] : [];
  });
  return {
    hypernet: 1,
    people: v(0),
    follows: v(1),
    events: v(2),
    rsvps: v(3),
    promotions: v(4),
    horizons: v(5),
    hzFollows: v(6),
    callouts: v(7),
    replies: v(8),
    activity,
    chats: v(10),
  };
}

/** Only the viewer's conversations (polled while the app is open). */
export async function loadChats(viewer: string): Promise<unknown[]> {
  const rows = (await sqlx().query(
    `select coalesce(json_agg(json_build_object('threadId', t.id, 'personId', case when t.a = $1::uuid then t.b else t.a end,
       'lastReadAt', (select tr.last_read_at from thread_reads tr where tr.thread_id = t.id and tr.person_id = $1::uuid),
       'messages', coalesce((select json_agg(json_build_object('id', m.id, 'senderId', m.sender_id, 'body', m.body, 'createdAt', m.created_at)
                             order by m.created_at) from messages m where m.thread_id = t.id), '[]'))), '[]') v
       from dm_threads t where t.a = $1::uuid or t.b = $1::uuid`,
    [viewer],
  )) as { v: unknown[] }[];
  return rows[0].v;
}
