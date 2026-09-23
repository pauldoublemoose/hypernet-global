# Hypernet — prototype brief for concept sketches

## What Hypernet is

A network for people who **co-create participatory events** (regional burns, Borderland,
Burning Man scale, Hyperstition). It preserves the relationships from a 4-year Scandinavian
art project. It is not a ticketing site and not a generic social network — it is a directory
of **people you could build something with**, wrapped around a calendar.

Tagline from the live v0: *"Welcome to the digital desert. This place is boring and empty
until you make it otherwise."*

## The five nouns

| Noun | What it is | Nearest familiar thing |
|---|---|---|
| **Node / person** | A user, described by **skills** (`SOUND/DJING`) and **cities** | A profile |
| **Event** | A dated gathering, public or private, with a host | A calendar entry |
| **Event Horizon** | A **named, shareable, followable list of events** | A Spotify playlist |
| **Cluster / Group** | A camp or crew, with admins and members | A private group |
| **Call out** | A time-boxed "we need a sound engineer" request | A want ad |

Plus: **group chats**, **Worlds** (a public square attached to a big event), and a **Feed**.

**Event Horizon is the load-bearing idea.** It is the thing nothing else has. Whatever the
skin, a prototype has to make it obvious that a horizon is a *curated, published, followable*
list of events that you browse the way you browse someone's playlists.

## Required features (from the author's own note)

- log in and say about yourself
- see chats
- browse / search → **events**, **event horizons**, **users** — each with going / interested /
  promote (users: follow)
- create → event, event horizon, group chat
- **customize** → the thumbnail **square** and the **row** (i.e. users style how their own
  event looks in other people's feeds — this is an aesthetics-forward product, so the
  customization surface matters)

## Aesthetic direction

Hard retro. Late-90s / early-2000s desktop computing. Chrome, bevels, system fonts, windows.
The existing v0 is already monospace-on-paper with a window frame — the concepts should each
push a *different* interpretation of retro rather than converging.

## Where the data comes from

`prototypes/_shared/hypernet-data.js` defines `window.HYPERNET` — real names, events,
horizons, groups, callouts, chats, skill taxonomy. Use it. Do not invent a parallel cast.

## Prototype rules

- One self-contained `.html` file per concept, opens with `file://`, no build, no npm.
- Include the shared data with `<script src="_shared/hypernet-data.js"></script>` (the file sits
  next to the prototypes, not one level up — an earlier version of this line said `../_shared/`).
- No external CDN, no network fonts — system font stacks only, so it works offline.
- It is a **look-and-feel sketch**, not an app: 3–5 screens/surfaces, clickable enough to feel
  the interaction, state can be in-memory and reset on reload.
- Must show, at minimum: the **feed**, **search/browse**, an **event horizon**, and the
  **create-event + customize** moment.

## Fixture note — event dates (corrected 2026-09-20)

The upstream export dates all twelve generic "camp / crew overflow" events to `2026-07-21`.
Against the `2026-09-20` demo date that put **17 of 18 events in the past**, which quietly
distorted every prototype: the terrain rendered as an abandoned settlement, feeds had nothing
upcoming to recommend, and the player's countdown had one event to count down to.

`_shared/hypernet-data.js` now spreads those twelve across `2026-09-23 … 2026-11-14`, giving 13
upcoming events. The five named World events (Borderland, Burning Man, Hyperstition, camp
kitchen dinner, warehouse session) keep their true upstream dates and are genuinely in the past.

This is synthetic. If the upstream export is refreshed, re-apply the spread or the prototypes
will look empty again.
