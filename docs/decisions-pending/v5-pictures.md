- **2026-10-05 · Real events wear their own pictures.** Owner: "For all the real events fetched I would like to have
  profile pictures for them — you need to fetch them from their sites." Each real event's square is a picture from its
  own site: its logo or emblem when there is a good one (192 px or more), else its og:image or hero cropped to a square
  — 512 × 512 JPEG, every one looked at before it went in; a next edition wears its past edition's. Eleven of the twelve
  have one; Čarodění has no site of its own and keeps its glyph. `data/real-events.json` names the file (`picture`),
  the files are in `data/pictures/`, where each comes from is `docs/research/real-event-pictures.md`.
  - The picture sits on the event's look like any square image: a plain look with that image, or — on dev, where
    Burning Man and The Borderland are fixture events with colours — the same look with the image added. A picture
    someone chose is never replaced.
  - **Where they live.** Offline (fixtures, `?offline=1`, the regression suite) the page shows the committed file
    (`HN_IMAGE` accepts `data/pictures/<name>.jpg` and nothing else new). Online they live in storage like every other
    picture: `scripts/real-pictures.sh <dev|main>` uploads the same files to that branch's `images` bucket as
    `real-events/<name>-<sha8>.jpg` and points the looks at them. Why storage and not one static URL for both: "Pictures
    live in storage" (2026-10-04) and the database's `is_look` check already say so — no migration, no new code path
    in the app, and production gets its pictures the moment the script runs, not when a deploy carries new files;
    the content hash in the name means a replaced picture never shows a stale cached one. The committed files stay the
    one source: the seed and the script derive every URL from them.
  - A fresh seed (`seed.mjs dev|main`) includes the pictures; a branch seeded before them gets them from
    `seed.mjs pictures:<branch>` (what the script runs after uploading): guarded updates, so running it twice changes
    nothing. Applied to dev 2026-10-05; production waits for the owner.
