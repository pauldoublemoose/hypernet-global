# Infra — how Hypernet runs (runbook)

Updated **2026-10-19** (moved to Paul's accounts: new Neon project, GitHub `pauldoublemoose/hypernet-feed`). Plain words first; commands at the end of
each part.

## The moving parts

```
 Browser ── index.html (the prototype) + _shared/hypernet-api.js (its data layer)
   │
   ▼
 Vercel — the Next.js app, functions in Frankfurt (fra1)
   ├─ /                    the prototype, served by app/proto (it adds one line: window.HN_BACKEND)
   ├─ /api/bootstrap       everything the first screen needs, for whoever is looking (one DB request)
   ├─ /api/…               one route per action (below), every list filtered by can_see_event in SQL
   ├─ /api/auth/*  ──────► Neon Auth: emails a 6-digit code, checks it, keeps the session cookie
   ├─ /api/images  ──────► signs a 5-minute upload; the browser PUTs the picture straight to Neon Storage
   └─ /api/hooks/neon-auth  (ready, off) the Hypernet-styled login email, sent through Resend
   │
   ▼
 Neon project "hypernet" (holy-bonus-89610570, org "hypernet", Frankfurt, Postgres 17, database hypernet)
   ├─ main  br-young-credit-b9t2vyjm     production: real events only, real people
   └─ dev   br-fragrant-shape-b9dk55gf   your laptop and previews: the mock cast + fixtures + test accounts
```

Think of a venue: Vercel is the building and the staff, Postgres the archive, Neon Auth the front desk that
hands out wristbands (the session cookie), Storage the poster room. The three back rooms **branch together**:
`dev` is a full copy you can break without touching `main`.

- **Which branch?** Production → `main`; everything else → `dev` (`lib/branch.ts`; override `NEON_BRANCH`).
  The env push sends main's database URL only to production.
- **No secrets at build time.** A missing secret answers `503 {"error":"not_configured","missing":"KEY"}`.
- **Two modes of the page.** Served by the app → *online*: data from `/api/bootstrap`, every action a request.
  Anything else (a static server, `tests/regression.js`, or `?offline=1`) → *offline*: the bundled fixtures and
  localStorage, exactly as before. Online, the browser keeps only conveniences (what you read, recent searches,
  drafts, which chat is open).

## What the app does online

- **Log in / join.** Join free or Log in → your email → a 6-digit code (Neon's email for now) → first time,
  the profile form (name, handle, about, skills, cities) → you are in. No password, no demo account. Log out
  works. Sign-up is open to anyone with the link (owner, 2026-10-04); pages stay `noindex`.
- **Writes are optimistic.** The page changes at once and sends the change; changes to the same thing go out in
  order. If one fails, a quiet toast says so and the page reloads its data from the server (the rollback can
  never disagree with the database). Coming back to the tab reloads (at most once a minute); new messages are
  polled every 20 s.
- **Ids are made in the browser** (uuid) for events, horizons, call outs, replies and messages, so a new thing
  has its final id and link the moment it appears.
- **Pictures** (Customize, profile photo) are cropped to a ≤512px square in the browser, then uploaded; the look
  keeps the public URL.

### The API

All JSON; errors are `{error, message}` with 400 `invalid` (zod issues), 401 `login_required`,
403 `join_required` / `forbidden`, 404 (missing and hidden look the same), 409, 503 `not_configured`.

- `GET /api/health` · `GET /api/bootstrap` · `GET /api/chats`
- `GET|POST|PATCH /api/me` — who you are; join; edit profile and your look
- `POST /api/events`, `GET|PATCH|DELETE /api/events/:id`, `PUT /api/events/:id/rsvp {status, went, shiftIndex}`,
  `PUT|DELETE /api/events/:id/promote`
- `PUT|DELETE /api/people/:id/follow`
- `POST /api/horizons`, `GET|PATCH|DELETE /api/horizons/:id`, `PUT /api/horizons/:id/events {eventIds}` (the
  whole ordered list), `PUT|DELETE /api/horizons/:id/follow`
- `POST /api/callouts`, `PATCH /api/callouts/:id` (edit, `closed`), `POST /api/callouts/:id/replies`,
  `DELETE /api/replies/:id`
- `POST /api/chats/:personId/messages`, `PUT /api/chats/:personId/read` (one conversation per pair)
- `POST /api/images {contentType, bytes}` → `{url, upload:{url, method, headers}}` (image/* without SVG, ≤10 MB,
  type and size signed into the URL)
- `/api/auth/*` — Neon Auth (`email-otp/send-verification-otp`, `sign-in/email-otp`, `sign-out`, `get-session`)

**Privacy** is one SQL function, `can_see_event(viewer, event)`: Everyone = anyone; Friends = the host and the
people **the host follows**; Only me = the host. Bootstrap, every event route, RSVPs, promotions, horizon
contents, call outs on events and every activity row go through it. Activity is the `activity` view over the
source tables (going, interested, promoted, created, published, followed, added to a horizon, posted, replied).

## Secrets: what, where from, where they go

Values live in the git-ignored `.env.local` (mode 600; copy `.env.example`) and, for the app's keys, on Vercel as sensitive variables. Nothing is committed.

| Key | Where it comes from | Vercel |
|---|---|---|
| `DATABASE_URL` / `_UNPOOLED` | Neon → hypernet → Connect → branch **dev**, database hypernet (pooling on / off) | preview (pooled) |
| `DATABASE_URL_MAIN` / `_UNPOOLED` | same, branch **main** | production as `DATABASE_URL` |
| `AUTH_SECRET` | `openssl rand -base64 32` — signs the session cookie | production, preview |
| `NEON_STORAGE_ACCESS_KEY_ID`, `NEON_STORAGE_SECRET_ACCESS_KEY` | Neon → Connect → **Storage** tab (a storage-only credential; it works on main and dev) | production, preview |
| `RESEND_API_KEY`, `EMAIL_FROM` | resend.com → API Keys; the sender (must be on a verified domain) | production, preview (used only once the email webhook is on) |
| `NEON_API_KEY`, `NEON_PROJECT_ID`, `VERCEL_TOKEN` | tooling only | **never** |

The storage keys are not the Neon API key on purpose: that personal key can manage every Neon project the account
reaches (including client projects). Vercel holds every value as *sensitive* (write-only). All of the above are
set on Vercel as of 2026-10-04.

## Commands

```bash
npm ci --legacy-peer-deps

# run it (prototype + API, on the dev branch). scripts/with-env loads .env.local for any command.
scripts/with-env ./node_modules/.bin/next dev --port 3000
#   http://localhost:3000            online (the database)
#   http://localhost:3000/?offline=1 the fixtures, as before

# checks (no secrets needed)
npm run typecheck && npm test && npm run build
HN_ROOT=. npx -y -p playwright node tests/regression.js      # the prototype's own suite, offline

# API tests: they WRITE to dev (two "Vitest …" people per run); the app must be running on dev
HN_API=http://localhost:3000 npx vitest run

# end to end, two real logins by emailed code (+hn plus-addresses of the owner's Gmail)
HN_URL=http://localhost:3000 HN_EMAIL_A=paul+hn1@doublemoose.com HN_EMAIL_B=paul+hn2@doublemoose.com \
  HN_OTP_DIR=/tmp/hn-otp node tests/e2e/online.cjs            # prints WAITING_FOR_CODE <email> …
tests/e2e/otp.sh paul+hn1@doublemoose.com > "/tmp/hn-otp/paul+hn1@doublemoose.com.txt"   # … feed it

# env to Vercel (values over stdin, never printed; production gets the main-branch database)
node scripts/env-push.mjs production --dry-run
node scripts/env-push.mjs production && node scripts/env-push.mjs preview

# deploy
vercel deploy            # preview (dev branch)
vercel deploy --prod     # production (main branch)
```

**Install on Vercel.** `vercel.json` installs with `npm ci --legacy-peer-deps`: since 2026-10-16 a plain `npm install`
(or `npm ci`) of this lockfile crashes in npm's tree builder ("Cannot read properties of null (reading 'children')")
on better-auth's optional peers (a vitest 4 beside our 5). With the flag npm installs the lockfile as it is; without
`ci`, `npm install --legacy-peer-deps` would drop about 60 packages from it.

**Migrations and seeds.** `db/migrations/*.sql` is the source of truth (`db/schema.ts` mirrors it for TypeScript).
Each file runs as one transaction over Neon's SQL-over-HTTP endpoint, with the connection string added by curl
inside `scripts/with-env` (nothing prints it):

```bash
node scripts/sql-payload.mjs db/migrations/0003_….sql > /tmp/q.json      # or: seed:dev, seed:main
scripts/with-env curl -sS --fail-with-body \
  --variable %DATABASE_URL_UNPOOLED --expand-header 'Neon-Connection-String: {{DATABASE_URL_UNPOOLED}}' \
  -H 'Content-Type: application/json' -H 'Neon-Batch-Isolation-Level: Serializable' \
  --data-binary @/tmp/q.json https://api.c-7.eu-central-1.aws.neon.tech/sql
# production: DATABASE_URL_MAIN_UNPOOLED. The project is on Neon cell c-7; api.eu-central-1 alone says
# "password authentication failed".
```

Applied: `0001_init`, `0002_v2_api`, `0003_link_events` on both branches; `seed-dev` on dev (2026-10-19), and on main the restored production data from the handoff (`docs/handoff.md`), which lists `seed-main` and `pictures-real-events` (the `_migrations`
table lists them; `GET /api/health` shows the last). Seeds are idempotent (`on conflict do nothing`).

**Real events' pictures** (2026-10-05). The files are committed in `data/pictures/` (offline the page shows them
directly); online each branch keeps its own copy in its `images` bucket. One script does both steps for a branch —
upload (curl SigV4 with the storage-only key, each file checked readable by anyone) and the guarded look update
(`seed.mjs pictures:<branch>`) — and is safe to run again:

```bash
scripts/real-pictures.sh main --dry-run   # what it would upload and run, touching nothing
scripts/real-pictures.sh dev              # applied 2026-10-05 ("rows changed: 16", a second run: 0)
scripts/real-pictures.sh main             # production — only when the owner says so
```

A new or replaced
picture: put the file in `data/pictures/`, name it in `data/real-events.json` (`picture`), run the script per branch.
Provenance: `docs/research/real-event-pictures.md`.

## Neon Auth settings (per branch)

| | dev | main |
|---|---|---|
| Email code sign-in (sign-up open) | on | on |
| Email + password | **on** (only so `tests/api` can make throwaway logins) | **off** — otherwise anyone could register someone else's email with a password; codes still work (tested) |
| Localhost allowed | yes | no |
| Trusted domains | localhost; each preview URL you log in on (Neon API `POST …/branches/<id>/auth/domains`) | the production URL(s) — set when the Vercel project exists |
| Application name (in the email) | Hypernet | Hypernet |
| Login email | Neon's shared sender (`auth@mail.myneon.app`, "Your Sign-In Code - Hypernet") | same |

Log in on a preview works only once its URL is in **dev's** trusted domains (sign-in from an untrusted Origin is
refused). A custom domain later goes into main's.

### Login emails in Hypernet's style

Built and waiting: `lib/email/login-code.ts` (preview: `docs/email/login-code.html`, `login-code.png`,
`login-code-phone.png`) and `app/api/hooks/neon-auth` (verifies Neon's Ed25519 signature, sends through Resend,
logs a plain line if Resend refuses with 403). Neon calls it instead of sending its own email once the
`send.otp` webhook is on. **Not on yet**: it needs a sender domain verified in Paul's Resend
account and `EMAIL_FROM` on that domain. Switching it on before the domain is verified would stop all login
emails. To switch on:

1. resend.com → Domains → add the domain to send from (ideally a Hypernet one), add its DNS records, wait for
   "Verified".
2. In `.env.local`: `EMAIL_FROM=Hypernet <login@that-domain>`; `node scripts/env-push.mjs production` (and
   `preview`); redeploy.
3. Turn the webhook on, per branch (main shown):
   ```bash
   scripts/with-env curl -sS -X PUT --variable %NEON_API_KEY --expand-header 'Authorization: Bearer {{NEON_API_KEY}}' \
     -H 'Content-Type: application/json' \
     -d '{"enabled":true,"webhook_url":"https://<production domain>/api/hooks/neon-auth","enabled_events":["send.otp"],"timeout_seconds":5}' \
     https://console.neon.tech/api/v2/projects/holy-bonus-89610570/branches/br-young-credit-b9t2vyjm/auth/webhooks
   ```
   Back to Neon's email: the same with `{"enabled":false}`.

## Things to know

- **Neon Free plan**: the database sleeps after 5 idle minutes (the first request takes ~1 s more) and keeps
  6 hours of history. Move to Launch once real people's data is in.
- **Previews are protected** by Vercel (team login). A browser test on a preview needs a protection-bypass
  secret, which is a security setting for the owner to create (Vercel → Project → Deployment Protection).
- **Shared Google sign-in** is on by default in both branches' Neon Auth; the app never offers it. Remove it in
  Neon → Auth → OAuth if you want it gone.
- **dev carries test accounts** ("Vitest …", "UI …", "Uma Tester", "Hana Test", "Bo Test"); only on dev.
- **The prototype move.** When the UI joins the app: `git mv index.html _shared data public/`, delete
  `app/proto/` and the rewrites in `next.config.ts`, and have the page set `window.HN_BACKEND` itself.
