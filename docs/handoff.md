# Handoff — taking over Hypernet (2026-10-19)

For the new maintainer. Read `README.md`, `docs/infra.md` (how it runs, every command) and `docs/DECISIONS.md`
(the standing product rules) first.

## The production data

A copy of production (Neon branch `main`, taken 2026-10-19) is attached to the GitHub release
**`handoff-2026-10-19`** of this repo as `hypernet-handoff-2026-10-19.zip`. It is a release asset, not a commit,
because it holds people's emails and direct messages: keep it off chat and email in plain text.

- `hypernet-main-2026-10-19.sql`: the whole `public` schema, structure and data (22 events, 5 horizons,
  2 people, 3 call outs, 8 messages, 15 image rows), plus the `citext` extension. Plain SQL, pg_dump 17,
  `--no-owner --no-acl`.
- `hypernet-main-auth-users-2026-10-19.sql`: only the 2 rows of `neon_auth."user"` (id, name, email). Sessions,
  verification codes and Neon Auth's signing keys are left out on purpose; they don't work on a new project.
- `images/`: all 26 files from the `images` storage bucket, with their bucket keys as paths
  (`real-events/…`, `u/<person>/…`, `l/<person>/…`). `image-urls.txt` lists the old public URLs.

Both SQL files were test-restored into an empty Postgres 17; the row counts matched production.

### Restore into a new Neon project

1. Create a Neon project (Postgres 17) and a database. Turn on **Neon Auth** (email code sign-in, settings in
   `docs/infra.md`) and **Storage** with a bucket called `images`, public read.
2. Load the schema and data over the direct (unpooled) connection string:
   ```bash
   psql "$DATABASE_URL_UNPOOLED" -v ON_ERROR_STOP=1 -c 'drop schema public cascade'
   psql "$DATABASE_URL_UNPOOLED" -v ON_ERROR_STOP=1 -f hypernet-main-2026-10-19.sql
   ```
   The dump creates `public` itself, hence the drop of the empty one.
3. Optional: load the 2 login users, so the existing people keep their profiles when they next log in
   (`people.auth_user_id` points at `neon_auth."user".id`, no foreign key):
   ```bash
   psql "$DATABASE_URL_UNPOOLED" -v ON_ERROR_STOP=1 -f hypernet-main-auth-users-2026-10-19.sql
   ```
   If Neon Auth's `user` table has other columns by then, insert id, name, email and `"emailVerified"` by hand.
4. Upload `images/` to the new bucket under the same keys, then point the URLs at the new bucket host:
   ```sql
   -- old host: https://br-holy-dawn-b2fwcldg.storage.c-6.eu-central-1.aws.neon.tech
   update images   set url  = replace(url, '<old host>', '<new host>');
   update events   set look = replace(look::text, '<old host>', '<new host>')::jsonb where look::text like '%<old host>%';
   update horizons set look = replace(look::text, '<old host>', '<new host>')::jsonb where look::text like '%<old host>%';
   update people   set look = replace(look::text, '<old host>', '<new host>')::jsonb where look::text like '%<old host>%';
   ```
   The old host appears in `images` (15), `events.look` (21), `people.look` (2) and `horizons.look` (1).
5. `_migrations` already lists `0001_init`, `0002_v2_api`, `0003_link_events`, `pictures-real-events` and
   `seed-main`; don't run those again. New migrations go on top as before.

## Your own accounts and secrets

- **Secrets.** `.env.enc` is encrypted to the previous maintainer's key and can't be opened. Replace it with
  your own (or any secret store): `.env.example` documents every variable and where it comes from. The app needs
  `DATABASE_URL`, `AUTH_SECRET`, `NEON_STORAGE_ACCESS_KEY_ID`, `NEON_STORAGE_SECRET_ACCESS_KEY`, and, for the
  branded login email, `RESEND_API_KEY` and `EMAIL_FROM`. Remove `.sops.yaml` too, or point it at your own key.
- **Vercel.** Your own project; `vercel.json` installs with `npm ci --legacy-peer-deps` (see `docs/infra.md`).
  The current URL is `hypernet-feed.vercel.app`; a new project gets a new one, so add it to Neon Auth's trusted
  domains.
- **Resend.** Login codes go out through Neon's shared sender until a domain is verified in your Resend account.
  Then follow "Login emails in Hypernet's style" in `docs/infra.md` to switch the branded email on.
- **Tests.** `tests/e2e/otp.sh` and the end-to-end test accounts use the previous maintainer's Gmail
  (`michal.kucera04+hn…`). Swap in your own addresses.
