# Decisions

Short, dated product decisions that change the standing rules (`reference/IA-v2.md`). Newest last.

- **2026-09-27 · Logged out is a preview.** A persistent bar across the bottom of the app ("Preview of Hypernet",
  one line, Join free + Log in; Log in only once an account exists here) replaces the other logged-out Join
  buttons (toolbar, phone app bar, You tab card, Chats). It is a row of the app's layout, not an overlay: on phone
  it sits between the page (with its event verb bar) and the tab bar; toasts stack above it. Not dismissible.
- **2026-09-27 · Home has one view.** Home is the feed (sections on desktop, shelves on phone) at every width; the
  FEED / LIST / CALENDAR switch is gone and `?view=` on Home is ignored (old `?view=list|calendar` links land on
  Home). This supersedes IA-v2's "Home with a view switcher". The calendar stays only where it already was outside
  Home: your Going / Interested / Hosting / Promoted lists, the Horizons tab, and Show all on an event section
  (`#/home/soon?view=calendar`). No new destination was added.
- **2026-09-27 · The left sidebar is always there.** No Sidebar toggle on desktop or tablet (phone keeps its tabs).
  It narrows with the screen and keeps its labels: 252px from 1400, 216px from 1120, 200px below. With the chat
  dock open, 1280 and 1440 keep list + reading pane + dock side by side (the dock narrows to 300px below 1680);
  below 1120 there is no room for a fourth column, so the dock floats over the right of the centre instead of
  pushing the sidebar away. Supersedes IA-v2's "panes must be restorable" for the left pane (it can't be hidden).
- **2026-09-27 · Controls are system chrome; identity lives in the canvas.** Every button on event and horizon pages
  (Interested / Going / Promote, Add to horizon, Share, Edit, Customize, ⋯, shift pickers, Get tickets, the phone
  bar, pressable chips) is the app's own bevel button — one height (`--act`), the app's hover / pressed / checked
  states, no event colour, border, font or shape. The action row is a chrome toolbar sitting on top of the event's
  world. Supersedes the earlier "themed, never illegible" verbs.
- **2026-09-28 · Profiles can wear a look (optional).** Your own profile gets the same Customize as events and horizons
  (palette, square, backdrop, atmosphere, parallax, ornaments, mood, type, headline), from your profile page's toolbar
  and the You tab; it is saved with your account and seen by others. A customised profile shows its square in place of
  the initials. Ornaments state only facts: city, first skill (a "since" year only when one is known). Three fixture
  people (Anna, Rio, Mira) have looks; the rest stay plain. *Superseded in part 2026-10-01: a look is three colours and a
  square image; the profile's image is also its photo.*
- **2026-09-28 · One page template for event, horizon and person.** `pageHTML(spec)` builds all three: canvas layers →
  title block (square, mosaic or avatar; title; subtitle; mood) → the grey toolbar → anything that must sit under it
  (an event's entry and editions) → facts grid → sections. Only the spec differs: an event's facts and timeline, a
  horizon's events as a track list (the phone "playlist" layout is gone), a person's about, skills, cities, hosting,
  going, horizons and call outs. Every page is its own size container, so it lays out the same in the list column,
  the reading pane or full width. *The canvas layers and the mood line are gone (2026-10-01); the rest stands.*
- **2026-09-28 · Customize is optional; the default is plain.** Nothing has to be customised. An event, horizon or profile
  nobody customised wears the plain look (`HN_PLAIN`): paper, a hairline-ruled backdrop, ink type, no particles, no
  ornaments, a kind glyph on its square. The ten authored fixture themes stay; fixture events without one now go plain
  instead of wearing a look derived from their id (`DERIVED_LOOKS` switches the old behaviour back). A new event can
  be published from any wizard step, and a look is stored only when someone actually changed it. *Still true, minus the
  ruled backdrop and `DERIVED_LOOKS` (both removed 2026-10-01).*
- **2026-09-28 · The reading pane can be closed — to an empty pane.** A window close (×) in the pane's title bar, or Esc,
  empties it; the pane keeps its place and width (owner: "leave the space on the right empty, don't hide it") and shows
  only a blank panel with the faint Hypernet mark. Nothing is auto-picked until you choose something, which fills it
  again. `?pane=closed` keeps it empty across reload and history; back brings back what was open. Phone unchanged.
- **2026-09-27 · The canvas is layered art; reading stays calm.** Back to front: seeded backdrop, header hero,
  particle atmosphere, then content panels and the window's toolbar. Art never takes a click or covers a control;
  ornaments state only facts (edition year, entry model, city, a horizon's years), never invented ones. Text colours
  are corrected to AA against the ground; reduced motion stills everything. Four theme fields (`backdrop`,
  `atmosphere`, `ornaments`, `parallax`) are part of a look and editable in Customize. *Superseded 2026-10-01: no canvas
  art; every look renders on the calm plain layout.*
- **2026-10-01 · Customize is three colours and a square image.** Owner: "Keep pick your colors … just select colors and
  image for now." Customize (events, Event Horizons, your profile — one implementation) and the New event wizard's
  optional Look step now hold only: Background, Text and Accent (a colour picker and its hex each), six one-click
  starting points (Plain paper, Night, Desert, Sea, Forest, Neon), one square image (Upload, or drop it on the square;
  Remove) and Reset to plain, beside a live preview of the page's title block, the square and a list row. No dropdowns.
  The text colour is always kept AA (4.5:1) on the background: a fainter pick is nudged toward black or white and the
  editor says "Adjusted for readability" with the colour it will use. Supersedes the presets, palettes, mood, surface,
  type, headline, motion, shape, density, pattern, glyph, backdrop, atmosphere, parallax and ornament controls.
- **2026-10-01 · Every look renders on the plain layout.** A customised event, horizon or profile is the plain page in
  its own colours, with its image as the square: no backdrop, particles, parallax, ornaments, ribbon, torn edge, hero
  glyph, surface texture, scanlines or flicker (the owner read the flicker as a bug), and nothing on the page moves.
  The content panel is white on the plain look and a step away from the ground on a customised one. The canvas-art
  engine (backdrop SVG generator, particle loop, parallax, ornaments) is removed, not flagged off. Supersedes
  2026-09-27 "The canvas is layered art" and the theme spec in `reference/EVENT-CANVAS.md`.
- **2026-10-01 · A look is `{ bg, ink, accent, image, glyph }`.** Flat and serialisable, ready to be a JSON column.
  `image` is the square picture or null; `glyph` is drawn on the square when there is no picture (the fixture looks keep
  theirs; new ones take their kind's glyph). `HN_MIGRATE_LOOK` (in `_shared/hypernet-themes.js`) turns any older saved
  look into this shape, keeping its three colours and glyph; stored looks are migrated on load. The fixture looks were
  rewritten in the new shape with their colours; their mood lines are gone with the rest of the art.
- **2026-10-01 · Images stay in the browser for now.** An upload must be an image (`image/*`) of 10 MB or less, else it is
  refused with the reason. It is centre-cropped to a square and drawn at most 512×512 in a canvas, saved as WebP (JPEG
  where the browser cannot write WebP) under ~150 KB, and kept as a data URL on the look. With Neon this becomes an
  upload to real storage (Vercel Blob) and `look.image` holds its URL; the spot is marked in `index.html` (STORAGE).
  If the browser's storage fills up, the app says so once instead of failing silently.
- **2026-10-01 · Your photo is your profile's square.** Edit profile has a Photo field (upload, drop, remove); it is the
  same image as the profile look's, so changing either changes both. Wherever you appear — avatars in lists, chats,
  the toolbar's account button, the You tab — the photo replaces the initials. A horizon shows its own square when
  it has an image (or has no events yet), otherwise the mosaic of its events; the cover dropdown is gone.
