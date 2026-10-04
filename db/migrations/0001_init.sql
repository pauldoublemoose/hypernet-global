-- 0001_init — Hypernet v1 schema. The source of truth for the database; db/schema.ts mirrors it for Drizzle.
-- From docs/research/neon-schema-v1.md, with these changes:
--   * call-out "answers" are public replies: callout_replies {id, callout_id, author_id, text, created_at}
--     (replaces callout_answers);
--   * a look's picture is `image` (the key the UI uses, _shared/hypernet-themes.js), and it must live in our
--     Neon storage bucket `images` (not Vercel Blob);
--   * images rows record what was uploaded (key, url, mime, declared bytes ≤ 10 MB); width/height are not
--     checked here because the server never sees the pixels (the browser crops to ≤ 512px before upload);
--   * pgcrypto is not needed (gen_random_uuid() is built into Postgres 13+);
--   * a _migrations table records which files ran on this branch.
-- Apply with the Neon MCP (run_sql_transaction) to the dev branch first; main only when the owner says so.

create table if not exists _migrations (
  name       text primary key,
  applied_at timestamptz not null default now()
);

create extension if not exists citext;

create type privacy as enum ('everyone', 'friends', 'only_me');
create type rsvp    as enum ('going', 'interested');

/* a look: three hex colours, an optional square picture in our storage bucket, a glyph (HN_HEX / HN_IMAGE) */
create function is_look(l jsonb) returns boolean language sql immutable as $$
  select l is null or (
        jsonb_typeof(l) = 'object'
    and coalesce(l->>'bg'     ~ '^#[0-9a-f]{6}$', false)
    and coalesce(l->>'ink'    ~ '^#[0-9a-f]{6}$', false)
    and coalesce(l->>'accent' ~ '^#[0-9a-f]{6}$', false)
    and (l->>'image' is null
         or l->>'image' ~ '^https://br-[a-z0-9-]+\.storage\.c-[0-9]+\.[a-z0-9-]+\.aws\.neon\.tech/images/[A-Za-z0-9/_.-]+$')
    and (l->>'glyph' is null or char_length(l->>'glyph') <= 4)
  ) $$;

create table people (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique not null,                       -- neon_auth."user".id (the email login); no FK: Neon owns that schema
  email         citext unique not null,
  handle        citext unique not null check (handle ~ '^[a-z0-9._-]{1,30}$'),
  display_name  text not null check (char_length(display_name) between 1 and 80),
  bio           text check (char_length(bio) <= 120),
  skills        text[] not null default '{}',              -- 'SOUND/DJING' codes (SKILLCHOICES)
  cities        text[] not null default '{}',
  look          jsonb check (is_look(look)),               -- null = plain; look.image is the photo
  last_seen_at  timestamptz,                               -- replaces the fake PRESENCE map
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table images (                                       -- objects in the `images` storage bucket
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references people on delete cascade,
  key        text not null unique,                          -- object key inside the bucket
  url        text not null unique,                          -- public URL (what goes into look.image)
  mime       text not null check (mime in ('image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif')),
  bytes      int  not null check (bytes between 1 and 10 * 1024 * 1024),  -- as declared when the upload was signed
  created_at timestamptz not null default now()
);
create index on images (owner_id);

create table events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  host_id             uuid references people,               -- null only for imported real events
  host_name           text not null,                        -- organiser as shown ("Gränslandet Ideell Förening")
  title               text not null check (char_length(title) between 1 and 140),
  description         text not null default '',
  starts_on           date not null,
  ends_on             date check (ends_on is null or ends_on >= starts_on),
  start_time          time, end_time time,
  timezone            text not null default 'Europe/Stockholm',
  kind                text not null default 'meetup',       -- EVENTKINDS
  privacy             privacy not null default 'everyone',
  city                text, region text, country text,
  venue               jsonb,                                -- {name, addressVisibility}
  access              jsonb,                                -- {model, tiers, sales, lowIncome, ...}
  what_to_bring       text[] not null default '{}',
  details             jsonb,                                -- the rest of the record: burn{}, blocks[], principles, sources
  look                jsonb check (is_look(look)),
  source              text not null default 'user' check (source in ('user', 'import')),
  previous_edition_id uuid references events,               -- replaces makeNextEditions' synthetic '--next' ids
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  check (source = 'import' or host_id is not null)
);
create index on events (starts_on) where deleted_at is null;
create index on events (host_id);

create table horizons (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  owner_id            uuid references people,               -- null = curated by Hypernet (Season of burns)
  owner_name          text,                                 -- groups are v2: a camp-owned horizon keeps its name here
  name                text not null check (char_length(name) between 1 and 80),
  description         text not null default '',
  is_personal_default boolean not null default false,
  published_at        timestamptz,                          -- null = private (seen by its owner only)
  look                jsonb check (is_look(look)),
  created_at          timestamptz not null default now()
);
create index on horizons (owner_id);

create table horizon_events (
  horizon_id uuid references horizons on delete cascade,
  event_id   uuid references events on delete cascade,
  position   int not null,
  added_by   uuid references people,
  added_at   timestamptz not null default now(),
  primary key (horizon_id, event_id)
);
create index on horizon_events (event_id);

create table rsvps (
  person_id   uuid references people on delete cascade,
  event_id    uuid references events on delete cascade,
  status      rsvp,                                         -- null once un-going, while went/shift are kept
  went        boolean not null default false,
  shift_index int,
  updated_at  timestamptz not null default now(),
  primary key (person_id, event_id)
);
create index on rsvps (event_id);

create table promotions (
  person_id  uuid references people on delete cascade,
  event_id   uuid references events on delete cascade,
  created_at timestamptz not null default now(),
  primary key (person_id, event_id)
);
create index on promotions (event_id);

create table person_follows (
  follower_id uuid references people on delete cascade,
  followee_id uuid references people on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on person_follows (followee_id);

create table horizon_follows (
  person_id  uuid references people on delete cascade,
  horizon_id uuid references horizons on delete cascade,
  created_at timestamptz not null default now(),
  primary key (person_id, horizon_id)
);
create index on horizon_follows (horizon_id);

create table callouts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references people,              -- a reply always reaches the author, never a stand-in
  event_id   uuid references events,
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null default '',
  skill      text,                                         -- optional SKILLCHOICES code (2026-10-01)
  expires_on date not null,
  closed_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on callouts (event_id);
create index on callouts (author_id);

/* replies to a call out are public: everyone who can see the call out sees them */
create table callout_replies (
  id         uuid primary key default gen_random_uuid(),
  callout_id uuid not null references callouts on delete cascade,
  author_id  uuid not null references people on delete cascade,
  text       text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on callout_replies (callout_id, created_at);

create table dm_threads (                                   -- one thread per pair, whoever starts it
  id         uuid primary key default gen_random_uuid(),
  a          uuid not null references people,
  b          uuid not null references people,
  created_at timestamptz not null default now(),
  check (a < b), unique (a, b)
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references dm_threads on delete cascade,
  sender_id  uuid not null references people,
  body       text not null default '',
  card_type  text check (card_type in ('event', 'horizon', 'callout')),
  card_id    uuid,
  created_at timestamptz not null default now(),
  check ((card_type is null) = (card_id is null))
);
create index on messages (thread_id, created_at);

create table thread_reads (
  thread_id    uuid references dm_threads on delete cascade,
  person_id    uuid references people on delete cascade,
  last_read_at timestamptz not null,
  primary key (thread_id, person_id)
);

/* the one privacy rule (canSeeEvent in index.html); viewer is null when logged out.
   everyone = anyone; friends = the host and the people the host follows; only_me = the host. */
create function can_see_event(viewer uuid, e events) returns boolean language sql stable as $$
  select e.deleted_at is null and (
       e.privacy = 'everyone'
    or (viewer is not null and viewer = e.host_id)
    or (e.privacy = 'friends' and viewer is not null and exists (
          select 1 from person_follows f where f.follower_id = e.host_id and f.followee_id = viewer))
  ) $$;

create function visible_events(viewer uuid) returns setof events language sql stable as $$
  select * from events e where can_see_event(viewer, e) $$;

/* calloutOpen(c) */
create view open_callouts as
  select * from callouts where closed_at is null and expires_on >= current_date;

/* Activity, derived from the source tables (never written twice). (verb, obj_type, obj_id) as in index.html 9b */
create view activity as
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
  union all select follower_id, 'followed_person', 'person', followee_id, created_at, null from person_follows;

insert into _migrations (name) values ('0001_init');
