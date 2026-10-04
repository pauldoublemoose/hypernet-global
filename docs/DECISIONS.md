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
  ruled backdrop and `DERIVED_LOOKS` (both removed 2026-10-01), and minus "published from any wizard step" — superseded
  2026-10-04: a step must have what it needs before Next, and Publish waits for Basics and Words.*
- **2026-09-28 · The reading pane can be closed — to an empty pane.** A window close (×) in the pane's title bar, or Esc,
  empties it; the pane keeps its place and width (owner: "leave the space on the right empty, don't hide it") and shows
  only a blank panel with the faint Hypernet mark. Nothing is auto-picked until you choose something, which fills it
  again. `?pane=closed` keeps it empty across reload and history; back brings back what was open. Phone unchanged.
  *Superseded in part 2026-10-04: nothing is ever auto-picked, so the empty pane is the default and `?pane=closed` is gone.*
- **2026-09-27 · The canvas is layered art; reading stays calm.** Back to front: seeded backdrop, header hero,
  particle atmosphere, then content panels and the window's toolbar. Art never takes a click or covers a control;
  ornaments state only facts (edition year, entry model, city, a horizon's years), never invented ones. Text colours
  are corrected to AA against the ground; reduced motion stills everything. Four theme fields (`backdrop`,
  `atmosphere`, `ornaments`, `parallax`) are part of a look and editable in Customize. *Superseded 2026-10-01: no canvas
  art; every look renders on the calm plain layout.*
- **2026-10-01 · Home is the network's activity.** Home is a reverse-chronological stream of what people did: going,
  interested, promoted, created an event, published / followed / filled an Event Horizon, posted a call out, followed
  someone. Day bands (Today, Yesterday, This week, Earlier) and relative times ("38m", "2h", "yesterday", "Mon"). Rows
  that say the same thing in the same band are one entry ("Anna, Rio and 2 others are going"). Each entry carries the
  thing itself — an event card with Interested / Going right on it, a horizon with Follow, a person with Follow — so you
  act where you read. Logged in, Home shows you and the people you follow; logged out, or following nobody yet, it shows
  the whole network (the latter with a "Make Home yours" card of people to follow). It covers the last three weeks and
  ends with a way to all events. This supersedes "Home has one view" (2026-09-27): that categorical feed is now Explore.
- **2026-10-01 · Activity is one table.** Every entry comes from rows shaped like the future Postgres table
  `activity(id, actor, verb, obj_type, obj_id, ts, extra)`. The fixture rows are generated deterministically from the
  people, events, horizons and call outs (section 9b, "ACTIVITY SEED", the block that goes when Neon is wired); what
  you do here is added as rows of your own and kept in the browser (`hypernet-feed:activity`). Your own rows always
  say what is true now: un-going, un-following or unpublishing takes them off Home; doing something again moves it to
  the top. A private horizon's row is seen by its author only.
- **2026-10-01 · Call outs are the loudest thing on Home.** A call out is the only inverted element in the app's chrome:
  ink ground, paper type, a hairline inset frame, "CALL OUT" as a paper tag, the ask at headline size, the event it is
  for, who asks and until when, and Answer. Open call outs from your network also run as a strip of inverted tiles at
  the top of Home. Salience comes from inversion, size and weight — no colour. Your own call outs never ask you to
  answer them.
- **2026-10-01 · Friends of friends.** Every so often the stream carries "People your friends follow" — people followed
  by the people you follow, with who ("Anna and Kai follow Jon") and Follow. Logged out it is "People to follow"
  (the most followed on the network). Following someone adds their activity to Home straight away.
- **2026-10-01 · Explore holds everything else.** A new destination with four kinds: Events (list + calendar, upcoming
  first), Event Horizons (yours / following / popular; list + calendar), Call outs and People. With no kind it is the
  old categorical Home (This week, From people you follow, Coming up, Announced burns, your horizons, horizons worth
  following, call outs; Show all lists live at `#/explore/<section>`). Desktop shows the kinds as sub-rows under
  Explore in the sidebar; the phone shows them as tabs across the top of the Explore tab. The phone's tabs are Home /
  Explore / New / Chats / You (Explore replaces Horizons). The words Hypernet made up say what they are in a line
  where they are listed ("A horizon is a list of events someone curates — like a playlist…"). Old `#/horizons`,
  `#/people` and `#/home/<section>` links land on the matching Explore kind or section.
  *Since 2026-10-04 the overview is the phone's shelves of squares at every width, not bands of rows.*
- **2026-10-01 · Chat is between two people.** New chat picks one person and opens the conversation; there is no group
  name, no multi-select, no rename / leave / add people. The fixture group chats became direct messages with whoever
  spoke last in them, and group chats kept from before are put away on load. Group (camp) pages stay out of v1; a
  horizon a group owns still shows the group's name as its owner, and the old `#/group/<id>` link opens that horizon.
- **2026-10-01 · Cut from the sidebar.** The top-level Horizons and People rows (now Explore's kinds) and Home's unread
  count (Home is no longer an inbox of events).
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
- **2026-10-01 · Call outs reach the right people, once.** Home's strip holds the open call outs (not closed, not past
  their date — `calloutOpen`) that you have not answered and that reach you: from people you follow; matching a skill on
  your profile; from a friend of a friend; in your city (the event's, else the author's). Logged out, or following fewer
  than three people, every open call out on the network. Each tile says why when it is not someone you follow
  ("Matches your skill: Kitchen", "Via Jon", "In your city: Stockholm"); skill matches lead. A call out in the strip is
  never repeated in the stream; one you answered leaves the strip, and its card stays in the stream as "Answered · Open
  chat". The call-out form gained an optional Skill (the profile's skill choices), stored as `callout.skill`; the two
  fixture call outs carry Sound / PA and Kitchen. When there are more tiles than fit, the strip shows whole tiles only
  (as many columns as fit) with ‹ › in its band — never a tile cut at the edge. Supersedes "Open call outs from your
  network also run as a strip" (2026-10-01).
- **2026-10-01 · Home blends until you follow a few.** Following nobody, Home is the whole network ("Make Home yours").
  Following one or two people, Home is their activity first, then "Around the network" — the twelve newest entries from
  everyone else, greyed avatars on a tinted ground, with a line saying it fades once you follow a few more. From three
  follows on, Home is yours alone (plus friends of friends). Following one person never shrinks Home to that person.
- **2026-10-01 · Coming up with your people.** Under the call outs, logged in and following someone: the events of the
  next three weeks that people you follow are going to or interested in, sorted by event date, each with the date,
  how far off, where, and tiny faces with "Anna + 2 you follow are going · Rio interested". Three rows, "Show N more"
  opens the rest. This answers outcome #1 ("what do I do the next weekends with my people") on the first screen; its
  events also lead Home's keyboard order (the reading pane no longer opens on the next one by itself — 2026-10-04).
- **2026-10-01 · You are one line.** What you did in the last day is a single line at the top of the stream — "You:
  going to X, followed Kai, posted a call out: Rigger · now" (newest first, four parts, then "and N more"); older own
  rows are not on Home. Your rows still say what is true now (un-going takes it off the line).
- **2026-10-01 · Grouping is honest.** Rows group only within three hours of the line's newest row (the line takes the
  newest time), never a whole day: many people on one event (going / interested / promoted), one person following
  several people, and everything that happened to one Event Horizon ("Mira published an Event Horizon and added 2 events
  · Jon and Sasha followed it"). Where two people (or you and someone) share a first name, lines say @handle. Times read
  as ages: "now", "38m ago", "2h ago", "yesterday", "3 days ago", then the date; under a day old they are in ink, bold.
- **2026-10-01 · Recency invites a message.** A going / interested line under a day old carries a small Message button
  beside the time (it opens the DM with that person; logged out it asks you to join first).
- **2026-10-01 · Who's going says who you know, and when.** On an event page the people you follow come first, each chip
  with "you follow · going · 2h ago" when the activity knows when they decided. "and N more" is a button: a dialog of
  everyone going (and interested), each with when and Message; the rest of the count is "N more going who keep their
  name to themselves". Explore's event rows and cards carry the same social line ("Anna + 2 you follow are going") with
  tiny faces whenever someone you follow is on it.
- **2026-10-01 · Answering keeps its context.** Answer opens the DM with the call out pinned at the top ("Answering:
  Kitchen lead · for Sunrise tea service"; "You answered: …" once sent) and a first line ready. Sending puts the call
  out's card in the thread before your words. The poster's call-out page lists "Answers · n" — who, when, Open chat — and
  in this browser the answer is delivered to the poster's account's chats (unread). With Neon: `callout_answers` plus a
  message in the pair's thread. The chat box is a growing textarea: Enter sends, Shift+Enter is a new line. Answer is
  only offered on an open call out with a known author (no fallback author).
- **2026-10-01 · New → Call out knows where you are.** "For event" defaults to the event you are looking at, or the event
  of the call out you are on; otherwise your next hosted event; a draft you started keeps its own choice.
- **2026-10-01 · A closed reading pane gives the list the room.** At desktop widths, with the pane closed, the list takes
  up to 720px (60%) and the empty pane stays beside it, narrower — the 2026-09-28 rule that a closed pane is an empty
  panel stands. The desktop greeting no longer repeats the header's subtitle.
- **2026-10-01 · Feed cards are containers, not buttons.** A card on Home (event, horizon, person, call out, call-out
  tile, coming-up row) is a plain element; its title is the button that opens it (stretched over the card for the
  pointer), and its verbs are buttons beside it — no `role="button"` wrapped around real buttons. Names and titles inside
  a line are buttons too.
- **2026-10-01 · Who can see an event is enforced.** "Who can see it" has three values: **Everyone** (anyone, logged
  out too), **Friends** — the host and **the people the host follows** (one-way: following someone lets them see your
  Friends events; it doesn't let you see theirs), and **Only me** (the host). Anything else counts as Only me. One rule
  (`canSeeEvent`) gates every place an event can show: Home's activity, Explore, search, calendars, horizon track lists
  and their counts, person pages, the Add events picker, and direct links (which say "private or no longer here"). A
  public horizon with a private event on it shows the others only. An event whose host is not a person yet (a camp —
  groups are v2) and is not public is seen by nobody. With Neon this is `can_see_event` (docs/research/neon-schema-v1.md).
- **2026-10-01 · The network is every person here.** People in Explore, people search, New chat, Share, People you
  follow and the People to follow suggestions come from `networkPeople()`: the fixture people, Michal (the demo
  account) and every account joined in this browser — never you. Someone who joins is immediately a person others can
  find, follow and message. Where two people share a first name, `shortName()` carries the handle ("Kai @kailow");
  Home's sentences and the friends-of-friends line are to use it.
- **2026-10-01 · One clock: the real one.** The app runs on today's date. The mock fixtures (written for 2026-09-20)
  move by the days between then and today — events, their sample records (shifts, blocks), call out expiries — and the
  activity seed counts back from the moment the app starts, so the mock world stays "alive" relative to now. The five
  World events and everything in `data/real-events.json` keep their real dates. Timestamps are stored as UTC ISO
  strings (`timestamptz` with Neon). Regression runs pin the browser clock (`HN_NOW`, default 2026-10-01) so real
  events stay where the checks expect them.
- **2026-10-01 · An expired call out is closed.** A call out is open while its author hasn't closed it and its "open
  until" day hasn't passed (`calloutOpen`). A closed one can't be answered from anywhere, and Explore lists only open
  ones. An answer goes to the person who posted it (`calloutAuthor`); when we don't know who that is, there is no
  Answer — never someone else instead.
- **2026-10-01 · Looks are validated before they are drawn.** Only `#rgb` / `#rrggbb` colours and
  `data:image/(png|jpeg|webp|gif);base64` images reach a `style` or `src`; anything else falls back to plain
  (`HN_HEX`, `HN_IMAGE` in `_shared/hypernet-themes.js`; a CHECK in Postgres).
- **2026-10-01 · The demo account is a footnote.** Join and Log in end with a small "Explore as the demo account" link
  instead of opening with "Try the demo account", so an invitee doesn't become Michal by accident. The logged-out
  preview bar says what Hypernet is: "Hypernet — find the events your people are going to, and the people to build
  them with." A horizon page, New Event Horizon and Add to horizon say what a horizon is in one line, and a shared
  horizon link opens at its title.
- **2026-10-01 · Saved on change.** The browser store is written when something changed (and when the page goes
  away), not on every render; both stores (the app's and the activity) say once, quietly, when the browser is full.
- **2026-10-04 · Nothing opens until you pick it.** Owner: "make the default view with no event opened … when I open a
  Horizon, some event is already open, so just make it empty by default." On desktop split layouts every list — Home,
  Explore and its kinds, Show all, search, a horizon's track list, the people list — opens with the empty reading pane
  (the faint mark) and the list taking the room, until you choose something. The auto-pick (`S.autoSel`) and the
  "closed" flag (`S.paneClosed`, `?pane=closed`) are removed, not flagged off: an empty stack *is* the empty pane, and an
  old `?pane=closed` link just lands on it. ↓ / j from nothing opens the first item; × and Esc still empty the pane.
  Phone and tablet (no reading pane beside the list) are unchanged.
- **2026-10-04 · The list's frame is drawn over its rows.** Owner: "Coming up with your people is currently hiding a few
  pixels to the left." Cause: the list's sunken 2px frame was an inset shadow on the scrolling list itself, so anything
  with a background — the sticky bands, a hovered row, the lit Coming-up row with its 3px bar — painted over the frame's
  left edge, and the row looked cut. On desktop and tablet the frame is now an overlay on the list column, above its
  rows (`#listcol::after`), so the edge runs unbroken; the lit Coming-up row's bar sits inside it. The weekday and month
  under each Coming-up date are centred under the day, as the day is (they were flush left). Phone has no frame.
- **2026-10-04 · Explore's overview is squares, at every width.** Owner: "I actually want the explore to stay, but don't
  show it as rows. Show it as squares instead, just like in the mobile version." Desktop and tablet now draw Explore
  (no kind) exactly as the phone does: the same sections (This week, From people you follow, Coming up, Announced burns,
  your Event Horizons, horizons worth following, Call outs) as sideways shelves of 150px squares, each heading with its
  count and Show all. With a mouse a shelf that holds more than fits gets ‹ › in its heading (one step = as many whole
  squares as fit). A square opens in the reading pane and is lit while open; ↓ / j walk the squares shelf by shelf. The
  kinds stay as they were (sidebar sub-rows on desktop, tabs on the phone), and Show all and the old section links
  (`#/explore/soon`, `#/home/week` …) are still their lists. The desktop-only bands, their "Show all N" rows and the
  horizon card strip inside them are removed.
- **2026-10-04 · Add events to a horizon has filters.** Owner: "make sure there's some simple filtering, for example,
  events I am following". Under the search, one row of filters, each with its count: **All upcoming** (the default) ·
  **Going** · **Interested** · **Hosting** · **From people you follow** (someone you follow hosts it — the same meaning
  as Explore's shelf of that name; each row says "Hosted by Anna") · **Past** (newest first). All but Past are upcoming
  only, sorted by date. The search narrows the list and every count; a filter with nothing in it says so ("Nothing in
  Going matches “zurich”", "You’re not hosting anything coming up") and offers the filter that has matches. The list
  keeps its height as you switch, so the dialog doesn't jump. On a phone the filters are one sideways row under the
  search. Replaces the "Your events / All events" bands.
- **2026-10-04 · New event goes on only when a step has what it needs.** Owner: "make it not possible to go to the next
  step until you have everything filled out." Required: **Basics** — a title, the day it starts (a new event: today or
  later), an end on or after the start if one is given, and where it is: a place, or the new **Online** tick (stored as
  `venueKind: 'virtual'`, shown as "Online"). **Words** — a description. **Look** stays optional. Optional fields say
  "optional" (Ends, From, Until, Bring); Type, Who can see it and Entry always have a value. Next waits for its step;
  Publish appears from Words on and waits for Basics and Words; the step tabs open forward only past complete steps. The
  waiting buttons are `aria-disabled`, not dead: beside them "Still needed: a title and where it is" says why, and
  pressing one anyway stays on the step, marks each missing field inline (message under it, `aria-invalid`) and puts the
  cursor on the first — never a toast. The messages follow your typing once shown. Edit uses the same rules (minus "not
  in the past"): Save changes waits until nothing is missing. Supersedes "A new event can be published from any wizard
  step" (2026-09-28).
