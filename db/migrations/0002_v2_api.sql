-- 0002_v2_api — what the wired prototype needs on top of 0001_init.
--   * activity also says who replied under a call out (replied_callout, extra.replyId), as the UI does;
--   * a horizon may name the event whose square stands for it (the curated "Season of burns");
--   * callouts.closed_at / expires_on are what "open" means (unchanged); replies need a fast lookup by author;
--   * one personal default horizon per person at most.

alter table horizons add column cover_event_id uuid references events on delete set null;

create unique index horizons_one_default_per_owner on horizons (owner_id) where is_personal_default;
create index callout_replies_author on callout_replies (author_id);
create index rsvps_person on rsvps (person_id);
create index promotions_person on promotions (person_id);
create index horizon_follows_person on horizon_follows (person_id);
create index dm_threads_b on dm_threads (b);

create or replace view activity as
            select person_id actor, status::text verb, 'event' obj_type, event_id obj_id, updated_at ts, null::jsonb extra
              from rsvps where status is not null
  union all select person_id, 'promoted', 'event', event_id, created_at, null from promotions
  union all select host_id, 'created_event', 'event', id, created_at, null from events
              where host_id is not null and deleted_at is null
  union all select owner_id, 'published_horizon', 'horizon', id, published_at, null from horizons
              where published_at is not null and owner_id is not null
  union all select person_id, 'followed_horizon', 'horizon', horizon_id, created_at, null from horizon_follows
  union all select added_by, 'added_to_horizon', 'horizon', horizon_id, max(added_at), jsonb_build_object('eventIds', jsonb_agg(event_id))
              from horizon_events where added_by is not null group by added_by, horizon_id, date_trunc('hour', added_at)
  union all select author_id, 'posted_callout', 'callout', id, created_at, null from callouts
  union all select author_id, 'replied_callout', 'callout', callout_id, created_at, jsonb_build_object('replyId', id) from callout_replies
  union all select follower_id, 'followed_person', 'person', followee_id, created_at, null from person_follows;

insert into _migrations (name) values ('0002_v2_api');
