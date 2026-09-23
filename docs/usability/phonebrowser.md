# Usability test: impatient phone browser (Leo)

I tested the frozen snapshot on 2026-09-24 in headless Chromium with touch emulation. Viewports: 375x812 and 430x932. I drove the UI with real taps, synthesized touch flings, browser back and reload. The fixture's "today" is Sun 20 Sep 2026.

## Verdict

Leo can do what he came for, but it hurts more than it should. Browsing is fast: the tab bar never moves, the shelves snap nicely, and an event is one tap away from a cold load. Everything around that is fragile:

- The phone's own Back gesture throws him out of the site.
- Reload drops him back on Home.
- Every back step loses his scroll position.
- The event page has no action bar he can reach once he scrolls.
- Closing a half-filled form throws the input away with no warning.

A one-handed, fast-scrolling user will hit at least one of these in his first minute.

**Measured: cold load to "an event this week I could go to"**
- DOMContentLoaded took 41 ms on localhost.
- **1 tap** if Leo trusts the first "Coming up" card. It is fully visible above the tab bar at both sizes (card 529–740 px at 375; tab bar starts at 747). The shelf never says "this week", though, so he has to know today's date.
- **2 taps** on the path that is unambiguous: LIST, then the first row under "THIS WEEK 2".
- The CALENDAR path takes 3+ taps and misses the week (see PHONEBROWSER-5).

**Horizontal overflow:** none. `documentElement.scrollWidth` equalled the viewport width on every screen tested at both sizes: Home, LIST, CALENDAR, Show all, search, 4 events of different lengths, Event Horizon, Person, Call out, and all four create forms.
**Console errors:** none in any run.

## Findings

### PHONEBROWSER-1: Browser/OS Back leaves the site
- **Severity:** blocker
- **Viewport:** 375x812, 430x932
- **Steps to reproduce:**
  1. Cold load.
  2. Tap any Home card, or open Show all, search, or New → Event and half-fill it.
  3. Use browser Back (the Android back gesture or iOS edge swipe does the same).
- **Expected vs actual:** Expected Back to step back one level inside Hypernet, the same as the app-bar ‹. Instead `history.length` stays at 2, because the app never calls `pushState` or uses a hash. Back went to `about:blank`, and any half-typed form went with it. Only the in-app ‹ works.
- **Suggested fix:** Push a history entry (a hash route such as `#/event/<id>`) on every open, Show all, search and dialog, and handle `popstate` with the existing `phoneBack()`.
- **Screenshot:** none. The result is a blank page.

### PHONEBROWSER-2: Reload loses where you are
- **Severity:** major
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Open "Night kitchen line" from Coming up.
  2. Scroll the event to 900 px.
  3. Reload.
- **Expected vs actual:** Expected the same event at the same place. Actual: Home FEED at scroll 0 with an empty stack. The chosen LIST/CALENDAR view also resets to FEED on reload.
- **Suggested fix:** Put the route in the URL (same as PHONEBROWSER-1) and restore the tab, view and open item from it on boot.

### PHONEBROWSER-3: No sticky action bar on event pages
- **Severity:** major
- **Viewport:** 375x812, 430x932
- **Steps to reproduce:**
  1. Open "Burning Man 2027" from Announced burns.
  2. Fling to the bottom.
- **Expected vs actual:** Expected Interested / Going to stay within thumb reach while reading. Actual: the verbs sit only at the top (y=400) and scroll away. Nothing inside `#detailcol` is sticky or fixed. The page is 5109 px tall, about 7 screens at 375, so after reading to "Who's going" Leo has to fling back up to act.
- **Suggested fix:** Pin a compact Interested / Going / ⋯ bar above the tab bar once the inline verbs scroll out of view.
- **Screenshot:** `shots/phonebrowser-01.png` (bottom of Burning Man 2027, no verbs anywhere)

### PHONEBROWSER-4: Scroll position is thrown away on every return
- **Severity:** major
- **Viewport:** 375x812, 430x932
- **Steps to reproduce:**
  - (a) Swipe "Announced burns" sideways (scrollLeft 471). Open The Borderland 2027, then tap ‹.
  - (b) Scroll Home to 600, tap the Horizons tab, then tap the Home tab.
  - (c) In Burning Man 2027, scroll to 4416, tap the "Anna Vale" chip, then tap ‹.
- **Expected vs actual:** Expected to land exactly where he left. Actual:
  - (a) The vertical position is kept (487) but the shelf snaps back to scrollLeft 0.
  - (b) Home comes back at 0.
  - (c) The event comes back at 0.
- **Suggested fix:** Store `listbody.scrollTop`, per-shelf `scrollLeft` and `dscroll.scrollTop` on each stack entry and tab, and restore them after `render()`.

### PHONEBROWSER-5: CALENDAR opens on the wrong month and its events are untappable
- **Severity:** major
- **Viewport:** 375x812 (430x932 is the same)
- **Steps to reproduce:**
  1. Cold load.
  2. Tap CALENDAR.
- **Expected vs actual:** Expected the current month with this week's events visible. Actual:
  - It opens on "October 2026" because `calAnchor` is hard-coded to `2026-10-04`. The two events this week (Wed 23 and Fri 25 Sep) are not on the grid.
  - Event bars are the only tap targets. They measure 49x6 px at 375 and 57x6 px at 430.
  - Tapping a day cell does nothing: no day view and no selection.
- **Suggested fix:** Default `calAnchor` to today, and make each whole day cell a ≥44 px target that opens that day's list.
- **Screenshot:** `shots/phonebrowser-02.png`

### PHONEBROWSER-6: Closing a create form silently discards the input
- **Severity:** major
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Tap New → Event (join if asked).
  2. Type a title, tap Next, then tap × on step 2.
  3. Reopen New → Event.
  4. Repeat with New → Event Horizon (type a name) and New → Call out (type in "Looking for").
- **Expected vs actual:** Expected either a "Discard draft?" confirmation or the draft kept on reopen. Actual: no prompt, and everything is reset. The Event title returns to "Ridge sauna, midnight", the Horizon name to empty, and the Call out to "Rigger". The form is full-screen and covers the tab bar, so × and Cancel are the only ways out, and both throw the input away. Browser Back is worse (PHONEBROWSER-1).
- **Suggested fix:** Keep one in-memory draft per create type and restore it on reopen. Ask "Discard?" only when the draft differs from the empty form.

### PHONEBROWSER-7: Home has three stacked switchers and shows the horizons twice
- **Severity:** major
- **Viewport:** 375x812, 430x932
- **Steps to reproduce:**
  1. Cold load.
  2. Read the first screen, then scroll to "Horizons worth following".
- **Expected vs actual:** Expected one clear way to narrow Home. Actual:
  - The screen stacks FEED/LIST/CALENDAR, then ALL/EVENTS/HORIZONS/CALL OUTS chips.
  - CALENDAR adds DAY/MONTH and ‹ Today ›, so that is three rows of chrome before any content.
  - The HORIZONS chip competes with the Horizons tab in the bottom bar.
  - The unlabeled 2x3 grid of horizon tiles at the top is the same six horizons as the "Horizons worth following" shelf below.
  - Leo can't tell whether the grid is a menu, a shortcut, or content.
- **Suggested fix:** Drop the filter chips (the tab bar already has Horizons, and Call outs can be a shelf). Remove or label the top tile grid so each horizon appears once.
- **Screenshot:** `shots/phonebrowser-05.png` (tiles), `shots/phonebrowser-06.png` (the same horizons as a shelf)

### PHONEBROWSER-8: "Coming up" hides the fact that it is this week
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Cold load.
  2. Look at the first event shelf.
- **Expected vs actual:** Expected "This week" with relative days (e.g. "Wed · in 3 days"). Actual: the title is "Coming up", because the code only says "Happening this week" when there are 4 or more. The first two cards are this week but show absolute dates only (Wed 23 Sep, Fri 25 Sep). The shelf then mixes in October events without a divider.
- **Suggested fix:** Title the shelf "This week" whenever at least one event qualifies, and put a "Today / Tomorrow / Wed" day label on the cards.

### PHONEBROWSER-9: Tap targets under 44 px
- **Severity:** minor
- **Viewport:** 375x812, 430x932 (same sizes at both)
- **Steps to reproduce:**
  1. Open any event and scroll through Who's going, On horizons and Links.
  2. Open New → Group chat and pick 2 people.
  3. Open search.
- **Expected vs actual:** Expected every tappable control to be at least 44 px. Measured:
  - Person chips are 38 px tall (Rio Moss 108x38, Kai Okonkwo 131x38, Anna Vale 114x38).
  - Horizon chips are 38 px tall (Season of burns 198x38, Dust & Neon 177x38).
  - Link chips are 38 px tall (burningman.org 120x38, Gates 61x38, FAQ 51x38, 2027 56x38).
  - The "Read them" link is 88x22.
  - The group-chat "Remove <name>" buttons are 24x24.
  - The phone search input is 261x40.
  - Calendar event bars are 49x6 (PHONEBROWSER-5).
  - The native radios (13x13) and checkboxes (18x18) are wrapped in full-row labels, so they are fine.
- **Suggested fix:** Raise `.chip` to `min-height: var(--ctl)` (44 px on coarse pointers), and give "Read them" and the remove-× buttons 44 px hit boxes.

### PHONEBROWSER-10: Inert chips look exactly like tappable ones
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Open Burning Man 2027 and scroll to Who's going.
  2. Tap "+ 11 more".
  3. Tap the Take part tags ("Build", "Rangers", "DPW") and the principle tags.
- **Expected vs actual:** Expected "+ 11 more" to list everyone, and tags to either act or look like plain labels. Actual: all of them are bordered boxes like the tappable person chips, and tapping them does nothing (the page text length and dialog count are unchanged). "+ 30 more" on Hyperstition 2026 is the same.
- **Suggested fix:** Make "+ N more" open the full attendee list, and render non-interactive tags without the button border.
- **Screenshot:** `shots/phonebrowser-01.png`

### PHONEBROWSER-11: A new account starts with commitments it never made
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Logged out, tap New → Event.
  2. The Join form opens with Name "Michal" and Handle "mike" already filled in.
  3. Join, then go to Home → LIST.
- **Expected vs actual:** Expected empty fields and an empty profile. Actual: someone else's name is prefilled. After joining, the new user is shown as GOING to Night kitchen line and Camp radio hour, INTERESTED in Deep Listening Lab, and HOSTING "Portable shade build".
- **Suggested fix:** Use placeholders instead of values in the Join form, and don't seed RSVPs or a hosted event on first log-in.

### PHONEBROWSER-12: Create forms are prefilled with sample content as real values
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. New → Event.
  2. New → Call out.
- **Expected vs actual:** Expected empty fields with placeholder hints. Actual:
  - The Event form arrives filled with "Ridge sauna, midnight", 24.10.2026 and "Stockholm".
  - The Call out form arrives filled with "Rigger", a full sentence of details and 30.11.2026.
  - One quick tap on "Post call out" publishes the sample. The "Welcome to Hypernet" toast also sits over the empty lower half of the Event form.
- **Suggested fix:** Move the samples into `placeholder` attributes and keep the primary button disabled until the required fields have real input.
- **Screenshot:** `shots/phonebrowser-03.png`

### PHONEBROWSER-13: Product nouns are muddled: "Cluster" and "Horizon" vs "Event Horizon"
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Search "sound".
  2. Open Anna Vale.
  3. Compare the labels.
- **Expected vs actual:** Expected only the five nouns: Event, Event Horizon, Person, Call out, Chats. Actual:
  - Search has a "CLUSTERS" section ("Baltic Circuit · Cluster · public · 3 members").
  - The person page has a "CLUSTER" section.
  - The app bar subtitle can read "Cluster".
  - Horizons are labeled "Event Horizon" in the New sheet and the app bar, but "Horizon" in row subtitles and on the event button.
  - "Baltic Circuit" is at the same time a horizon, a cluster and a host.
- **Suggested fix:** Remove "Cluster" from search and the person page, or fold it into Chats as a group chat. Use "Event Horizon" as the type label everywhere and "Horizon" only as a short button verb.
- **Screenshot:** `shots/phonebrowser-07.png`

### PHONEBROWSER-14: Horizons tab has an unexplained header and dates
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Logged out, tap the Horizons tab.
- **Expected vs actual:** Expected a plainly titled list with a clear sort order. Actual:
  - The only section is titled "MORE HORIZONS 6", with nothing above it for it to be "more" than.
  - Each row carries an unlabeled date (FRI 25 SEP, SUN 30 AUG, WED 23 SEP, WED 22 JUL, FRI 12 JUN, WED 29 APR) that is neither chronological nor explained.
- **Suggested fix:** Title the logged-out section "Popular" (or drop the header), and replace the lone date with the horizon's date range or "next: Fri 25 Sep".
- **Screenshot:** `shots/phonebrowser-08.png`

### PHONEBROWSER-15: Search dead-ends and forgets
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Home → search icon.
  2. Type "xylophone", then "this week".
  3. Then type "sound", tap the Chats tab, and tap Home.
- **Expected vs actual:** Expected a way forward on no results, and the query kept. Actual:
  - The empty-query state just shows the Home feed behind the field.
  - No results is the single line "Nothing matches 'xylophone'." with nothing to tap.
  - "this week" matches nothing.
  - Switching tabs drops the query.
  - Past events appear in results without a past marker (e.g. Hyperstition 2026, FRI 12 JUN, under "oslo").
- **Suggested fix:** On no results, show "This week" and "Popular horizons" as tappable fallbacks. Keep the query per tab, and dim or label past events in results.
- **Screenshot:** `shots/phonebrowser-09.png`

### PHONEBROWSER-16: Show all loses the view switcher
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Home → "Show all" on Coming up or Announced burns.
- **Expected vs actual:** Expected LIST/CALENDAR here too. IA-v2 says everything except people and call outs gets a calendar view. Actual: a plain list with only a back arrow. The tab bar still highlights Home, which is correct.
- **Suggested fix:** Render the same LIST/CALENDAR segmented control in Show all for event shelves.

### PHONEBROWSER-17: The New sheet can't be dismissed one-handed
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Tap New.
  2. Tap the dimmed area above the sheet.
- **Expected vs actual:** Expected the sheet to close on a tap on the scrim or a swipe down. Actual: nothing happens (the dialog count stays 1). The only exit is the × at the top right of the sheet, which is the hardest spot for a right thumb to reach.
- **Suggested fix:** Close the sheet on a tap on the mask and on a downward swipe of the sheet header.

### PHONEBROWSER-18: Event action buttons are not on one grid
- **Severity:** polish
- **Viewport:** 375x812, 430x932
- **Steps to reproduce:**
  1. Open The Borderland 2027.
- **Expected vs actual:** IA-v2 says the verbs share one baseline and height. Actual: Interested and Going are 44 px (171x44 / 173x44). Promote, Horizon and Share are 48 px (138x48 / 102x48 / 91x48), and Promote has a dashed border and a count. "Previous: 2026" is 44 px again.
- **Suggested fix:** Give all event verbs one height token and one border style.
- **Screenshot:** `shots/phonebrowser-04.png`

### PHONEBROWSER-19: Truncation and duplicated titles in rows and cards
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Search "sound".
  2. Scroll Home to Call outs.
  3. Open "SF Bay Area Decompression 2026: Oakland Edition Vol. II".
- **Expected vs actual:** Expected titles to win over metadata. Actual:
  - The right-hand date column takes about a third of each row, which cuts titles to "Looking for: Sound e…" and "Sound camp fundraiser n…".
  - Call out cards print the title twice: "LOOKING FOR Sound engineer" inside the card and "Sound engineer" as the caption.
  - The app bar cuts long event names at about 22 characters.
- **Suggested fix:** Move the date under the title on phone rows (wrap to 2 lines), and drop the caption title on call out cards.
- **Screenshot:** `shots/phonebrowser-07.png`, `shots/phonebrowser-06.png`

## Works well

- **The tab bar is solid.** It stays fixed at the bottom through every fling. The app bar always shows ‹, the item name and its type ("Event", "Person", "Call out"). The active tab stays correct in nested views and Show all, so Leo never wonders where he is.
- **The shelves feel native.** They use `scroll-snap: x mandatory` with a 16 px inset and a clear peek of the next card (the third card shows about 35 px at 375). A fast sideways fling snaps cleanly. A diagonal swipe scrolls the shelf without scrolling the page. A drag of about 20 px or more never opens a card by accident.
- **Log-in picks up where you left off.** Tapping Interested while logged out opens Join, and after Join the RSVP is applied with a toast. New → Event continues straight into the wizard. The LIST view's "THIS WEEK / THIS MONTH" buckets are the fastest, clearest answer to "what can I go to".
