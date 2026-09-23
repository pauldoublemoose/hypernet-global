# Usability fix plan — round 1 (2026-09-24)

Merged from four persona reports (`firsttimer.md`, `organiser.md`, `crew.md`, `phonebrowser.md`, 81 findings)
tested against snapshot `a12da38`. Each theme lists the source IDs; read those findings for repro steps.
The right-click menu (`e436828`) landed after testing and was not covered.

Order = priority. Commit per theme.

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

**A4. Persistence.** Everything the user creates or changes survives reload: chats, messages, groups, DMs,
call outs, answers, follows, promotes, horizons, events.
Sources: CREW-2, ORGANISER-7.

**A5. Owners can edit and delete.** Owner's event page: Edit (full wizard from step 1, "Save changes"),
Customize, Share, Delete (confirm). Owner actions lead; guest verbs are not the first thing a host sees.
Same for horizons: Edit details, Customize, Share, Delete. Rename and Customize are labelled, not
lookalike icons. Removing an event from a horizon offers Undo.
Sources: ORGANISER-1, -10, -11, -14.

**A6. Sharing.** Share on every event and horizon, available logged out: Copy link (uses A1 URLs), native
share sheet where available, and "Send in a chat" when logged in. Share opens in place, doesn't pull you
out of the event.
Sources: ORGANISER-2, FIRSTTIMER-4, CREW-12.

**A7. Scroll and place memory.** Restore vertical scroll on Home, lists, horizon pages and events after
back; restore each shelf's horizontal offset; each phone tab keeps its own scroll; switching tabs doesn't
carry another tab's offset. Opening a chat from another tab: back returns you there.
Sources: PHONEBROWSER-4, CREW-6, CREW-7, ORGANISER-20.

## Phase B — hierarchy and layout

**B1. A horizon is always a horizon.** At every width (768, 1440 with chats open), the horizon page is the
playlist page with cover and owner actions — never a folder/row inside its own list.
Source: ORGANISER-3.

**B2. Desktop with chats open keeps list + reading.** Opening the chat dock at 1440 must not collapse the
event list into one pane; narrow the dock or overlay it instead.
Source: CREW-5.

**B3. Event page actions.** Phone: sticky action bar (Interested / Going / more) that stays reachable on long
pages. All action buttons on one grid and one height. Burn pages get a primary "Get tickets" /
"Become a member" / "How to get in" action near the top linking to the official source, with the
access model summarised; the official links are not buried among identical chips.
Sources: PHONEBROWSER-3, -18, CREW-19, CREW-21, FIRSTTIMER-5, -15.

**B4. One Home.** Phone and desktop Home show the same content (shelves on phone, the same sections on
desktop): This week, Announced burns, Your horizons (incl. newly published), Horizons worth following,
From people you follow (desktop too), Call outs. Phone Home has one switcher row, not three; no duplicated
horizons (drop the unlabelled tile grid or make it "Jump back in" with a label). First shelf is
"This week" when it is this week. Show all keeps the view switcher. Network news rows either open
something or aren't styled as rows.
Sources: FIRSTTIMER-7, -8, ORGANISER-15, CREW-8, PHONEBROWSER-7, -8, -16.

**B5. Calendar.** Opens on the current week/month; days are tappable and list that day's events; event
marks are tappable (≥44px hit area).
Sources: FIRSTTIMER-11, PHONEBROWSER-5.

**B6. Call outs.** Answer opens a DM with an editable prefilled message, then marks the call out
"Answered" (no duplicates, no Answer on your own). A call out can link to an event and shows on that
event's page. No duplicated titles on cards/detail.
Sources: CREW-4, ORGANISER-8, -19, CREW-20, FIRSTTIMER-16.

**B7. Chats on phone.** Conversation header with members, profile, rename, add people. Chat list sorted by
latest message; empty DMs don't clutter it. People directory reachable from Home/search, not only You.
Sources: CREW-9, CREW-14, CREW-18.

**B8. Customize.** Choosing a preset never overwrites the mood line the user typed. On phone the live
preview stays visible (sticky). Wizard step tabs are either clickable or not styled as tabs. The New
horizon flow has one cover picker and one create button.
Sources: ORGANISER-5, -6, -12, -21.

## Phase C — minor and polish

- Nouns: no "Cluster" anywhere user-facing; "Event Horizon" in headings/create, "Horizons" as the short nav
  label, consistently. (PHONEBROWSER-13, FIRSTTIMER-8, CREW-15)
- Remove remaining instruction/hint text, including New-sheet subtitles. (ORGANISER-18, CREW-15)
- Inert chips/tags don't look like buttons; "+ N more" opens the full list. (PHONEBROWSER-10, FIRSTTIMER-13)
- "Going: N from your network" only when you have a network. (FIRSTTIMER-9)
- Search: accent-insensitive, matches countries, useful no-results state, remembers last query.
  (FIRSTTIMER-10, PHONEBROWSER-15)
- Horizons tab: clear header; explain or drop the lone date on horizon rows (show a date range).
  (PHONEBROWSER-14, FIRSTTIMER-19)
- Promote shows a visible effect (e.g. "Promoted by you" and it appears to followers). (CREW-17)
- Newcomer clarity for "Horizon" and "Promote" verbs via labels, not hint text. (FIRSTTIMER-14)
- Truncation keeps the distinguishing part of titles; no duplicated titles. (FIRSTTIMER-18, PHONEBROWSER-19)
- Sticky headers render above row glyphs. (FIRSTTIMER-17)
- All touch targets ≥44px. (PHONEBROWSER-9, CREW-22)
- New sheet dismissible by tapping the backdrop / swipe down. (PHONEBROWSER-17)
- Picker: "Your events" shortcut. (ORGANISER-17)
