# IA v2 — supersedes IA.md where they disagree

Author's revision, 2026-09-21. **This replaces the "people never open in the centre" rule.**

## The new shape: Facebook, not Spotify

- **Left = navigation and browsing.** Home feed, Search, the things you keep (Interested /
  Going / Hosting, your horizons) **and the people you follow**. Everything browsable lives
  here.
- **Centre = everything opens here.** Events, horizons, **people**, call outs. No exceptions.
- **Right = active chats only.** This is Messenger. Nothing else lives in it.

So: left + centre are the site; the right rail is the chat dock.

### What changed from v1 and why

v1 said people open in the right pane and never in the centre. That kept the two families
clean but it made people second-class and it overloaded the right rail with two jobs
(directory *and* conversation). v2 gives people a real page in the centre — which is what
every social product does, and what users expect — and leaves the right rail doing one thing.

**Curation and people stay visually separate in the left pane** — distinct sections with their
own headers. Separate, but both browsable from the same rail.

## Panes must be restorable from the UI

Every collapsed pane needs a **visible affordance to bring it back** — a rail, a stub, or a
labelled toggle button in the chrome. A View-menu item alone is not enough, and a pane that
can be hidden with no way back is a bug. Show-people and show-library toggles belong in the
main chrome where you can see them.

## One destination, several views

A "field", a "map", a "feed" and a "list" of the same content are **views of one destination,
not separate destinations**. Do not ship both a Home feed and a Field as sibling nav items —
ship Home with a view switcher (`FEED / LIST / MAP / CALENDAR`).

**Everything except people and call outs gets a calendar view.**

## Horizons open like a folder, not like an event

Opening a horizon shows **the horizon's own properties and state** — its name, cover, owner,
description, count, date range, and your relationship to it, with that relationship
changeable in place (Follow / Unfollow / Publish / Rename / Edit cover). Think of opening a
folder in Windows and seeing its details.

A horizon must **not** carry `Interested / Going / Promote` at the horizon level. Those three
verbs belong to **events only**. Inside the horizon, its events each carry them as usual.

## Naming

Nothing user-facing is called an "Inbox". The home destination is **Home feed**, and it mixes
everything — events, horizons worth following, call outs, network news.

## Chrome hygiene

- **Delete every control that does not do something.** No decorative toolbar buttons, no
  disabled menu entries kept "for period accuracy". If it is drawn, it works.
- **Align the action buttons.** The three verbs and any row controls must sit on a shared
  baseline and grid, same heights, same gaps, in every context they appear.
- Never render the same destination twice in the chrome — one Home affordance, not two.

## Palette

**The application is black, white and grey.** Near-black ink, paper or true white, a small set
of greys, hairline rules. The app may not use a saturated colour anywhere in its own chrome.

The only colour on screen comes from **events** — their squares, their rows and their detail
takeovers. This is the point: a monochrome shell is what lets a host's world read as loud.

Host accents still get contrast-corrected before they touch app surfaces (see
`EVENT-CANVAS.md`); the true accent is only unleashed inside the event's own canvas.

## Windows

Opening an event **in its own window** is a good idea worth exploring — a takeover that is
genuinely separate from the browsing chrome. Person detail as a popup window is also fine
where the frame supports it. Modals stay modal; nothing else floats.
