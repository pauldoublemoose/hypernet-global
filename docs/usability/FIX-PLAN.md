# Usability fix plan — round 1 (2026-09-24)

Merged from four persona reports (`firsttimer.md`, `organiser.md`, `crew.md`, `phonebrowser.md`, 81 findings)
tested against snapshot `a12da38`. Each theme lists the source IDs; read those findings for repro steps.
The right-click menu (`e436828`) landed after testing and was not covered.

Order = priority. Commit per theme.

**Round 1 status (2026-09-24):** Phases A, B and C done (C in seven groups, C1–C7, plus the favicon); one commit each.
C was checked the same way, plus a 44px touch-target scan of 16 phone screens; the regression is green with no console
errors or failed requests.
Checked in headless Chromium at 375×812 (touch), 768×1024 and 1440×900 against each source finding's repro, plus
`tests/regression.js` (event → Going; horizon → add events → customize → reload; new group chat; right-click → Add to
horizon; long-press sheet; back/forward/reload; console errors; horizontal overflow on 12 screens). The right-click /
long-press menu from `e436828` was kept and now carries the new host verbs (Edit, Delete, New call out, Published).
Changes to the plan: B4 adds a "Coming up" section after "This week" and puts "From people you follow" second; B7
reaches the people directory through the empty phone search rather than a Home chip (the chips are gone per B4);
A3 keeps drafts instead of asking "Discard?"; B8's clickable step tabs landed with A5's Edit wizard.

## Phase A — foundations (blockers + the majors everyone hit)

**A1. Real URLs and history.** Hash-based routing for tab, destination, view (FEED/LIST/CALENDAR),
open item (event/horizon/person/call out/chat), search query and "Show all" shelf. Every navigation pushes
history; `popstate` drives the existing back logic; reload restores exactly where you were; phone OS back
never leaves the app. Each event and horizon has a stable, copyable link.
Sources: CREW-1, CREW-16, PHONEBROWSER-1, PHONEBROWSER-2, FIRSTTIMER-3, ORGANISER-9.
*Status: done.* Hash routes (`#/event/borderland-2027`, `#/horizon/baltic`, `#/person/mira`, `#/callout/sound`,
`#/chats/baltic`, `#/home/announced`, `#/search?q=…`, `?view=list|calendar`, `?in=<list>` for context). The history
entry carries the full open stack, so reload restores it; the in-app back buttons call `history.back()`. A cold deep
link gets its tab's front page inserted underneath. Dialogs and the long-press sheet own a history entry, so the
back gesture closes them instead of the page. On phone a conversation is a screen pushed onto the current tab.

**A2. A fresh account is empty.** Join opens with blank Name/Handle (placeholders only), handle uniqueness
checked. A new account has no Going/Interested/Hosting, no horizons, follows or chats. Move the seeded
history to an explicit "Try the demo account" entry on the sign-up screen. The action that triggered
sign-up completes afterwards and is confirmed (fixes the Going-toggles-off bug too). Label entry points
"Join / Log in", not just "Log in".
Sources: FIRSTTIMER-1, -2, -6, -12, ORGANISER-13, -16, CREW-10, -11, PHONEBROWSER-11.
*Status: done.* Two local accounts: `me` (the one you join with, starts empty) and `demo` (Michal, fully seeded),
each keeping its own relations and chats; "Try the demo account" is the first row of Join and of Log in. The fixture
events once marked "You" are now hosted by Michal, a member like any other. Join starts blank with focus in Name,
checks the handle live (`@sasha is taken`) and stays disabled until valid. A gated verb is made so after joining,
never toggled off, and the toast says "Welcome, Mia · Interested · Portable shade build". Entry points read
"Join / Log in" until an account exists; the duplicate sidebar button is gone on desktop (the phone You tab keeps
its card), and phone Home/Horizons get the entry in the app bar. The old single-account store migrates into `me`.

**A3. Create forms use placeholders, not sample values; nothing is lost.** Event, horizon, call out, group
chat: empty fields with placeholder text. Closing a half-filled form asks to discard or keeps a draft;
chat drafts are kept per conversation.
Sources: ORGANISER-4, PHONEBROWSER-6, -12, CREW-3, CREW-13.
*Status: done.* Event, call out, horizon and group chat open empty; the old samples are placeholders. Each create
form is its own draft: ×, Esc, Cancel and the back gesture keep it (per account, across reloads); the secondary
button turns into Discard once something is typed. Chose "keep a draft" over a discard prompt: no extra modal, nothing
lost. The event wizard asks for a title and start date inline ("Add a title") instead of a silently disabled button;
Post call out / Create horizon stay disabled until named. A group chat is named after its people until you name it,
so Create group is never mysteriously off. Chat drafts are kept per conversation and show as "Draft: …" in the list.
Dropped the "One item per line", "optional" and "Anyone can find and follow it" hints on the forms touched here.

**A4. Persistence.** Everything the user creates or changes survives reload: chats, messages, groups, DMs,
call outs, answers, follows, promotes, horizons, events.
Sources: CREW-2, ORGANISER-7.
*Status: done.* One store (`hypernet-feed:v2`): the network keeps created events, horizons (covers, looks),
call outs and hosts' edits to events they did not create here (the demo's); each account keeps its RSVPs, went,
promotes, follows, hosting, horizons, chats, messages, DMs, groups, unread flags and drafts. Tab, open chat and
dock come back through the history entry on reload, and the dock state for a new visit. Follower and promote
counts are now "everyone else + you", so a reload no longer drifts them. Call-out answers are stored with B6.

**A5. Owners can edit and delete.** Owner's event page: Edit (full wizard from step 1, "Save changes"),
Customize, Share, Delete (confirm). Owner actions lead; guest verbs are not the first thing a host sees.
Same for horizons: Edit details, Customize, Share, Delete. Rename and Customize are labelled, not
lookalike icons. Removing an event from a horizon offers Undo.
Sources: ORGANISER-1, -10, -11, -14.
*Status: done.* The host's event page leads with Edit · Customize (Interested / Going are for guests), then
Promote, Horizon, Share and a ⋯ that holds Delete. Edit reopens the whole wizard filled in, with clickable step tabs,
and saves from any step ("Save changes"); a renamed event keeps its link. Delete asks once and removes the event from
every horizon; deletions and edits of the demo's own fixture events persist. Horizons: Add events, Customize, Edit
details, Publish, and ⋯ (Share, Delete), all labelled. Removing an event from a horizon (× or the menu) toasts with
Undo. The right-click / long-press menu carries the same host verbs (Edit…, Customize…, Delete…, Edit details…,
Published) and the page ⋯ opens that same menu filtered to what the page doesn't show. Share lands in A6.

**A6. Sharing.** Share on every event and horizon, available logged out: Copy link (uses A1 URLs), native
share sheet where available, and "Send in a chat" when logged in. Share opens in place, doesn't pull you
out of the event.
Sources: ORGANISER-2, FIRSTTIMER-4, CREW-12.
*Status: done.* One Share dialog for events and horizons, from the page, the ⋯ and the context menu, never gated:
the item's link with Copy link (primary), "Share to an app" when `navigator.share` exists, and — logged in — "Send in
a chat" with an optional message and a search over your chats and everyone you have no chat with yet. Sending keeps
you on the page; the toast says "Sent to Mira Chen" with Open. Horizons show Share to guests, and to owners once
published (a private one shows Publish there instead; the other sits in its ⋯).

**A7. Scroll and place memory.** Restore vertical scroll on Home, lists, horizon pages and events after
back; restore each shelf's horizontal offset; each phone tab keeps its own scroll; switching tabs doesn't
carry another tab's offset. Opening a chat from another tab: back returns you there.
Sources: PHONEBROWSER-4, CREW-6, CREW-7, ORGANISER-20.
*Status: done.* Every history entry carries the list, reading pane, sidebar, chat list and per-shelf horizontal
offsets (stamped as you scroll), so back, forward and reload land where you were — Home feed and its shelves,
LIST, horizon pages, long event pages, desktop list + reading pane. A new place starts at the top unless it is the
same list with something opened on it. Each phone tab keeps its own place (tap another tab and back: same spot;
tap the tab you are on: its top). Chats opened from another tab are pushed onto that tab (A1), so back returns there.

## Phase B — hierarchy and layout

**B1. A horizon is always a horizon.** At every width (768, 1440 with chats open), the horizon page is the
playlist page with cover and owner actions — never a folder/row inside its own list.
Source: ORGANISER-3.
*Status: done.* The horizon folder is gone: a horizon (from the sidebar, a chip, a card, a link) always opens as its
own page — cover, mood, owner, actions, tracks — in the reading pane or the centre, at 768, 1440, and 1440 with Chats
open; its sidebar row is lit while it is open. Old folder-style links and history entries open the page. Trade-off:
a horizon no longer has its own LIST/CALENDAR switch (it was only reachable through the folder view).

**B2. Desktop with chats open keeps list + reading.** Opening the chat dock at 1440 must not collapse the
event list into one pane; narrow the dock or overlay it instead.
Source: CREW-5.
*Status: done.* With the sidebar and the dock both open below 1680px the dock narrows to 300px and the split threshold
drops to 780px, so at 1440 the list and the reading pane stay side by side while a conversation is open (Share and
Message open the dock without collapsing anything). Below ~1366 with both panes open it still falls back to one pane;
at 768 the dock and sidebar already exclude each other.

**B3. Event page actions.** Phone: sticky action bar (Interested / Going / more) that stays reachable on long
pages. All action buttons on one grid and one height. Burn pages get a primary "Get tickets" /
"Become a member" / "How to get in" action near the top linking to the official source, with the
access model summarised; the official links are not buried among identical chips.
Sources: PHONEBROWSER-3, -18, CREW-19, CREW-21, FIRSTTIMER-5, -15.
*Status: done.* On phone the event's verbs are a bar at the bottom of the screen, above the tab bar, in the event's
colours: Interested · Going · ⋯ (host: Edit · Customize · ⋯; past: Went · ⋯). ⋯ opens the same sheet as a long-press,
holding only what the bar doesn't show; the inline verb row is not drawn twice. Every verb is one height (44 desktop,
48 phone) with its own border; Promote lost its dashed "draft" look. Events with tickets or membership get an Entry
block right under the header — model, price range, the next open sale — with "Get tickets" / "Become a member" /
"How to get in" to the official page (access URL, then the member platform, then the ticket/registration source,
then the event's own site); that link also leads the Links chips. Borderland's note now says entry and prices are
for 2027 and the rest is from 2026.

**B4. One Home.** Phone and desktop Home show the same content (shelves on phone, the same sections on
desktop): This week, Announced burns, Your horizons (incl. newly published), Horizons worth following,
From people you follow (desktop too), Call outs. Phone Home has one switcher row, not three; no duplicated
horizons (drop the unlabelled tile grid or make it "Jump back in" with a label). First shelf is
"This week" when it is this week. Show all keeps the view switcher. Network news rows either open
something or aren't styled as rows.
Sources: FIRSTTIMER-7, -8, ORGANISER-15, CREW-8, PHONEBROWSER-7, -8, -16.
*Status: done.* One list of Home sections drives both the phone shelves and the desktop FEED bands, in the same order:
This week · From people you follow · Coming up · Announced burns · Your horizons · Horizons worth following · Call outs ·
Network news. Added "Coming up" after This week so later events don't vanish from Home, and put people-you-follow second
(CREW-8). This week only holds the next seven days, and its cards read "Today", "Tomorrow", "Wed · in 3 days". Phone
Home lost the ALL/EVENTS/HORIZONS/CALL OUTS chips and the unlabelled tile grid, leaving FEED/LIST/CALENDAR as the one
switcher. Each thing appears once on Home (first section wins); news rows that point at something already shown, or at
nothing, are dropped, so every row opens something (today that leaves no news at all). Desktop bands cap at 8 with a
"Show all N" row. Newly published horizons lead "Horizons worth following", so they reach Home, logged out too. Show all
on an event shelf keeps LIST / CALENDAR. The "news from your network" subtitle is gone.

**B5. Calendar.** Opens on the current week/month; days are tappable and list that day's events; event
marks are tappable (≥44px hit area).
Sources: FIRSTTIMER-11, PHONEBROWSER-5.
*Status: done.* The calendar opens on today's month (no more hard-coded October). The whole day cell is the target
(≥53×57px at 375): on a phone it lists that day under the grid ("Wed 23 Sep 2026 · 1", with "All of September" to go
back; empty days say so), and the picked day is kept in the URL/history; on a desktop a day cell or week-column header
opens that day. The 6px colour marks are now just marks, not tiny buttons. Today and paging clear the pick.

**B6. Call outs.** Answer opens a DM with an editable prefilled message, then marks the call out
"Answered" (no duplicates, no Answer on your own). A call out can link to an event and shows on that
event's page. No duplicated titles on cards/detail.
Sources: CREW-4, ORGANISER-8, -19, CREW-20, FIRSTTIMER-16.
*Status: done.* Answer opens the host's DM with "Re: … I can do this" as an editable draft (nothing is sent for you);
once you send it the call out shows "You answered · Open chat" instead of Answer, per account, across reloads —
a second tap opens the same chat, never a duplicate. Your own call out shows Edit and Close call out (Reopen, with
Undo) instead of Answer; closed ones leave Home. A call out can be "For event" (your hosted or Going events; the
host's event page has "New call out" with the event preselected, and the ⋯/context menu too); the event page lists
call outs posted for it and the call out page links back. The title appears once: cards show host and deadline under
the "Looking for" tile, rows and the detail page show the title as typed.

**B7. Chats on phone.** Conversation header with members, profile, rename, add people. Chat list sorted by
latest message; empty DMs don't clutter it. People directory reachable from Home/search, not only You.
Sources: CREW-9, CREW-14, CREW-18.
*Status: done.* A conversation's title (and a ⋯ beside it; on desktop a ⋯ in the dock header) opens its details: you
and every member (each opens their profile on top of the chat), Add people (a DM becomes a new group), Rename and
Leave group (confirmed) for groups. The chat list is ordered by the latest message — opening a chat no longer bumps it
— using timestamps on new messages and a morning clock for the fixture times; a DM with nothing in it is not listed.
People: an empty phone search now offers People and Call outs, so the directory is one tap from Home's search; the
You tab keeps only "People you follow" (desktop keeps People in the sidebar).

**B8. Customize.** Choosing a preset never overwrites the mood line the user typed. On phone the live
preview stays visible (sticky). Wizard step tabs are either clickable or not styled as tabs. The New
horizon flow has one cover picker and one create button.
Sources: ORGANISER-5, -6, -12, -21.
*Status: done.* Presets set palette, surface, type, headline, motion, shape, density and square — never the mood line.
On phone the Look step (events and horizons) shows a compact live preview (the page header: square, headline, mood)
first, pinned to the top of the sheet while the controls scroll under it. The wizard's step tabs became real,
clickable tabs in A5. New Event Horizon has no cover picker and one "Create horizon" button; it lands on the horizon's
page ("Horizon created"), where Customize holds the cover.

## Phase C — minor and polish

- Nouns: no "Cluster" anywhere user-facing; "Event Horizon" in headings/create, "Horizons" as the short nav
  label, consistently. (PHONEBROWSER-13, FIRSTTIMER-8, CREW-15)
  *Status: done (C1).* "Cluster" is gone: groups left search and person pages; a camp shows as its published Event
  Horizon (Hosted by chip, old `#/group/…` links) or as a plain name. Headings, create rows, toasts and search bands say
  "Event Horizon(s)"; the nav keeps "Horizons". The New sheet says Event · Event Horizon · Chat · Call out.
- Remove remaining instruction/hint text, including New-sheet subtitles. (ORGANISER-18, CREW-15)
  *Status: done (C1).* New-sheet subtitles and the desktop empty-search sentence are gone (empty search shows Browse:
  People, Call outs); form hints went in A3, the Home subtitle in B4.
- Inert chips/tags don't look like buttons; "+ N more" opens the full list. (PHONEBROWSER-10, FIRSTTIMER-13)
  *Status: done (C2), changed.* Inert tags (take part, principles, teams, a camp without a page) are filled and
  borderless; only pressable chips and links keep an outline. "+ N more" became plain text "and N more": the prototype
  only knows the few named people already shown, so a "full list" would repeat them.
- "Going: N from your network" only when you have a network. (FIRSTTIMER-9)
  *Status: done (C2).* Logged out, or before you follow anyone, the fact reads "N on Hypernet".
- Search: accent-insensitive, matches countries, useful no-results state, remembers last query.
  (FIRSTTIMER-10, PHONEBROWSER-15)
  *Status: done (C3).* Matching folds accents and case both ways (Malmo → Malmö, Eksjo → Eksjö) and covers city,
  venue, region and country (Sweden → Borderland, South Africa → AfrikaBurn). "this week", "today", "tomorrow",
  "this weekend", "next week" and "this month" read as dates. No results shows "Nothing matches" followed by This week
  events and Popular Event Horizons to tap. The query survives tab switches (A7), the last five searches appear as
  Recent in the empty search, and past events in results carry a Past pill.
- Horizons tab: clear header; explain or drop the lone date on horizon rows (show a date range).
  (PHONEBROWSER-14, FIRSTTIMER-19)
  *Status: done (C5).* The catch-all section is "Popular" (sorted by followers) under Yours / Following; the lone
  date is now "Next Fri 25 Sep" or "Ended Fri 12 Jun" on every horizon row.
- Promote shows a visible effect (e.g. "Promoted by you" and it appears to followers). (CREW-17)
  *Status: done (C4), partly.* Promoting adds a "Promoted" fact on the event ("By you and 8 more"), a Promoted list
  under Your events (sidebar and You tab), a Promoted tag on its cards, and a toast with "See all". Not done: showing it
  in followers' feeds ("Promoted by Anna") — the prototype has no model of who follows you or of others' promotions.
- Newcomer clarity for "Horizon" and "Promote" verbs via labels, not hint text. (FIRSTTIMER-14)
  *Status: done (C1/C4).* The button always reads "Add to horizon" (the bare noun "Horizon" is gone; verb paddings
  tightened so the row still fits one line at 1440 split). Promote lost its dashed look in B3; C4 gives it a visible result.
- Truncation keeps the distinguishing part of titles; no duplicated titles. (FIRSTTIMER-18, PHONEBROWSER-19)
  *Status: done (C5).* In narrow lists (phone) a title may take two lines and the date moves under it, so
  "SF Bay Area Decompression 2026: Oakland Edition Vol. II" shows whole; desktop keeps its date column. The phone app
  bar gives long names two lines (dropping the type word). Duplicated call-out titles went in B6.
- Sticky headers render above row glyphs. (FIRSTTIMER-17)
  *Status: done (C5).* Squares isolate their glyph layer and section headers sit above rows.
- All touch targets ≥44px. (PHONEBROWSER-9, CREW-22)
  *Status: done (C6).* Chips, app-bar buttons, the phone search field, chip remove buttons, "Read them" (now a link
  chip) and the conversation title are ≥44px on touch screens; a scan of 16 phone screens and dialogs finds nothing
  smaller (full-row labels around checkboxes count as the row).
- New sheet dismissible by tapping the backdrop / swipe down. (PHONEBROWSER-17)
  *Status: done (C6).* Every bottom sheet (New, long-press) closes on a tap on the dimmed page or a swipe down on its
  title bar (it follows the finger; under 70px it springs back). Also fixed: a link without `?view=` now opens the
  destination's default view instead of the last one used.
- Picker: "Your events" shortcut. (ORGANISER-17)
  *Status: done (C7).* Add events opens with "Your events" (hosting, going, interested, each labelled) above
  "All events"; typing a search gives one flat list.
- *Added by the coordinator:* inline favicon (no /favicon.ico 404). *Status: done (42c7606).* Also: the regression
  script finds a Chromium on its own (Playwright's, `PW_CHROME`, or the Playwright cache) and counts 4xx responses.
- *Added by the coordinator:* Network news after B4. *Status: dropped (C1).* Every item either pointed at something
  Home already shows (the owner's "never the same destination twice") or at nothing ("@nova and @ember are now
  Friends"). Home's sections already carry the network: people you follow, your Event Horizons, call outs from your
  crews. The news fixtures, row type and band are removed rather than kept dormant.

## Round 2 (2026-09-24)

Re-test: 73/81 round-1 findings fixed, 8 partial, 0 broken; 55 new findings (4 major) in `round2/*.md`.
Fixed in the coordinator's priority order, one commit per group.

**R2-1. Toasts never sit on the controls.** Sources: CREW-R2-1, FIRSTTIMER-R2-2, ORGANISER-R2-12, CREW-R2-3,
FIRSTTIMER-R2-14, CREW-17 (partial).
*Status: done.* On phone, toasts are placed above whichever bar holds the controls (the event's verb bar, else the
tabs) and re-placed on every render; a tap that lands where a toast's button was, within 0.7s of it disappearing, is
swallowed instead of reaching the page. The phone verb bar is Interested · Going · Promote · ⋯ (Add to horizon and
Share in ⋯). Toast copy: "Not going" / "Not interested" instead of "Removed"; Promote says "Promoted · <event>" with
Undo and no longer claims followers the prototype can't know about.

**R2-2. Private horizons and unavailable links.** Sources: ORGANISER-R2-1, PHONEBROWSER-R2-6.
*Status: done.* A private horizon always offers Publish (empty ones too) and has no Share anywhere — page, ⋯, context
menu — until it is published; then Share takes Publish's place and "Published" moves into ⋯. A link to anything the
viewer can't open (private, deleted, mistyped: event, Event Horizon, call out, person, chat) keeps its URL and shows a
"This Event Horizon is private or no longer here" / "This event is no longer on Hypernet" page with Home, instead of
silently rewriting to `#/home`. Back to a deleted item's history entry shows the same page.

**R2-3. A horizon is its own place on desktop and tablet.** Sources: ORGANISER-R2-2, ORGANISER-15 (partial),
PHONEBROWSER-R2-7, ORGANISER-R2-10, ORGANISER-R2-13 (numbering).
*Status: done.* On wide screens opening a horizon (sidebar, card, chip, link) makes it the destination: its page —
cover, owner actions, tracks — is the centre list, the reading pane shows the selected track (first upcoming by
default), only its sidebar row is lit, and the window title is its name; no Home/Hosting header or view switcher.
Tracks open beside it (`#/event/…?in=horizon/baltic`); at 768 a track opens with "Back · Baltic Circuit". On phone it
stays a page on the Horizons tab. Tracks: upcoming first, past ones folded under "Past · N", no playlist numbers (they
implied an order the owner can't set), titles wrap to two lines with the state tag under them; the date range prints
both years when they differ. `?in=` values keep their slash readable.

**R2-4. Volunteer shifts you can take; the host is one tap away.** Sources: CREW-R2-2, CREW-R2-13, PHONEBROWSER-R2-9 (host).
*Status: done.* Each shift is a row with "Take this shift" (logged out it goes through Join and completes): taking one
sets Going with that shift ("Going · Shift 2 · Fri 9 Oct 14:00–18:00"), "Your shift" gives it up, and Not going drops
it; kept per account. The "Pick a shift with Going, then confirm it in the camp chat" text is gone; a "Message Jon
Hale" chip sits under the shifts (the fixtures have no camp chat for this host, so the host's DM is the chat). The Host
fact itself links to the host (or the camp's Event Horizon) and the duplicate "Hosted by" block at the bottom is gone.

**R2-5. One Home, told the same way at every width.** Sources: FIRSTTIMER-R2-1, FIRSTTIMER-R2-5, FIRSTTIMER-7 (partial),
ORGANISER-15 (partial), FIRSTTIMER-R2-15, PHONEBROWSER-R2-10.
*Status: done.* Desktop Home opens with the phone's greeting and tagline. The sidebar Home count is hidden logged out;
logged in it is the unread count and read state is kept per account, so it no longer resets on reload. A section's
count is the whole section on both viewports (Coming up 12 = its Show all 12), and both show at most 8 items before
Show all. Event Horizon sections on desktop Home are cards, as on phone, not rows that pass for events. A link opened
cold (or pasted into the address bar) lights its row and scrolls it into view; the window title names the item. Bold
"unread" titles only appear where reading is tracked (desktop, logged in).

**R2-6. Network counts and Promote copy tell the truth.** Sources: FIRSTTIMER-R2-3, FIRSTTIMER-9 (partial),
FIRSTTIMER-R2-14, CREW-17 (partial).
*Status: done.* The Going fact is always "N on Hypernet"; underneath it says "1 you follow" (and "Including you") only
counting people you actually follow who are going. Promote copy was fixed in R2-1 ("Promoted · <event>" with Undo,
no follower claims); showing a promotion in followers' feeds stays out of reach of the prototype's data.

**R2-7. Chats for a new account, New chat drafts, answered call outs.** Sources: CREW-R2-4, FIRSTTIMER-R2-11,
PHONEBROWSER-R2-8, CREW-R2-5, CREW-R2-6, PHONEBROWSER-R2-2, PHONEBROWSER-6 (partial), CREW-R2-7, CREW-R2-8, CREW-R2-11.
*Status: done.* A new account's Chats lists people (the ones you follow first, else people on Hypernet), each one tap
from a DM; New chat stays in the header only, so it isn't drawn twice. New chat keeps its picks and group name as a
draft through ×, back and reload, cleared on create. Group name shows only from two people and never in Add people
(the `hidden` attribute was being overridden by `.field{display:flex}`; `[hidden]` now always wins). A chat with an
unsent draft (e.g. a started call-out answer) is listed; call-out cards and rows say "Answered" once you sent one. The
dock header drops the member avatars (members are in ⋯), so the group name is readable.

**R2-8. Organiser gaps.** Sources: ORGANISER-R2-4, ORGANISER-R2-3, ORGANISER-R2-5, ORGANISER-R2-6, ORGANISER-R2-7.
*Status: done.* Basics has Type (Build, Workshop, Volunteer day, …) and optional From / Until times; they show in the
kicker, the row meta and the When fact, and Edit fills them in. Mood lives only on Look; Edit is Basics · Words and
leaves the look to Customize. Right-click / long-press on a track of your own horizon leads with "Remove from ‹horizon›"
(Undo toast). Search, the Add events picker and every search field match all words in any order across fields
("baltic build"). Call outs have Share (page and link `#/callout/…`; sent into a chat as a call-out card). Posting a
call out opens it on top of where you were, in the same tab (from the event: event → call out; phone stays on You).

**R2-9a. Lists, calendar and search polish.** Sources: PHONEBROWSER-7 (partial), PHONEBROWSER-R2-3, PHONEBROWSER-R2-4,
FIRSTTIMER-R2-12, CREW-R2-14, ORGANISER-R2-11, PHONEBROWSER-R2-5, CREW-R2-10, FIRSTTIMER-R2-7, ORGANISER-R2-10 (plural),
FIRSTTIMER-R2-8, PHONEBROWSER-R2-11, CREW-R2-12, PHONEBROWSER-R2-12.
*Status: done.* Phone calendar has no DAY/MONTH row (tapping a day is the day view), so the grid starts one row
higher; picking a day is a history step. Time bands are This week (7 days, as on Home) · Later in September ·
October · … · Past, everywhere. The no-results fallback separates This week from Coming up. On phone, Sort sits above
the list, so FEED/LIST/CALENDAR never move. People is one steady list (following marks a row in place). The Horizons
tab drops the repeated Following/Yours pill and the "Event Horizon" word so owners fit; "1 event" is singular. Phone
rows lead with the place and drop a host that repeats the title; Home cards put the day and the place on separate
lines. "Crews" is gone ("Call outs"). The phone search field has a 44px clear button (the native one is hidden).

**R2-9b. Event page says each thing once.** Sources: FIRSTTIMER-R2-4, PHONEBROWSER-R2-9, FIRSTTIMER-R2-10,
FIRSTTIMER-R2-13, ORGANISER-R2-9, ORGANISER-R2-13 (button state), PHONEBROWSER-10 (partial).
*Status: done.* When the Entry block shows (tickets / membership) the facts grid drops its Entry cell; a free event's
Entry section that only repeated "Free" is gone. The headline price is the standard tiers (concessions — pensioner,
child, subsidised, carer — stay in Tickets): AfrikaBurn reads 3,099–7,199 ZAR, Zurich 65–85 CHF, by one rule. "From the
event's own pages" is a caption inside Links. Empty sections (Bring, Who's going with nobody) are omitted. The Add to
horizon button reads "✓ On 1 horizon" once the event is on one of yours. Inert tags are small labels again on touch
screens, not 44px blocks.

**R2-9c. Forms, sheets and menus.** Sources: PHONEBROWSER-R2-1, PHONEBROWSER-6 (partial), FIRSTTIMER-R2-6,
FIRSTTIMER-R2-9, CREW-R2-9, PHONEBROWSER-R2-13, ORGANISER-R2-8.
*Status: done.* Cancel always sits in the thumb spot and keeps the draft; Discard moved to the dialog's title bar
(appears once something is typed) and toasts "Draft discarded" with Undo. A restored draft puts the caret at the end
instead of selecting everything. Join opened by an action says why ("Join to keep “Portable shade build”"), and typing a
name fills the handle (numbered if taken), so Join lights up. Logged-out Share is a short bottom sheet and Copy link
closes it. Right-click / long-press now works on people (Open, Message, Follow), call outs (Open, Answer / Open chat or
Edit / Close, Share) and chats (Open, Rename, Add people, Leave; DM: Profile). "Add to horizon" is one label everywhere.
Horizon Customize previews the horizon page first.

**Round 2 status:** all 55 new findings and the 8 round-1 partials addressed across R2-1 … R2-9c, except the
follower-feed half of CREW-17 (the prototype has no model of who follows you). `tests/regression.js` now also covers
the four majors (toast vs verb bar incl. the late tap, private horizon Publish/Share and its link, horizon as a desktop
destination, volunteer shifts) plus Cancel/Discard safety; it passes at 375 / 768 / 1440 with no console errors or
failed requests.

## Owner feedback 2026-09-27 (`docs/FEEDBACK-2026-09-27.md`; decisions in `docs/DECISIONS.md`)

**F1. Logged out is a preview.** *Status: done.* Bottom bar "Preview of Hypernet · Join to keep events, follow Event
Horizons and chat." with Join free and Log in (Log in alone once an account exists). Full width on desktop and tablet;
on phone directly above the tab bar and below the event verb bar; toasts stack above both. It takes layout space, so
the last rows and cards stay reachable. The toolbar / app-bar / You-tab / Chats Join buttons are gone (one entry point).
The owner's line said "crews"; kept the round-2 rule that "crew" isn't a product noun, so the line ends "and chat".

**F2. Home has one view.** *Status: done.* No FEED / LIST / CALENDAR on Home at any width; `#/home?view=list` and
`?view=calendar` links land on `#/home`. LIST/CALENDAR remain on Going, Interested, Hosting, Promoted, Horizons and an
event section's Show all. (Home's LIST was the only place with Sort for the whole network; Show all lists keep Sort.)
