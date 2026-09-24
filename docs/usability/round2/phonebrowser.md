# Usability test, round 2: impatient phone browser (Leo)

I tested the frozen snapshot on 2026-09-24 in headless Chromium with touch emulation, at 375x812 and 430x932. I drove it with real taps, CDP touch flings (fast, 30–80 ms), long-presses, OS back/forward and reloads. The fixture's "today" is Sun 20 Sep 2026.

Port 8944 was already held by another process (`node driver.js`), so I served the same snapshot on 8964. localStorage starts empty per test context.

## Verdict

**Yes. Leo can now do everything he came for, and it is far less painful than in round 1.** The five things that hurt most in round 1 are all fixed:
- OS Back
- Reload
- Scroll memory
- The event action bar
- Lost drafts

The event verbs now sit in a thumb-reach bar. Back, forward and reload land him exactly where he was, including the horizontal shelf offset. The remaining problems are smaller and sit around the edges:
- A one-tap **Discard** has taken over the old Cancel spot.
- The chat create form still forgets its input.
- The calendar's DAY mode ignores the day you picked.
- A few time labels ("This week", "This month") don't match what's under them.

**Measured: cold load to "an event this week I could go to"**
- DOMContentLoaded: 70 ms at 375, 80 ms at 430 (localhost). The first shelf rendered at about 150 ms.
- **1 tap.** The first shelf is now titled "This week", and its cards read "Wed · in 3 days". The first card sits at 246–439 px, well above the tab bar (747 at 375, 867 at 430). Tap to event: under 100 ms.
- Round 1 needed 1 tap plus knowing today's date, or 2 taps via LIST.

**Horizontal overflow: none.** `scrollWidth` equalled the viewport on every screen at both sizes. I swept 55 routes, scrolling each one to the bottom: Home (FEED/LIST/CALENDAR), Show all, Horizons, search, People, all 36 events, all 7 horizons, both call outs and person pages. I also checked every create form, the Join sheet, the long-press sheet and the Share dialog.

**Tap targets under 44 px: none in the DOM** at either size. That covers the same sweep plus the dialogs. Person, horizon and link chips are 44 tall, the search input is 261x44, chip-remove × is 44x44, calendar cells are 54x57, and "Read them" is 90x44. The only exception is the browser's native search-clear glyph, about 12 px (R2-12).

**Console errors: none.** No failed requests either.

## Round-1 re-check

| ID | Status | Evidence |
|---|---|---|
| PHONEBROWSER-1 Back leaves site | FIXED | OS back from an event returns to `#/home`. Sheets and dialogs take their own history entry, and closing them (scrim, ×, swipe, item) leaves no dead Back press. |
| PHONEBROWSER-2 Reload loses place | FIXED | Burning Man scrolled to 1365, then reload: same event at 1365. `?view=list` and `?view=calendar&day=2026-09-23` also survive reload. |
| PHONEBROWSER-3 No sticky action bar | FIXED | Interested / Going / ⋯ (151x48, 149x48, 48x48) are pinned above the tab bar on the 5,260 px Burning Man page and on every other event. |
| PHONEBROWSER-4 Scroll thrown away | FIXED | (a) Shelf 972 and list 185 are restored after Back. (b) Home 385 is kept across a Horizons tab round-trip. (c) Event at 4632 is restored after Anna Vale → Back. Reload also restores the shelf offset. |
| PHONEBROWSER-5 Calendar wrong month, untappable | FIXED | Opens on September 2026. Whole day cells (54x57) list that day under the grid. DAY mode has a new bug (R2-3). |
| PHONEBROWSER-6 Closing a form discards input | PARTIAL | Event, Event Horizon and Call out drafts survive ×, OS back and reload. However, the chat form forgets everything (R2-2), and the new Discard button deletes in one tap with no undo (R2-1). |
| PHONEBROWSER-7 Three stacked switchers | PARTIAL | Chips and the unlabelled tile grid are gone; FEED/LIST/CALENDAR is the only switcher on FEED. CALENDAR still stacks 3 control rows (switcher, month nav, DAY/MONTH), and the grid starts at y=228 of 747 usable (`shots/phonebrowser-06.png`). |
| PHONEBROWSER-8 "Coming up" hides this week | FIXED | The first shelf is "This week", with "Wed · in 3 days" and "Fri · in 5 days". |
| PHONEBROWSER-9 Tap targets under 44 px | FIXED | The 55-route sweep found no DOM target under 44 px at 375 or 430. Only the native search-clear glyph remains (R2-12). |
| PHONEBROWSER-10 Inert chips look tappable | PARTIAL | "+ 11 more" is now plain text ("and 11 more"). The Take part tags are filled, not outlined, but are still 44 px button-sized blocks (Rangers 75x44) that do nothing on tap. |
| PHONEBROWSER-11 New account has commitments | FIXED | Join opens blank ("Your name", "@yourname" placeholders), with "Try the demo account" on top. The fresh You tab has no Going, Interested or Hosting items. |
| PHONEBROWSER-12 Sample values in forms | FIXED | Event, Horizon, Call out and Chat forms open empty. Post call out and Create horizon stay disabled until named, and Next says "Add a start date". |
| PHONEBROWSER-13 Muddled nouns | FIXED | No "Cluster" anywhere. Rows say "Event Horizon", the person page says "Published Event Horizons", and the event menu says "Add to horizon…". |
| PHONEBROWSER-14 Horizons tab header/dates | FIXED | The section is "POPULAR 6", and rows read "NEXT FRI 9 OCT". |
| PHONEBROWSER-15 Search dead-ends and forgets | FIXED | No results now shows This week and Popular Event Horizons to tap. The query survives opening a result and switching tabs, "this week" and "sweden" match, and past results carry a PAST pill. The fallback's label is wrong (R2-4). |
| PHONEBROWSER-16 Show all loses switcher | FIXED | Show all has LIST / CALENDAR (and survives reload as `#/home/soon?view=calendar`). |
| PHONEBROWSER-17 New sheet not dismissable | FIXED | A scrim tap, a 180 px swipe down on the title bar, and OS back each close it. |
| PHONEBROWSER-18 Verbs not on one grid | FIXED | Every bar verb is 48 px tall with the same border. Promote moved into ⋯. |
| PHONEBROWSER-19 Truncation / duplicated titles | FIXED | Rows use 2 lines with the date underneath. The app bar shows "SF Bay Area Decompression 2026: Oakland Edition Vol. II" in full on 2 lines. Call-out cards show the title once. The city on Home cards is still clipped (R2-11). |

## New findings (round 2)

### PHONEBROWSER-R2-1: "Cancel" turns into a one-tap "Discard" in the same spot
- **Severity:** major
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Join, then New → Event.
  2. Type a title, tap ×, then reopen New → Event. The draft is back.
  3. Tap the bottom-left button, where "Cancel" was a moment ago.
  4. Repeat with New → Event Horizon and New → Call out.
- **Expected vs actual:**
  - Expected: the thumb's usual "get me out" button is safe, and losing typed work needs a confirmation or offers Undo.
  - Actual: as soon as anything is typed, the bottom-left button changes from "Cancel" to "Discard" at the same size and position (172x44, centred at 98,778). One tap wipes the draft with no confirmation and no toast. Reopening shows an empty form.
  - By contrast, deleting a published event asks first ("Delete event … Cancel / Delete event").
  - Also, a restored draft opens with the title focused and fully selected, so the first keystroke replaces it.
- **Suggested fix:** Keep "Cancel" (it keeps the draft) in the thumb spot, move Discard into the ⋯ or the header, and show a "Draft discarded · Undo" toast. Place the caret at the end of a restored title instead of selecting it.
- **Screenshot:** `shots/phonebrowser-01.png` (restored draft with selected title and Discard where Cancel was)

### PHONEBROWSER-R2-2: New chat forgets the people you picked and the group name
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Join, then New → Chat.
  2. Tick Anna Vale and Rio Moss, and type "Leo crew" as the Group name.
  3. Tap × (or use OS back), then reopen New → Chat.
- **Expected vs actual:**
  - Expected: the draft is kept, the same as the other three create forms. FIX-PLAN A3 says group chat keeps a draft.
  - Actual: the form comes back empty, with no picks, no name, and "Start chat" disabled. The bottom button stays "Cancel" the whole time, so nothing signals that the input will be lost.
- **Suggested fix:** Store picked people and the group name in the same per-account draft as the other forms.
- **Screenshot:** `shots/phonebrowser-02.png` (before × / after reopen)

### PHONEBROWSER-R2-3: Calendar DAY mode ignores the picked day, and Back skips the calendar
- **Severity:** minor
- **Viewport:** 375x812, 430x932
- **Steps to reproduce:**
  1. Home → CALENDAR, then tap Fri 25. The URL is `…&day=2026-09-25`, and Night kitchen line is listed.
  2. Tap DAY.
  3. Separately: Home → CALENDAR → tap 23 → tap 25 → OS back.
- **Expected vs actual:**
  - Expected: DAY shows Fri 25 Sep, and Back steps back to the month calendar.
  - Actual: DAY shows "Sun 20 Sep 2026 · Nothing on Sun 20 Sep 2026." above an empty 08:00–23:00 grid, while the URL still says `day=2026-09-25`. There is no link to the next day that has something.
  - Picking a day replaces the history entry, so one Back from a picked day skips the calendar and lands on FEED.
  - On phone, DAY also duplicates what tapping a day already does, and it adds a third row of controls (see PHONEBROWSER-7).
- **Suggested fix:** Drop the DAY/MONTH toggle on phone (the day tap is the day view). If it stays, open it on the picked day with a "Next: Wed 23 Sep" link, and push history when a day is picked.
- **Screenshot:** `shots/phonebrowser-03.png`

### PHONEBROWSER-R2-4: "This week" and "This month" don't match what's under them
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Search "xylophone" (or "weekend").
  2. Look at the fallback's THIS WEEK section.
  3. Then open Home → LIST.
- **Expected vs actual:**
  - Expected: one definition of "this week" everywhere. Home's shelf, the LIST bucket and the "this week" query all show 2 events (Wed 23, Fri 25).
  - Actual:
    - The no-results fallback's "THIS WEEK" lists 4 events, including Mon 28 Sep and Thu 1 Oct.
    - LIST's "THIS MONTH 13" (on 20 Sep) runs to Wed 21 Oct.
  - Leo trusts the label and ends up looking at next week's events.
- **Suggested fix:** Use the Home "This week" helper for the search fallback, and rename the LIST bucket to "Next 30 days" (or cut it at the month end).
- **Screenshot:** `shots/phonebrowser-04.png`

### PHONEBROWSER-R2-5: The view switcher moves under the thumb in LIST
- **Severity:** minor
- **Viewport:** 375x812 (430 is the same)
- **Steps to reproduce:**
  1. Cold load (FEED).
  2. Tap LIST.
  3. Tap where FEED was to go back.
- **Expected vs actual:**
  - Expected: the three segments stay put.
  - Actual: LIST prepends a "Date" sort select (74x44), so the segments shrink and slide right.
    - FEED goes from x 10–128 to 94–184.
    - LIST goes from 128–246 to 185–274.
    - CALENDAR goes from 247–365 to 275–365.
  - A fast tap where FEED used to be (x≈69) now lands on the Date select instead. CALENDAR and Show all have no select, so the row changes shape on every switch.
- **Suggested fix:** Move the sort select out of the segment row (into the first section header of LIST), so FEED/LIST/CALENDAR are identical in every view.
- **Screenshot:** `shots/phonebrowser-05.png` (FEED vs LIST, same row)

### PHONEBROWSER-R2-6: A link to a deleted or mistyped item silently lands on Home
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. As the demo account, open Portable shade build → ⋯ → Delete… → Delete event.
  2. Open its old link `#/event/portable-shade-build` (the same thing a friend would tap in a chat after Copy link). Also try `#/event/the-borderland-2027` or `#/callout/0`.
- **Expected vs actual:**
  - Expected: "This event was removed" (or "Not found") with a way back.
  - Actual: the URL is rewritten to `#/home` and Home FEED shows, with no message. Leo thinks the link was wrong or the tap missed.
  - This matters more now that Share → Copy link and owner Delete both exist.
- **Suggested fix:** Render a small "This event is no longer on Hypernet" page in the centre, with Back and Home buttons, instead of redirecting.

### PHONEBROWSER-R2-7: An Event Horizon opens on its past events
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Horizons tab → Season of burns.
- **Expected vs actual:**
  - Expected: the next thing he can go to is visible.
  - Actual:
    - The first three tracks are 2026 events that already happened (Čarodění 29 Apr, Vårlys 27 May, Schönburn 5 Aug, dimmed). The first upcoming one (#4 Zurich, 9 Oct) is below the fold at 375.
    - The header range "Wed 29 Apr – Sun 29 Aug 2027" drops the start year, so it reads as April 2027.
    - Follow/Share scroll away, while events keep a sticky bar.
- **Suggested fix:** Collapse past tracks behind a "Past · 3" row (or start the list at the next upcoming track), and print both years in the range.
- **Screenshot:** `shots/phonebrowser-07.png`

### PHONEBROWSER-R2-8: A fresh account's Chats tab is a blank screen
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Join as a new user.
  2. Tap the Chats tab.
- **Expected vs actual:**
  - Expected: an empty state with a way forward within thumb reach.
  - Actual: a white page. The only control is "New chat" in the top-right of the app bar, the hardest spot for a right thumb. Logged out, the same tab shows an icon, a line of copy and a centred button, so the logged-in empty state is worse than the logged-out one.
- **Suggested fix:** Show a centred "New chat" button plus the people you follow (or "People on Hypernet") as one-tap DM rows.
- **Screenshot:** `shots/phonebrowser-08.png`

### PHONEBROWSER-R2-9: Event pages say the same fact two or three times
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Open Burning Man 2027.
  2. Open Ridge dawn stretch.
- **Expected vs actual:**
  - Expected: each fact once, which keeps a 5,000 px page shorter for a fast scroller.
  - Actual:
    - Burning Man shows "ENTRY · Ticket · 550–3,000 USD" in the Entry block and again in the fact grid, one screen apart.
    - Ridge dawn stretch says Free three times (fact "ENTRY Free", then a section "ENTRY · FREE · Free to come.").
    - HOST appears in the fact grid as plain, untappable text, and again at the bottom as a tappable "Hosted by" chip.
    - Burning Man ends with a "FROM THE EVENT'S OWN PAGES" heading with nothing under it.
- **Suggested fix:** Drop the ENTRY tile when an Entry block exists, make the HOST tile the tappable person or host link and remove the bottom "Hosted by", and delete the trailing caption.

### PHONEBROWSER-R2-10: Row titles switch between bold and regular with no visible reason
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Cold load, logged out.
  2. Open Home → LIST (or Show all).
- **Expected vs actual:**
  - Expected: one title weight, or a visible meaning.
  - Actual: "Ridge dawn stretch" and "Portable shade build" are regular weight while every other row is bold. This is the Outlook read/unread convention, but a first-time visitor has read nothing, and nothing explains it. Leo reads the regular ones as less important.
- **Suggested fix:** Drop read/unread weight on phone (and for logged-out users), or add an unread dot instead of changing the title weight.
- **Screenshot:** `shots/phonebrowser-05.png` (right half)

### PHONEBROWSER-R2-11: Home cards clip the city even at 430
- **Severity:** polish
- **Viewport:** 375x812, 430x932
- **Steps to reproduce:**
  1. Cold load.
  2. Read the meta line under the This week and Announced burns cards.
- **Expected vs actual:**
  - Expected: the place is readable.
  - Actual:
    - "Wed · in 3 days · Osl…", "Fri · in 5 days · Got…", "Mon 26 Apr +6d · Tank…", "Mon 24 May +7d · Newt…".
    - Cards are a fixed 150 px at both widths, so the extra 55 px at 430 only shows more of the third card.
- **Suggested fix:** Put the day on line 1 and the city on line 2 of the card meta.
- **Screenshot:** `shots/phonebrowser-05.png` (left half)

### PHONEBROWSER-R2-12: Search can only be cleared with a tiny native ×
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Home → search.
  2. Type "xylophone".
  3. Try to clear the field.
- **Expected vs actual:**
  - Expected: a 44 px clear control.
  - Actual: the only clear control is Chromium's built-in `type=search` cancel glyph, about 12x12 px at the right edge of the field. It isn't in the DOM, so the regression scan can't see it. The other option is holding backspace.
- **Suggested fix:** Hide the native cancel button and render a 44x44 "Clear" icon button inside the field when it has text.
- **Screenshot:** `shots/phonebrowser-04.png` (top right of the field)

### PHONEBROWSER-R2-13: The host's menu says "Add to horizon" and the guest's says "Add to horizon…"
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. As the demo account, open Portable shade build → ⋯.
  2. Compare with Burning Man 2027 → ⋯ (or a long-press on any card).
- **Expected vs actual:**
  - Expected: the same label everywhere.
  - Actual: the host sheet reads "Add to horizon" with no ellipsis, while the guest sheet and long-press sheet read "Add to horizon…". Both open a picker.
- **Suggested fix:** Use "Add to horizon…" in the host sheet too.

## Works well

- **Back, reload and place memory are now excellent.** Every open, Show all, search, view and calendar day is a hash route. OS back walks the stack exactly, and closing a sheet never leaves a dead Back press. Reload and tab round-trips restore the list, the reading pane and each shelf's horizontal offset: 972 px and 324 px came back to the pixel.
- **The sticky event bar and the sheets suit one-handed use.**
  - Interested / Going / ⋯ sit 48 px tall just above the tab bar, in the event's colours.
  - ⋯ and a 500 ms long-press open the same bottom sheet: Open, Interested, Going, Promote, Add to horizon…, Share….
  - The sheets close by scrim tap, a swipe down or Back.
  - Share → Copy link gives "Link copied" and the real `#/event/…` URL.
  - A gated Going continues after "Try the demo account" and confirms "Going · Night kitchen line".
- **Shelves still feel native, and "This week" answers Leo's question in one tap.** Mandatory snap with a 16 px inset moves 2 cards per 180 px fling. A slow drag of 200 px never fires the long-press, and a vertical flick that starts on a card never opens it.
