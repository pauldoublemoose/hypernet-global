# Hypernet — Home feed

Concept 08 ("Home feed", Outlook 2000 reading pane) from `~/Documents/CODE/hypernet`, split out
to be developed toward a real product. Upstream product repo is Sebastian's `pauldoublemoose/hypernet`.

- `index.html` — the prototype (single file, no build). `_shared/` holds mock data + looks (three colours and a square
  per event, horizon or profile) and `hypernet-api.js`, its data layer on the backend.
- `app/`, `lib/`, `db/` — the Next.js app: the API, Neon Postgres (schema in `db/migrations/`), login by emailed code,
  pictures in Neon Storage. How it runs, the secrets and every command: **`docs/infra.md`**.
- `docs/FEEDBACK-*.md` — feedback rounds, verbatim. `docs/DECISIONS.md` — the standing rules, dated.
- `docs/reference/` — IA rules and briefs carried over from the exploration repo (IA-v2 wins over IA).
- `docs/research/` — event-data and backend research. `docs/email/` — the login email.

Run on the database (dev branch): `npm install`, then `with-secrets --dir . -- ./node_modules/.bin/next dev --port 3000`
and open http://localhost:3000 (add `?offline=1` for the fixtures).

Run on the fixtures only: `python3 -m http.server 8080` then open http://localhost:8080

Test: `npm run typecheck && npm test && npm run build`; API tests against a running dev app:
`HN_API=http://localhost:3000 npx vitest run`; end to end with real login codes: `tests/e2e/online.cjs`.
The prototype's suite: `npx -y -p playwright node tests/regression.js` against a server (`HN_URL=…`), or with no
server at all: `HN_ROOT=. npx -y -p playwright node tests/regression.js` (serves the folder through Playwright request
routing, so the page runs offline). The browser clock is pinned to 2026-10-01 for the run (`HN_NOW=<date-time>` or
`HN_NOW=real` to change it).
