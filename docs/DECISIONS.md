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
- **2026-09-28 · Customize is optional; the default is plain.** Nothing has to be customised. An event, horizon or profile
  nobody customised wears the plain look (`HN_PLAIN`): paper, a hairline-ruled backdrop, ink type, no particles, no
  ornaments, a kind glyph on its square. The ten authored fixture themes stay; fixture events without one now go plain
  instead of wearing a look derived from their id (`DERIVED_LOOKS` switches the old behaviour back). A new event can
  be published from any wizard step, and a look is stored only when someone actually changed it.
- **2026-09-28 · The reading pane can be closed.** A window close (×) in the pane's title bar, or Esc, closes it; the
  list or horizon then takes the whole centre and nothing is auto-picked until you choose something. `?pane=closed`
  in the URL keeps it closed across reload and history; back reopens what was open.
- **2026-09-27 · The canvas is layered art; reading stays calm.** Back to front: seeded backdrop, header hero,
  particle atmosphere, then content panels and the window's toolbar. Art never takes a click or covers a control;
  ornaments state only facts (edition year, entry model, city, a horizon's years), never invented ones. Text colours
  are corrected to AA against the ground; reduced motion stills everything. Four theme fields (`backdrop`,
  `atmosphere`, `ornaments`, `parallax`) are part of a look and editable in Customize.
