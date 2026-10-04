# Infra v1 — how Hypernet runs (Next.js + Vercel + Neon)

Date: **2026-10-04**. Phase 1: the backend exists and is tested on the `dev` branch; the prototype UI still uses
localStorage. Nothing is deployed yet.

## The moving parts

```
 Browser
   │
   ▼
 Vercel — the Next.js app (functions run in Frankfurt, fra1)
   ├─ /                 the prototype as it is today (index.html, _shared/, data/), served as files
   ├─ /dev/login        a bare test page for login + the API (delete in phase 2)
   ├─ /api/auth/*  ───► Neon Auth: emails a 6-digit code, checks it, keeps the session
   ├─ /api/*       ───► Neon Postgres, database "hypernet" (one HTTPS request per query)
   └─ /api/images  ───► signs a 5-minute upload URL; the browser sends the picture straight to
                         Neon Storage, bucket "images" (anyone can view, only signed uploads can write)
```

Think of it as a venue: **Vercel** is the building and the staff, **Postgres** is the archive room, **Neon
Auth** is the front desk that hands out wristbands (the session cookie), **Storage** is the poster room. One
vendor (Neon) holds all three back rooms, and they **branch together**: `dev` is a full copy (data, logins,
pictures) you can break without touching `main`.

- **Which branch?** Production on Vercel → `main`. Everything else (your laptop, preview deployments) → `dev`.
  Decided in `lib/branch.ts` (override with `NEON_BRANCH=main|dev`); the push script sends main's database URL
  only to production, so code and data always agree.
- **No secrets at build time.** Every secret is read when a request needs it (`lib/env.ts`). A missing one
  answers `503 {"error":"not_configured","missing":"KEY"}` instead of crashing.

## What exists in Neon

Project **hypernet** (`billowing-rice-20515821`), org "Michal", AWS Frankfurt (`aws-eu-central-1`), Postgres 17,
database `hypernet`.

| | `dev` (br-rapid-butterfly-b2sgym8n) | `main` (br-holy-dawn-b2fwcldg, production) |
|---|---|---|
| Schema `0001_init` | applied | **not yet** (on your go) |
| Neon Auth | on — email code works, localhost allowed | on |
| Bucket `images` (public read) | created | **not yet** (one click, see below) |
| Login emails | Neon's shared sender (`auth@mail.myneon.app`) | same; switch to Resend before launch |

Auth and storage addresses are public, not secrets; they live in `lib/branch.ts`.

## Secrets: what, where from, where it goes

All values live only in the encrypted `.env.enc` (edit with `sops-edit`). Nothing is ever written in plain text.

| Key | Where to copy it from | Used by | On Vercel? |
|---|---|---|---|
| `DATABASE_URL` | console.neon.tech → hypernet → **Connect** → branch **dev**, database hypernet, pooling **on** | app | preview, development |
| `DATABASE_URL_MAIN` | same, branch **main** | app | production (as `DATABASE_URL`) |
| `DATABASE_URL_UNPOOLED`, `DATABASE_URL_MAIN_UNPOOLED` | same, pooling **off** | migrations/tools | never |
| `AUTH_SECRET` | `openssl rand -base64 32` (32+ characters) | signs the session cookie | all |
| `NEON_STORAGE_ACCESS_KEY_ID` | console → hypernet → branch **main** → **Connect** → **Storage** tab → "Parameters only" → the `AWS_ACCESS_KEY_ID` line (`nak_live_…`) | image uploads | all |
| `NEON_STORAGE_SECRET_ACCESS_KEY` | same dialog, **Reveal credential** → the `AWS_SECRET_ACCESS_KEY` line (`nsk_live_…`) | image uploads | all |
| `NEON_API_KEY`, `NEON_PROJECT_ID`, `VERCEL_TOKEN` | (already there) | Claude / scripts | **never** |
| `RESEND_API_KEY`, `EMAIL_FROM` | (already there) | Neon Auth's email setting, not the app | never |

Why the storage keys are separate from `NEON_API_KEY`: the API key is a *personal* key — it can manage and delete
every Neon project you can reach, including client projects in the other organisation. The storage credential can
only read and write pictures. Neon's own guidance: keep API keys out of the running app. (They are not named
`AWS_*` because Vercel reserves those names.) A credential made on `main` also works on `dev`.

## Commands you run

```bash
cd ~/Documents/CODE/hypernet-feed
npm install                                   # once, and after pulls that change package.json
sops-edit                                     # add NEON_STORAGE_ACCESS_KEY_ID + NEON_STORAGE_SECRET_ACCESS_KEY

# run it locally (prototype at http://localhost:3000, backend test page at /dev/login)
with-secrets --dir ~/Documents/CODE/hypernet-feed -- ./node_modules/.bin/next dev --port 3000
#   (use --port, not -p: with-secrets refuses short flags like -p)

npm run typecheck && npm test && npm run build   # all work without any secrets

# send the app's secrets to Vercel (values go over stdin; nothing is printed)
node scripts/env-push.mjs production --dry-run   # lists key names only — check DATABASE_URL ← DATABASE_URL_MAIN
node scripts/env-push.mjs production
node scripts/env-push.mjs preview
node scripts/env-push.mjs development
```

`env-push` decrypts in memory, skips tooling keys and empty values, refuses to send production a database URL that
is not from `main`, and stops at the first failure. Optional `.env.production.enc` overrides any key for production.

**Migrations.** `db/migrations/*.sql` is the source of truth; `db/schema.ts` mirrors it for TypeScript. Claude
applies a file through the Neon MCP as one transaction (`node scripts/sql-split.mjs <file>` prints the statements)
— on `dev` first, on `main` when you say so. Each file records itself in the `_migrations` table;
`GET /api/health` shows the last one.

**The prototype move.** When the UI joins the app: `git mv index.html _shared data public/`, then delete
`app/proto/` and the rewrites in `next.config.ts`.

## The API so far

- `GET /api/health` → `{ok, branch, database, migration, ms}`
- `GET /api/me` → `{user, person}` (both null when logged out; `person` null until joined)
- `POST /api/me {handle, displayName, bio?}` → join (409 `handle_taken`)
- `/api/auth/*` → login: `POST /api/auth/email-otp/send-verification-otp {email, type:"sign-in"}`, then
  `POST /api/auth/sign-in/email-otp {email, otp}`; the first code creates the login
- `GET /api/events?from&to&host&limit` → only events the viewer may see (`can_see_event` in SQL)
- `GET /api/events/:id` → one event, or 404 "private or no longer here" (same answer for missing and hidden)
- `POST /api/events` / `PATCH /api/events/:id` → host only, validated with zod (looks: `#rrggbb` + our bucket)
- `POST /api/images {contentType, bytes}` → `{url, upload: {url, method: "PUT", headers}}`; image/* only (no
  SVG), 10 MB max, type and size signed into the URL

Errors are always `{error, message?}`: 400 `invalid` (with zod issues), 401 `login_required`, 403
`join_required`, 404, 409, 503 `not_configured`.

## Before launch (main)

1. Apply `0001_init` to `main`; create bucket `images` (public read) on `main` (Console → branch main → Object
   storage → New bucket).
2. Neon Auth on `main`: add `https://hypernet-feed.vercel.app` as a trusted domain; set the email provider to
   Resend SMTP (`smtp.resend.com`, port 465, user `resend`, password = `RESEND_API_KEY`) once the sender domain is
   verified in Resend. No app code involved; until then Neon's shared sender works for testing.
3. Push env, deploy, open `/api/health` on production → `branch: "main"`.
4. Neon Free plan: the database sleeps after 5 idle minutes (first request ~1 s slower) and keeps 6 h of history.
   Move to Launch when real people's data is in.

## Phase 2: the prototype talks to the API

One small `_shared/hypernet-api.js` (fetch helpers that throw the `{error}` shape), then replace the localStorage
writers function by function, keeping the UI optimistic. Order and endpoints (names from
`docs/research/neon-schema-v1.md`, "UI function → table"):

1. **Login + people** — Join / Log in screens → `/api/auth/*`, `POST /api/me`; `pfSave` → `PATCH /api/me`;
   `pfTakePhoto` → `POST /api/images` then `PATCH /api/me {look}`; `networkPeople`, `searchItems`, `ncPeopleAll`
   → `GET /api/people?q=`; `personHTML` → `GET /api/people/:handle`. Drop `ACCTS`, `demoAcct`, `PRESENCE`.
2. **Events** — done in phase 1 except `deleteEvent` → `DELETE /api/events/:id` (sets `deleted_at`).
   `wizAct` → POST, `saveEventEdit` / `setEventLook` → PATCH, `feedEvents` / `calEvents` / `shelfItems` → GET.
   Real events (`mergeReal`) → a one-off import with `source = 'import'`.
3. **RSVPs, promotions, follows** — `setRSVP` / `setWent` / `takeShift` → `PUT /api/events/:id/rsvp`;
   `attendees` / `rsvpList` → `GET /api/events/:id/people`; `doPromote` → `PUT|DELETE /api/events/:id/promote`;
   `followP` → `PUT|DELETE /api/people/:id/follow`; `followHz` → `PUT|DELETE /api/horizons/:id/follow`.
4. **Horizons** — `GET /api/horizons` (browsable, popular), `GET /api/horizons/:slug` (visible events only),
   `POST` (`donewhorizon`), `PATCH` (`renameHz`, `publishHz`, look), `DELETE`; membership
   `PUT|DELETE /api/horizons/:id/events/:eventId` (`toggleInHorizon`, `unfile`, `pickerDone`, order).
5. **Call outs** — `GET /api/callouts` (open ones that reach me), `POST`, `PATCH` (edit, `closeCallout`);
   public replies `GET|POST /api/callouts/:id/replies`.
6. **Home** — `GET /api/home` = the activity query in neon-schema-v1 (21 days, me + people I follow, privacy
   applied). Delete the activity seed and `LIVEACT`.
7. **Direct messages** — `GET /api/threads` (with unread), `POST /api/threads {personId}` (`openDM`),
   `GET|POST /api/threads/:id/messages` (`sendChat`, `shareToChat`), `PUT /api/threads/:id/read`. Poll every
   few seconds first; realtime only if it feels slow.
8. **Clean-up** — remove fixtures, `FIXSHIFT`, and the localStorage writers; keep only `READ`, `RECENTQ`,
   drafts and view state in the browser.

## Checked, and not yet

- Checked: schema on dev (privacy for host / follower / stranger / logged out, look validation, unique handles
  case-insensitive — in rolled-back transactions); email-code endpoints answer on dev; a signed upload to the dev
  bucket, public read of it, and CORS from any origin; the API locally against dev (health, me, events, 401/404/400
  paths, prototype at `/`); `typecheck`, `build` (no secrets) and the env-push tests.
- Not yet: a real login (needs a code from your inbox — try `/dev/login`), creating/editing events as a logged-in
  person, and `/api/images` (needs the two storage keys; if uploads answer 403, drop `content-length` from
  `signableHeaders` in `lib/storage.ts`). A test object `images/_probe/hello.txt` sits in the dev bucket.
