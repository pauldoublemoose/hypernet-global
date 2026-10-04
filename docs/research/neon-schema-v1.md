# Neon schema v1 — what the prototype becomes in Postgres

Date: **2026-10-01** (call-out replies and words-only chat: 2026-10-04). Source: the owner/engineering review of the merged v1 build (scratchpad
`review-owner-eng.md`, "Role 2"), tidied against the code as it stands after the trust fixes
(`v1-fix-trust`). Nothing is provisioned. This is the target for wiring Neon: Postgres for data,
Neon Auth (or another email magic-link provider) for login, Vercel Blob for images.

Scale assumed: ~2,000 sign-ups a year, ~100 active people. Plain views are enough; nothing here
needs materialising until the activity view is measurably slow.

## Rules the schema carries (so the UI cannot get them wrong)

- **Every timestamp is `timestamptz`, stored UTC.** The prototype already writes UTC ISO strings
  (`tsIso`, chat `stamp()`); days (`starts_on`, `expires_on`) are plain `date`s in the event's zone.
- **Ids are server-made** (`uuid`), never `Date.now().toString(36)`. Slugs are separate and unique.
- **Privacy is one predicate** (`can_see_event`), the same rule as `canSeeEvent()` in `index.html`:
  `everyone` = anyone, logged out too; `friends` = the host and the people **the host follows**;
  `only_me` = the host. Every read of events goes through `visible_events(viewer)`.
- **A call out is open** while it is not closed and its `expires_on` is today or later
  (`open_callouts`, the same rule as `calloutOpen()`). Answering is a public reply under the
  call out (`callout_replies`), taken only while it is open and only on a call out with an
  `author_id` (NOT NULL, never a stand-in). A reply can be deleted by its author or by the call
  out's author.
- **A look is `{bg, ink, accent, image_url, glyph}`** and the database refuses anything but
  `#rrggbb` colours and an `image_url` on our own Blob host (`is_look`), the same rule as
  `HN_HEX` / `HN_IMAGE` in `_shared/hypernet-themes.js`.
- **Activity is derived, not written twice.** "Your rows say what is true now" (un-going removes
  the row) holds by construction because the view reads the source tables.

## Tables

```sql
create extension if not exists citext;
create extension if not exists pgcrypto;             -- gen_random_uuid()

create type privacy as enum ('everyone', 'friends', 'only_me');
create type rsvp    as enum ('going', 'interested');

/* a look: three hex colours, an optional picture on our Blob host, a glyph */
create function is_look(l jsonb) returns boolean language sql immutable as $$
  select l is null or (
        jsonb_typeof(l) = 'object'
    and l->>'bg'     ~ '^#[0-9a-f]{6}$'
    and l->>'ink'    ~ '^#[0-9a-f]{6}$'
    and l->>'accent' ~ '^#[0-9a-f]{6}$'
    and (l->>'image_url' is null or l->>'image_url' ~ '^https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/')
    and (l->>'glyph' is null or char_length(l->>'glyph') <= 4)
  ) $$;

create table people (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  text unique not null,                       -- the email login
  email         citext unique not null,
  handle        citext unique not null check (handle ~ '^[a-z0-9._-]{1,30}$'),
  display_name  text not null check (char_length(display_name) between 1 and 80),
  bio           text check (char_length(bio) <= 120),
  skills        text[] not null default '{}',              -- 'SOUND/DJING' codes (SKILLCHOICES)
  cities        text[] not null default '{}',
  look          jsonb check (is_look(look)),               -- null = plain; look.image_url is the photo
  last_seen_at  timestamptz,                               -- replaces the fake PRESENCE map
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table images (                                       -- Vercel Blob objects
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references people on delete cascade,
  url        text not null unique,
  width      int not null check (width between 1 and 512),
  height     int not null check (height = width),          -- squares only (v1)
  bytes      int not null check (bytes <= 160 * 1024),
  mime       text not null check (mime in ('image/webp', 'image/jpeg', 'image/png', 'image/gif')),
  created_at timestamptz not null default now()
);

create table events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
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

create table horizons (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  owner_id           uuid references people,                -- null = curated by Hypernet (Season of burns)
  owner_name         text,                                  -- groups are v2: a camp-owned horizon keeps its name here
  name               text not null check (char_length(name) between 1 and 80),
  description        text not null default '',
  is_personal_default boolean not null default false,
  published_at       timestamptz,                           -- null = private (seen by its owner only)
  look               jsonb check (is_look(look)),
  created_at         timestamptz not null default now()
);
create table horizon_events (
  horizon_id uuid references horizons on delete cascade,
  event_id   uuid references events on delete cascade,
  position   int not null,
  added_by   uuid references people,
  added_at   timestamptz not null default now(),
  primary key (horizon_id, event_id)
);

create table rsvps (
  person_id   uuid references people on delete cascade,
  event_id    uuid references events on delete cascade,
  status      rsvp,                                         -- null once un-going, while went/shift are kept
  went        boolean not null default false,
  shift_index int,
  updated_at  timestamptz not null default now(),
  primary key (person_id, event_id)
);
create table promotions (
  person_id  uuid references people on delete cascade,
  event_id   uuid references events on delete cascade,
  created_at timestamptz not null default now(),
  primary key (person_id, event_id)
);
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

create table callouts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references people,              -- the answer goes here, never to a stand-in
  event_id   uuid references events,
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null default '',
  expires_on date not null,
  closed_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table dm_threads (                                   -- one thread per pair, whoever starts it
  id         uuid primary key default gen_random_uuid(),
  a          uuid not null references people,
  b          uuid not null references people,
  created_at timestamptz not null default now(),
  check (a < b), unique (a, b)
);
create table messages (                                     -- words only: Share copies a link, nothing is sent as a card
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references dm_threads on delete cascade,
  sender_id  uuid not null references people,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index on messages (thread_id, created_at);
create table thread_reads (
  thread_id    uuid references dm_threads on delete cascade,
  person_id    uuid references people on delete cascade,
  last_read_at timestamptz not null,
  primary key (thread_id, person_id)
);
/* answering a call out is a public reply under it (a comment thread, oldest first) — never a message */
create table callout_replies (
  id         uuid primary key default gen_random_uuid(),
  callout_id uuid not null references callouts on delete cascade,
  author_id  uuid not null references people on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on callout_replies (callout_id, created_at);
-- insert: only while the call out is open (open_callouts). delete: the reply's author, or the call out's
-- author_id. Deleting is a real delete; the activity row goes with it because the view reads this table.
```

## Views: privacy, open call outs, activity

```sql
/* the one privacy rule (canSeeEvent in index.html); viewer is null when logged out */
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

/* Activity, derived. (verb, obj_type, obj_id) as in section 9b of index.html */
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
  union all select author_id, 'replied_callout', 'callout', callout_id, max(created_at),
                   jsonb_build_object('replyId', (array_agg(id order by created_at desc))[1])
              from callout_replies group by author_id, callout_id
  union all select follower_id, 'followed_person', 'person', followee_id, created_at, null from person_follows;
```

Home for viewer `$me` (logged out: drop the actor filter):

```sql
select a.* from activity a
 where a.ts > now() - interval '21 days'
   and (a.actor = $me or a.actor in (select followee_id from person_follows where follower_id = $me))
   and case a.obj_type
         when 'event'   then exists (select 1 from events e where e.id = a.obj_id and can_see_event($me, e))
         when 'horizon' then exists (select 1 from horizons h where h.id = a.obj_id and (h.published_at is not null or h.owner_id = $me))
         when 'callout' then exists (select 1 from open_callouts c where c.id = a.obj_id)
         else true end
 order by a.ts desc limit 300;
-- added_to_horizon rows: drop event ids the viewer can't see (activityRows() does the same client-side).
```

If the 21-day union is ever slow, make `activity` a table kept by triggers on the source tables.
Row-level security can carry the same predicates (`can_see_event(auth_person_id(), events)`) once
the client talks to Postgres directly (Neon Data API); with a server in between, the functions above
are enough.

## UI function → table (in `index.html`)

Function names, not line numbers: they are what stays stable. "Read" lists the main consumers.

- **people** — `PEOPLE`, `PEOPLE['self']`. Write: `pfSave` (sign-up and Edit profile), `useAcct` /
  `blankAcct` / `captureAcct` / `loadAcct` (sessions), `pfTakePhoto` (photo → `look.image_url`).
  Read: `networkPeople` (the network: `select … from people where id <> $me`), `personHTML`, `avHTML`,
  `shortName`, `searchItems`, `ncPeopleAll`, `handleTaken` (becomes the unique constraint).
  Goes away: `ACCTS`, `demoAcct`, `syncAcctPeople`, `CREW`, `PRESENCE` (→ `last_seen_at`), `AVCOLOR`, `CITYPOOL`.
- **events** — `EVENTS` + `REC` (record → columns + `details`). Create: `wizAct`. Edit: `saveEventEdit`.
  Delete: `deleteEvent` (→ `deleted_at`). Look: `setEventLook`, `TH`. Imports: `mergeReal`
  (`source = 'import'`), `makeNextEditions` (→ `previous_edition_id`). Read: always through
  `visible_events($me)` — the client equivalents are `canSeeEvent`, `feedEvents`, `searchItems`,
  `shelfItems`, `calEvents` / `destEvents`, `rsvpList`, `personHTML`.
- **horizons + horizon_events** — `HORIZONS`, `hz.eventIds`. Create: `donewhorizon`. Rename:
  `renameHz`. Publish: `publishHz` (→ `published_at`). Delete: `deleteHorizon`. Membership:
  `toggleInHorizon`, `unfile`, `pickerDone`, `addToHorizonDrop`, and `setRSVP`'s interested → default
  horizon. Look: `HZTHEME`, `HZCOVER` ('own' = the horizon's own square). Read: `hzEventIds`
  (the visible members), `playlistHTML`, `browsableHorizons`, `popularHorizons`.
- **rsvps** — `RSVP`, `WENT`, `SHIFT`. Write: `setRSVP`, `setWent`, `takeShift`. Read: `stateOf`,
  `rsvpList`, `attendees` (drop the hash-made `baseAttendees` fakes).
- **promotions** — `PROMOTED`, `doPromote`. Counts: `promoCount` (drop `PROMOCOUNT` fakes → `count(*)`).
- **person_follows** — `PFOLLOW`, `followP`. Read: `followsOf` (privacy), `followedPeople`, `fofPeople`,
  `popularPeople`. Goes away: `NETFOLLOWS`.
- **horizon_follows** — `HZFOLLOW`, `followHz`. Counts: `hzFollowers` (drop `HZCOUNT` fakes).
- **callouts** — `CALLOUTS`. Create / edit: `donewcallout`. Close: `closeCallout` (→ `closed_at`).
  Open: `calloutOpen` (→ `open_callouts`). Author: `calloutAuthor` (→ `author_id`). Event link:
  `calloutEventId` (drop the `CALLOUTFOR` fixture map). Read: `openCallouts`, `homeCallouts`,
  `calloutHTML`, `calloutsHTML`.
- **callout_replies** — `REPLIES` (`{ id, calloutId, author, text, ts }`), `REPLYGONE` (deletions).
  Write: `postReply` (insert), `deleteReply` (delete; `canDeleteReply` → the delete rule). Read:
  `repliesOf` (→ `select … where callout_id = $1 order by created_at`), `myReplies`, `canReply`
  (→ the insert rule), `repliesHTML` / `replyHTML` (the thread), `repliesPeekHTML` (count + latest
  two on Home and the event page), `fReplyCard`. Goes away: `REPLYSEED` and `ACTSEED.replies`
  (fixture replies), `REPLYDRAFT` stays in the browser.
- **dm_threads + messages + thread_reads** — `CHATS`, `CHATORDER`, `UNREADCHAT`. Thread: `openDM`
  (→ the `(least, greatest)` pair). Messages: `sendChat`, `stamp()` (→ `created_at`). Read:
  `chatList`, `convHTML`, `msgTs` (its heuristics for "09:31" / "yesterday" go). Unread: `openChat`
  (→ `thread_reads`). Which conversation is open (`S.chatOpen`) and where you were in it
  (`CHATSCROLL`) stay in the browser.
- **activity (view)** — Read: `activityRows` → `homeEntries` / `homeItems`. Visibility: `actVisible`
  (→ the Home query above). Goes away: the "ACTIVITY SEED" block (`seedActivity`, `seedTs`, `FIXNOW`),
  `LIVEACT` / `logAct` / `unlogAct` / `saveLiveAct` (the source tables are the log). `replied_callout`
  rows come from `callout_replies`; `actVisible`'s "still has a reply there" check holds by construction.
- **images** — `squareImage`, `czTakeFile`, `pfTakePhoto` (marked STORAGE): upload to Blob, insert
  into `images`, put its `url` in `look.image_url`. `HN_IMAGE` then accepts that host.
- **Stays in the browser** — `READ` (bold for unread rows), `RECENTQ`, `FORMDRAFTS` / `CHATDRAFT` / `REPLYDRAFT`,
  `S.view` and scroll state, `hypernet-feed:v2` for those only.

## Fixture clock

The prototype runs on the real date and moves its mock fixture dates by the days between the
fixtures' 2026-09-20 and today (`FIXSHIFT`, section 0). That block and `FIXTODAY` go with the
fixtures; real rows carry real dates.
