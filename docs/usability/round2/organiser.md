# Usability test, round 2: organiser (Jonas, theme camp lead)

I tested the frozen snapshot on 2026-09-24 in headless Chromium at three sizes: 1440x900, 375x812 (touch, Android UA) and 768x1024 (touch). I drove every step with real clicks and taps, typing, the right-click menu, a CDP long-press, reloads and browser back/forward. I started from a fresh account on each viewport and did not use the demo account. There were no console errors, no page errors and no 4xx responses on any viewport.

## Verdict

**Yes: Jonas can now do all seven goals on desktop and on the phone, and nothing blocks him.** Round 1 had two blockers and ten majors. This round has no blockers and two majors, and 20 of the 21 round-1 findings are fixed.

Create is where you'd expect it. The owner's page leads with Edit · Customize. Call outs attach to the event, and everything survives a reload. The phone flow is the smoothest part: from the event's ⋯ → Add to horizon → New Event Horizon… he makes the horizon and files the event without leaving the page.

What still hurts:

- **Sharing a private horizon fails silently.** A newly created horizon is private and offers Share. The link it gives out drops everyone else on Home with no message. Publish only appears once the horizon has events.
- **On desktop and tablet the horizon isn't its own place.** Its page is complete (cover, mood, owner actions, tracks), but it opens as the detail pane of whatever list you were on. It sits under a "Hosting · 1 event" or "Home · FEED/LIST/CALENDAR" header, and the sidebar highlights two rows. On the phone it does feel like its own thing.

## Round-1 re-check

| ID | Status | Evidence |
|---|---|---|
| ORGANISER-1 | FIXED | Owner page has Edit, which opens the full wizard filled in; "Save changes" moved 17–18 Oct to 24–25 Oct, and the change survived a reload. |
| ORGANISER-2 | FIXED | Horizon Share → Copy link put `…/#/horizon/mine-mueta0rb` on the clipboard. Logged out, that link opens the themed page with Follow and Share. See R2-1 for the private case. |
| ORGANISER-3 | FIXED | The full playlist page (cover, actions, tracks, no self-row) renders at 768, at 1440 and at 1440 with Chats open. The surrounding context is still wrong (R2-2). |
| ORGANISER-4 | FIXED | Event, horizon and call out forms open empty with placeholders only. "Post call out" is disabled until named, and the wizard shows "Add a title" and "Add a start date" inline. |
| ORGANISER-5 | FIXED | "Dust and gold" and "Photocopied flyer" both left "sawdust, sun, and a long lunch" untouched. |
| ORGANISER-6 | FIXED | The phone Look step pins the square, headline and mood preview at the top while the controls scroll under it. The same holds for horizon Customize. |
| ORGANISER-7 | FIXED | "need 2 builders for Saturday" is still on Home and on the event page after a reload. |
| ORGANISER-8 | FIXED | "New call out" sits on the owner's event page, in the ⋯ sheet and in the context menu, with the event preselected. The event lists the call out, and the call out links back under "For". |
| ORGANISER-9 | FIXED | Hash routes: back went horizon → event → horizon → Home, forward restored it, and reload reopened the horizon on both viewports. |
| ORGANISER-10 | FIXED | Host row is Edit · Customize · Promote · Add to horizon · Share · ⋯ on one line at 1440. On phone the sticky bar is Edit · Customize · ⋯ (48px). |
| ORGANISER-11 | FIXED | Horizon actions are labelled "Customize" and "Edit details". |
| ORGANISER-12 | FIXED | New Event Horizon has Name, Description, Publish it and a single "Create horizon", which lands on the page with "Event Horizon created". There is no cover picker in it. |
| ORGANISER-13 | FIXED | Fresh Jonas has empty Going, Interested and Hosting. Hosting says "You are not hosting anything yet." with a New event button. |
| ORGANISER-14 | FIXED | × toasts "Removed from Driftwood crew season · Undo". Targets are 44x44 on phone. |
| ORGANISER-15 | PARTIAL | The published horizon leads "Event Horizons worth following" (logged out) and "Your Event Horizons" (logged in) on both devices. Desktop Home is still rows, so a horizon looks like an event row. |
| ORGANISER-16 | FIXED | Toolbar reads "Join / Log in" until an account exists, then "Log in", where the account row signs you in with one tap. The sidebar duplicate is gone. |
| ORGANISER-17 | FIXED | Picker opens with "YOUR EVENTS: Camp Driftwood build weekend · Hosting" above "ALL EVENTS", and the button reads "Add 4 events". |
| ORGANISER-18 | FIXED | A scan of Home, the New horizon dialog, the wizard and the picker found no instruction strings. "One item per line", "optional" and the Home subtitle are gone. |
| ORGANISER-19 | FIXED | Call out title shows as typed. The author sees Edit / Close call out instead of Answer. |
| ORGANISER-20 | FIXED | Scrolled Home 1500px, tapped Horizons, and the list opened at scrollTop 0. |
| ORGANISER-21 | FIXED | Step tabs are clickable in both New and Edit. Jumping to Look → Publish with no date bounces back to Basics with "Add a start date". |

## New findings

### ORGANISER-R2-1: Share is offered on a private horizon, and its link silently drops people on Home
- **Severity:** major
- **Viewport:** all
- **Steps to reproduce:** New → Event Horizon → name it, leave "Publish it" unticked → Create horizon. On its page, click Share → Copy link, or send it to Anna in a chat. Log out (or open the link on any other account) and paste the link.
- **Expected vs actual:** Expected one of two things: a private horizon offers Publish instead of Share, or the link opens a "This Event Horizon is private" page. Actual: the owner's row is Add events · Customize · Edit details · **Share** · ⋯ with no Publish anywhere. It isn't in Edit details, ⋯ or the right-click menu, because Publish only appears after at least one event is added. The copied link rewrites to `#/home` for everyone but the owner, with no message. "Send in a chat" sends the same dead link. The same silent redirect happens for any horizon link the viewer can't see.
- **Suggested fix:** Always show Publish on a private horizon, empty ones included, and hide Share until it's published. Give unavailable links a "This Event Horizon is private or gone" page with a Home button instead of redirecting.
- **Screenshot:** shots/organiser-01.png

### ORGANISER-R2-2: On desktop and tablet the horizon opens as a detail of another list, not as its own place
- **Severity:** major
- **Viewport:** 1440x900, 768x1024
- **Steps to reproduce:**
  - At 1440, from Hosting, click "Driftwood crew season" in the sidebar under Your horizons.
  - Then go Home and click it again.
  - At 768, open the horizon's link cold.
- **Expected vs actual:** Expected the horizon to be the destination: its name in the title bar and the header, its tracks as the list, one row lit in the sidebar. Actual:
  - At 1440 the horizon page sits in the reading pane beside an unrelated list. The header reads "Hosting · 1 event" with Sort and LIST/CALENDAR, or "Home" with FEED/LIST/CALENDAR, and the window title is "— Hosting" or "— Home".
  - The sidebar highlights both "Hosting" (or "Home") and the horizon.
  - At 768 the page is stacked under a "Home" header with FEED/LIST/CALENDAR and a "Back · Home" crumb.

  The view switchers belong to the list above and do nothing for the horizon. Because of this the horizon reads as a detail inside Home, not as a playlist Jonas owns.
- **Suggested fix:** Opening a horizon from the sidebar, a card or a link should make it the centre destination at every width: header = horizon name, list = its tracks, reading pane = the selected track, and only the horizon's own sidebar row lit.
- **Screenshot:** shots/organiser-02.png, shots/organiser-03.png

### ORGANISER-R2-3: The right-click menu and long-press sheet on a horizon's track have no "Remove from horizon"
- **Severity:** minor
- **Viewport:** 1440x900 (right-click), 375x812 (long-press)
- **Steps to reproduce:** Open your own horizon → right-click a track (desktop), or long-press it (phone).
- **Expected vs actual:** Expected "Remove from Driftwood crew season" at the top of the menu, since that's the owner's main verb in this context. Actual: the menu has only Open, Interested, Going, Promote, Add to horizon ▸ and Share…. The only menu route to removal is **Add to horizon ▸** → untick the horizon: three levels deep, under a label that says "Add". The × on the row works, but the menu the persona reaches for doesn't.
- **Suggested fix:** When the menu is opened on a track inside a horizon you own, add "Remove from ‹horizon›" (with the Undo toast) as the first item after Open.
- **Screenshot:** shots/organiser-04.png, shots/organiser-05.png

### ORGANISER-R2-4: A new event can't be given a type or times, so a build weekend is labelled "Meetup"
- **Severity:** minor
- **Viewport:** all
- **Steps to reproduce:** New → Event → fill Basics / Words / Look → Publish. Look at the kicker and the Home row.
- **Expected vs actual:** Expected to pick "Build" (the fixtures use Build, Workshop, Volunteer day, Burn) and to set start and end times, since fixture events show "06:40–07:10" and shifts. Actual: Basics has only Title, Starts/Ends as dates, Where, Who can see it and Entry. Every created event is kicked "MEETUP · PUBLIC", shows no type in rows ("You · Berlin"), and has no time.
- **Suggested fix:** Add a "Type" select and optional start/end time inputs to step 1, and use the type in the kicker and row subtitle.
- **Screenshot:** shots/organiser-06.png

### ORGANISER-R2-5: Search only matches exact phrases, so "baltic build" finds nothing
- **Severity:** minor
- **Viewport:** all
- **Steps to reproduce:** Horizon → Add events → type "baltic build". Also try the same query in the toolbar search.
- **Expected vs actual:** Expected "Baltic Circuit build weekend". Actual: the picker shows "Nothing matches." and global search shows "0 results for 'baltic build'". Only a contiguous substring ("baltic") works, which is the wrong fit for curating by memory.
- **Suggested fix:** Split the query on spaces and match rows that contain every word, in any field, in any order.
- **Screenshot:** shots/organiser-07.png

### ORGANISER-R2-6: A call out can't be shared, and posting one from the event jumps to the Home tab
- **Severity:** minor
- **Viewport:** all (the tab jump happens on 375x812)
- **Steps to reproduce:** On phone, You → Hosting → your event → New call out → Post call out. Then look for a way to send it to the crew's group chat outside Hypernet.
- **Expected vs actual:** Expected Share / Copy link on the call out, the same as events and horizons (a `#/callout/…` route exists), and to stay in the You tab. Actual: the call out page offers only Edit and Close call out, with no link to copy. After posting, the tab bar switches to Home. Back returns to the event, but the tab lights up You again.
- **Suggested fix:** Add Share (the same dialog, with Copy link) to the call out page and its menu, and open the new call out inside the tab you posted from.

### ORGANISER-R2-7: Mood and Look each have two edit routes
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** New → Event → step 2 "Mood line" → step 3 Look, which has its own "Mood" field. On the owner page, compare Edit → "3 · Look" with Customize.
- **Expected vs actual:** Expected one field per fact. Actual: mood is editable in both wizard steps. The whole Look panel is reachable both as Edit's third tab and as the separate Customize button, so two owner buttons lead to the same controls.
- **Suggested fix:** Keep Mood only on the Look step, and make Edit two tabs (Basics, Words), leaving Look to Customize.
- **Screenshot:** shots/organiser-08.png

### ORGANISER-R2-8: The desktop horizon Customize preview hides the horizon page below the fold
- **Severity:** polish
- **Viewport:** 1440x900
- **Steps to reproduce:** Your horizon → Customize → change palette or cover.
- **Expected vs actual:** Expected to see the horizon page react. Actual: the preview box shows Cover and Card. The "HORIZON PAGE" label sits at the box's bottom edge (y≈571 of a box ending at 596), and the page preview is only reachable by scrolling inside the preview box, with no visible scrollbar.
- **Suggested fix:** Put the horizon-page preview first in the preview box (cover and card below it), or give the preview box a visible scrollbar.
- **Screenshot:** shots/organiser-09.png

### ORGANISER-R2-9: Empty sections still show their headings on a new event
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** Publish an event without a Bring list and open it.
- **Expected vs actual:** Expected empty sections to be omitted. Actual: "WHO'S GOING" (always, for a new event) and "BRING" (when left empty) render as headings with nothing under them.
- **Suggested fix:** Skip a section when it has no content.
- **Screenshot:** shots/organiser-10.png

### ORGANISER-R2-10: Phone horizon rows truncate your own event, and the Horizons list says "1 events"
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Horizons tab → your horizon with one event.
- **Expected vs actual:** Expected the full title. Actual:
  - The track reads "Camp Driftwo…" and "Sat 17 Oct · Berlin …", because the HOSTING badge and the × take half the row. C5's two-line titles don't apply to tracks.
  - The Horizons list row reads "Jonas Berg · 1 events".
- **Suggested fix:** Let track titles wrap to two lines on phone and move HOSTING under the title. Pluralise "event" correctly.
- **Screenshot:** shots/organiser-11.png

### ORGANISER-R2-11: "This month" means "within 31 days"
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** Create an event on 17 Oct (the app's today is 23 Sep) → Hosting. Then Edit it to 24 Oct.
- **Expected vs actual:** Expected September events under "This month" and October under "Later" or "October". Actual: 17 Oct is filed under "THIS MONTH". Moving it a week later relabels it "LATER".
- **Suggested fix:** Use calendar bands ("This week", "Later in September", "October", …), or rename the band "Next 30 days".

### ORGANISER-R2-12: A toast covers the phone's sticky action bar right after Publish or Save
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Publish an event, or Save changes, on phone.
- **Expected vs actual:** Expected the Edit · Customize bar to stay usable. Actual: the "Published" toast sits over the bar for about 3 seconds, which is exactly when the host wants to tap Customize or ⋯.
- **Suggested fix:** On pages with the sticky bar, place toasts above the bar.
- **Screenshot:** shots/organiser-12.png

### ORGANISER-R2-13: Horizon membership and order are hard to read
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** On an event page, click Add to horizon → tick your horizon → Done. Then open the horizon.
- **Expected vs actual:** Expected the button to show the new state, and numbered tracks to be in an order Jonas can set. Actual:
  - The button still reads "Add to horizon" with no check or count. Membership shows only in "On Event Horizons" far down the page.
  - Tracks are numbered 1–N like a playlist but always sorted by date. A newly added track jumps to its date slot, and there is no way to reorder.
- **Suggested fix:** Label the button "On 1 horizon ✓" when the event is filed. Either allow drag or "Move up/down" on owned horizons, or drop the numbers.

## Works well

- **The phone route from event to horizon is one flow.** ⋯ → Add to horizon → New Event Horizon… creates the horizon, files the event, toasts "Added to…" and leaves Jonas on his event. Horizon Customize on the phone shows a pinned live preview that includes his mood line.
- **Owner verbs are the same everywhere.** The page's action row, the phone's sticky bar, the ⋯ sheet, the right-click menu and the long-press sheet all offer Edit…, Customize…, New call out… and Delete…. Delete confirms once and states the consequence ("It leaves Hypernet, every horizon it is on and everyone's lists").
- **State survives.** Hash URLs, reloads and back/forward all held on every viewport: event edits, looks, the horizon's cover, palette and mood, publish state, removals with Undo, and the call out tied to its event.
