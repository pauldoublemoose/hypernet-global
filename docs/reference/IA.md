# Hypernet — information architecture

The proposal that came out of the five concept sketches. Prototyped as
`prototypes/06-library.html`.

---

## The premise

**Spotify's layout is a 2001 desktop application.** Left tree, center content pane, right
activity pane, persistent transport bar along the bottom, menu bar on top. That is Windows
Media Player 9. It is Outlook 2000. It is Winamp's Media Library. Spotify inherited the
skeleton and never changed it.

So "retro" and "genuinely usable" are not in tension for this product. The era already invented
the layout Hypernet wants.

The mistake in concept 01 was not *Windows*. It was **floating windows**. One maximized
three-pane application is a different animal: it has a fixed, learnable geography, it scales to
a lot of content, and it is what people actually got work done in. Only dialogs and chats float.

---

## The mapping

| Spotify | Hypernet |
|---|---|
| Your Library (left pane) | Horizons you follow + your own, people, clusters, call outs |
| **Liked Songs** (pinned, special tile) | **My Horizon** — everything marked *Interested* |
| A playlist | An **Event Horizon** |
| Playlist cover art | **The customizable square** — same object, same place to edit it |
| Home shelves | Feed: `Happening this week`, `Because you follow Anna Vale` |
| Search + filter chips | Already in the v0: ALL / PEOPLE / EVENTS / CALENDARS / GROUPS / CALLOUTS |
| Genre tiles on empty search | Skill categories and cities as coloured tiles |
| Now Playing bar | **Next Up** — soonest event you're Going to, with a countdown |
| Friend Activity (right pane) | **Chats** — buddy list + inline conversation |
| + Create playlist | **+ New** → Event / Horizon / Group chat / Call out |
| Drag track → playlist | Drag event row → horizon in the sidebar |

Two things fall out of this that the product already half-believes:

**The fixture's `feedEvents[].why` field already says `"Because you follow Anna Vale"`.** That
is Spotify's "Because you listened to…" verbatim. The product already thinks in shelves; it
just hasn't drawn them yet.

**The three verbs map cleanly.** From the feature note: events and horizons both get
*going / interested / promote*; users get *follow*.

- **Interested** = Like. Saves to **My Horizon**.
- **Going** = commits it. Appears in **Going**, drives the Next Up bar and the calendar.
- **Promote** = share/amplify to your followers.

So the library gets two pinned tiles at the top — *My Horizon* and *Going* — which is exactly
the "somewhere to see what I liked and what I'm attending" that was missing.

---

## The four regions

**Top** — title bar, menu bar (File / Edit / View / Go / Help), toolbar with Back / Forward /
Home, the search box (`/` or `Ctrl+K`), and a prominent **+ New ▾**.

**Left — YOUR LIBRARY.** Two pinned tiles (My Horizon, Going) with live counts, then filter
chips, then your horizons, followed horizons with their owner underneath, people, clusters,
call outs. Drop target for dragged events.

**Center — the content view.** Routed, with working Back/Forward:
Feed · Search · Horizon detail · Event detail · Person profile · My Horizon / Going · Call outs.

**Right — CHATS.** Collapsible. Buddy list on top, active conversation inline below, with
`+ Event` and `+ Horizon` buttons that drop an actionable card into the transcript.

**Bottom — NEXT UP.** Cover, title and host of your soonest Going event, a live countdown,
transport buttons stepping through your upcoming events, and a "next 7" strip.

---

## The horizon page

Laid out as a Spotify playlist page, because that is what it is:

```
┌─────────┐  EVENT HORIZON
│  cover  │  Quiet Rooms
│  square │  by Anna Vale · 3 events · 21 Jul – 14 Nov · 86 followers
└─────────┘  Slow, low-volume, listening-first gatherings.

[ FOLLOW ]  [ Promote ]  [ ••• ]                        LIST | CALENDAR

#   Event                      Host        City        Date      
1   Deep Listening Lab         Anna Vale   Stockholm   4 Oct     [Going][Interested][•••]
2   Ridge dawn stretch         You         —           23 Sep    [Going][Interested][•••]
3   Sunrise tea service        You         —           16 Oct    [Going][Interested][•••]
```

The cover square is the **same customizable object** the feature note asks for. Editing it lives
where Spotify puts it — click the cover on the detail page — rather than in a settings screen.

---

## Logged out

Same model as Spotify. The full shell renders and public events browse freely. The left pane
collapses to a single *"Log in to follow horizons and save events"* panel, the chat pane says
*"Log in to see your chats"*, and every Going / Interested / Promote / Follow button is present
but opens the login prompt. No separate marketing site — the product is its own shop window.

---

## The one place the metaphors genuinely disagree

**Spotify tracks have no dates. Events do.** A playlist is an ordered set; a horizon is
simultaneously a list *and* a calendar, and neither view is subordinate.

Resolution: a **LIST / CALENDAR** toggle in the content pane header. List is default. Calendar
is a month grid. And a horizon can be either date-ordered or hand-ordered — which is where
concept 02's "a horizon is a route" idea survives without needing the 2D world.

A second, smaller disagreement: Spotify's library is *yours alone*, while half of Hypernet's
value is other people being present. That is what the right-hand chat pane is buying back, and
it is why it should not be collapsed by default.

---

## What this inherits from the five sketches

- **05** — the chat sidebar and the "an event is something a person sends you" card.
- **04** — the playlist reading of a horizon, and the Next Up transport bar.
- **01** — the window-manager instinct, corrected: panes, not floating windows.
- **03** — restraint, and the customizable square as an identity signal you learn to recognise.
- **02** — a horizon as an ordered *route*, surviving as the hand-ordered mode.
