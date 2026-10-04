# Hypernet — Home feed

Concept 08 ("Home feed", Outlook 2000 reading pane) from `~/Documents/CODE/hypernet`, split out
to be developed toward a real product. Upstream product repo is Sebastian's `pauldoublemoose/hypernet`.

- `index.html` — the prototype (single file, no build). `_shared/` holds mock data + looks (three colours and a square per event, horizon or profile).
- `docs/FEEDBACK-*.md` — feedback rounds, verbatim.
- `docs/reference/` — IA rules and briefs carried over from the exploration repo (IA-v2 wins over IA).
- `docs/research/` — event-data and backend research.

Run: `python3 -m http.server 8080` then open http://localhost:8080

Backend (Next.js + Neon, phase 1): `npm install`, then
`with-secrets --dir . -- ./node_modules/.bin/next dev --port 3000` serves the same prototype at `/` plus the API.
How it fits together, the secrets and the commands: `docs/research/infra-v1.md`.

Test: `npx -y -p playwright node tests/regression.js` against that server (`HN_URL=…`), or with no server at all:
`HN_ROOT=. npx -y -p playwright node tests/regression.js` (serves the folder through Playwright request routing).
The browser clock is pinned to 2026-10-01 for the run (`HN_NOW=<date-time>` or `HN_NOW=real` to change it).
