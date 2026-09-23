# Usability test: organiser (Jonas, theme camp lead)

Frozen snapshot, tested 2026-09-24 in headless Chromium at 1440x900, 375x812 (touch) and 768x1024 (touch). Every flow was driven with real clicks and taps, reloads and back navigation. The only console error was a `favicon.ico` 404. There were no JS errors.

## Verdict

Jonas gets through most of his job, and on the phone it mostly feels good. Two goals fail outright. He **cannot edit an event after publishing it**: only its look can be changed. He also **cannot share his horizon**: there is no Share on a horizon, and nothing in the app has a URL.

- **Create:** easy to find. New sits in the toolbar and in the phone tab bar, and a logged-out user who taps New goes through Join and lands straight back in the wizard.
- **Customize:** also easy to find, but the phone preview is off-screen, and a preset silently overwrites text he wrote.
- **Add-to-horizon:** works from both directions.
- **Horizon as its own thing:** on the phone it is (big cover, themed page, list of tracks). On desktop it breaks apart into a folder. At 768px, or at 1440px with Chats open, the cover and every owner action disappear.
- **Call outs:** can be posted, but they vanish on reload and can't be attached to the event they're for.

## Findings

### ORGANISER-1 — Published events can't be edited
- **Severity:** blocker
- **Viewport:** all
- **Steps to reproduce:** New → Event → publish "Camp Driftwood build weekend" → open it again from Hosting.
- **Expected vs actual:** Expected an Edit action to fix the title, date, place, description or entry. Actual: the only owner action is Customize, which reopens the Look step alone (no title or date fields). There is no delete either, so a wrong date is permanent.
- **Suggested fix:** Add an "Edit" button next to Customize on the owner's event page that reopens the wizard at step 1 with Apply (steps become clickable tabs in edit mode).
- **Screenshot:** shots/organiser-01.png

### ORGANISER-2 — A horizon can't be shared, and nothing has a link
- **Severity:** blocker
- **Viewport:** all
- **Steps to reproduce:** Open your published horizon → look for Share. Then open an event → Share.
- **Expected vs actual:** Expected Share on the horizon, including a copyable link for the crew's group outside Hypernet. Actual: the horizon has only Add events / Publish / Rename / Customize. Event Share only lists in-app chats. The URL stays `/` everywhere, so there is no link to copy by hand either.
- **Suggested fix:** Add a Share button to the horizon's action row that opens the same sheet as event Share, plus a "Copy link" row backed by a `#/horizon/<id>` route.

### ORGANISER-3 — On desktop the horizon falls apart into a folder
- **Severity:** major
- **Viewport:** 768x1024, and 1440x900 with Chats open (any width where the centre is under 860px)
- **Steps to reproduce:** Open your own horizon from the sidebar at 768px, or at 1440px after clicking Chats.
- **Expected vs actual:** Expected the horizon's own page: cover, mood, owner, Add events, Publish, Customize. Actual: a plain monochrome list headed "EVENT HORIZON 1" that contains the horizon *as a row inside itself*, followed by its events. There is no cover and no owner action until you click that self-row. In the 1440 split view the header sits in the reading pane with an empty themed void below it, and the events sit unthemed in the middle list.
- **Suggested fix:** When a horizon folder is opened, render the full playlist page (cover, actions, tracks) in the centre at every width, and drop the self-row from its list.
- **Screenshot:** shots/organiser-02.png, shots/organiser-03.png, shots/organiser-10.png

### ORGANISER-4 — Create forms come prefilled with sample content that gets published
- **Severity:** major
- **Viewport:** all
- **Steps to reproduce:** New → Event, or New → Call out.
- **Expected vs actual:** Expected empty fields, with sample text only as placeholders. Actual: the event wizard opens as "Ridge sauna, midnight", Stockholm, 24 Oct, with a description, mood and bring list already filled in. The call out opens as "Rigger" with a body about "the truss on the Friday build". On desktop I changed only the call out title and posted it: the sample body went live under Jonas's name. Sign-up also prefills name "Michal" and handle "@mike".
- **Suggested fix:** Start every create form empty (placeholders only) and disable the primary button until the required fields are filled.
- **Screenshot:** shots/organiser-05.png, shots/organiser-06.png

### ORGANISER-5 — A preset silently overwrites the mood line from step 2
- **Severity:** major
- **Viewport:** all
- **Steps to reproduce:** In the New event wizard, type Mood line "sawdust, sun, and a long lunch" in step 2 → step 3 Look → tap preset "Dust and gold" (or "Photocopied flyer").
- **Expected vs actual:** Expected the preset to change the visuals only. Actual: Mood becomes "the big one. dust, and then more dust." Jonas's own words are gone with no warning, and it happens on both desktop and phone.
- **Suggested fix:** Presets set palette, surface, type, headline, motion, shape, density and square only, and never touch the mood field.
- **Screenshot:** shots/organiser-07.png

### ORGANISER-6 — Phone Look step: the preview is below the fold
- **Severity:** major
- **Viewport:** 375x812
- **Steps to reproduce:** New → Event → Next → Next (Look), or New → Event Horizon → Customize. Change the palette.
- **Expected vs actual:** Expected to see the change. Actual: the preview starts at y≈823 on an 812px screen, below twelve controls and the presets. Every change is invisible until you scroll past everything.
- **Suggested fix:** On phone, pin a compact live preview (square + headline banner) to the top of the Look sheet and scroll only the controls under it.
- **Screenshot:** shots/organiser-04.png

### ORGANISER-7 — Call outs vanish on reload
- **Severity:** major
- **Viewport:** all
- **Steps to reproduce:** New → Call out → "need 2 builders for Saturday" → Post → reload → Home → Call outs chip.
- **Expected vs actual:** Expected the call out to still be there. Actual: it's gone. `persist()` saves events, horizons, themes and RSVPs but not `CALLOUTS`. Nothing warns that it was lost.
- **Suggested fix:** Add the user's call outs to the persisted store and restore them on boot.

### ORGANISER-8 — A call out can't be tied to the event it's for
- **Severity:** major
- **Viewport:** all
- **Steps to reproduce:** Open your own event → look for a way to post a call out. Then New → Call out.
- **Expected vs actual:** Expected "need 2 builders" to hang off the build weekend (event pages already have a Call outs section for this). Actual: there is no call-out action on the owner's event page, and the New call out form has no event field. The call out floats on Home with no date or place context.
- **Suggested fix:** Add "Call out" to the owner's event action row that opens New call out with the event preselected, and add an optional "For event" picker to the form.

### ORGANISER-9 — Back leaves the app, and reload loses your place
- **Severity:** major
- **Viewport:** all (worst on phone)
- **Steps to reproduce:** Open the app → open your horizon → open an event → press browser/Android back. Separately: open Hosting → an event → reload.
- **Expected vs actual:** Expected back to return to the horizon, and reload to stay on the event. Actual: back exits to the previous site (about:blank in the test), and reload always lands on Home. Only the in-app back arrow works.
- **Suggested fix:** Push a history entry per opened folder/item (hash routes) and restore folder + open item from the URL on load.

### ORGANISER-10 — The owner's event page is laid out for guests, not the host
- **Severity:** minor
- **Viewport:** 1440x900, 375x812
- **Steps to reproduce:** Open your own published event.
- **Expected vs actual:** Expected host actions to lead. Actual: Interested / Going / Promote lead, and the facts read "GOING 0 from your network" for the host. Customize is pushed to a wrapped second row at 1440 and a full-width third row on phone, so the action rows don't line up with guest event pages (IA-v2 "align the action buttons").
- **Suggested fix:** For owned events, replace the verb pair with Edit · Customize · Call out on one row, and keep Horizon/Share on the same baseline.
- **Screenshot:** shots/organiser-01.png, shots/organiser-09.png

### ORGANISER-11 — Rename and Customize are two lookalike icons
- **Severity:** minor
- **Viewport:** all
- **Steps to reproduce:** Open your own horizon and look at the action row.
- **Expected vs actual:** Expected clearly labelled owner actions. Actual: two unlabelled square icon buttons, a pencil (Rename) and a brush (Customize), that are nearly identical at 16px. Customize is the organiser's key verb and it is the least discoverable control on the page.
- **Suggested fix:** Give both text labels ("Edit details", "Customize"), same as Customize on events.
- **Screenshot:** shots/organiser-08.png, shots/organiser-10.png

### ORGANISER-12 — Two cover pickers and two create buttons in the New horizon flow
- **Severity:** minor
- **Viewport:** all
- **Steps to reproduce:** New → Event Horizon, then Customize.
- **Expected vs actual:** Expected one place to choose the cover. Actual: the New dialog offers Mosaic / Plain, while Customize offers Its own square / Mosaic / Plain / Square of each event. The footer has both "Customize" and "Create horizon", and both create it. After Customize → Apply the only toast is "Look updated", so creation itself is never confirmed.
- **Suggested fix:** Drop the cover picker from the New dialog. Keep one "Create" button that lands on the new horizon's page, where Customize lives.

### ORGANISER-13 — A fresh account arrives full of someone else's activity
- **Severity:** minor
- **Viewport:** all
- **Steps to reproduce:** Clear storage → Join as Jonas → look at the sidebar or You tab.
- **Expected vs actual:** Expected empty Hosting/Going. Actual: Hosting 2 (for example "Portable shade build" and "Soundcheck west stage" by "You"), Going 2 and Interested 1 are set automatically, plus 3 followed horizons and 4 followed people. Jonas can't tell his build weekend from inherited fixtures, and he's listed as going to events he never chose.
- **Suggested fix:** Seed nothing into Hosting/Going/Interested on sign-up. Show an empty Hosting state with a single "New event" button.

### ORGANISER-14 — Removing an event from a horizon is one unguarded tap
- **Severity:** minor
- **Viewport:** 375x812 mainly
- **Steps to reproduce:** Open your horizon on phone → tap × on a track.
- **Expected vs actual:** Expected a recoverable action. Actual: a 44px × box sits on every track as the most prominent thing on the row, and removal happens instantly. The toast "Removed from…" has no Undo.
- **Suggested fix:** Add "Undo" to the removal toast, and on phone move remove into swipe-left or an Edit mode.
- **Screenshot:** shots/organiser-08.png

### ORGANISER-15 — A published horizon never reaches Home, and Home differs by device
- **Severity:** minor
- **Viewport:** all
- **Steps to reproduce:** Publish the horizon → log out → Home (desktop and phone).
- **Expected vs actual:** Expected a new public horizon to be discoverable on Home as a card. Actual: logged out, it appears only in Horizons and in search. Desktop Home is a row list with no cards at all. Phone Home shows cards, but your own horizon only appears under the "Horizons" filter chip (which duplicates the Horizons tab).
- **Suggested fix:** Give Home the same card shelves on desktop and phone, include new published horizons in "Horizons worth following", and drop the Home "Horizons" chip in favour of the tab.

### ORGANISER-16 — Signing up is hidden behind "Log in"
- **Severity:** minor
- **Viewport:** 1440x900
- **Steps to reproduce:** Arrive logged out and look for how to join.
- **Expected vs actual:** Expected a Join/Sign up entry. Actual: two "Log in" buttons (toolbar and sidebar), and the first one opens "Join Hypernet".
- **Suggested fix:** Label the toolbar button "Join" when no account exists, and remove the duplicate sidebar button.

### ORGANISER-17 — The picker has no shortcut to your own events
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** Open your horizon → Add events.
- **Expected vs actual:** Expected Jonas's hosted and going events at hand. Actual: a flat 32-item list by date, so he has to search for his own build weekend.
- **Suggested fix:** Add a "Yours" group (Hosting + Going) at the top of the picker.

### ORGANISER-18 — Hint text is still on screen
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** Look at the Home subhead, the New horizon dialog and wizard step 2.
- **Expected vs actual:** The owner asked for no instructional text. Actual: "Events, horizons, call outs and news from your network", "Anyone can find and follow it", "What this collection is for", "optional", "One item per line".
- **Suggested fix:** Delete these strings. Label "Bring" as a list field with one row per item and an add button instead of explaining it.

### ORGANISER-19 — Call out detail oddities
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** Post a call out and view it.
- **Expected vs actual:** The title reads "Looking for: need 2 builders for Saturday" (the label is doubled into the headline), and the author gets an "Answer" button on their own call out.
- **Suggested fix:** Show the title as typed, and for the author replace Answer with Edit / Close call out.
- **Screenshot:** shots/organiser-06.png

### ORGANISER-20 — Phone tab switch keeps the previous list's scroll offset
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Scroll Home down → tap the Horizons tab.
- **Expected vs actual:** Expected the top of Horizons. Actual: the list opens slightly scrolled, and the first "Yours" row is hidden under the sticky section header.
- **Suggested fix:** Reset `#listbody.scrollTop` on tab change, or remember it per tab.

### ORGANISER-21 — Wizard step tabs look clickable but aren't
- **Severity:** polish
- **Viewport:** all
- **Steps to reproduce:** In New event, click "3 · Look" from step 1.
- **Expected vs actual:** Expected to jump to that step. Actual: nothing happens. The steps are plain divs styled as tabs.
- **Suggested fix:** Make the steps real buttons, since all fields have defaults anyway.

## Works well

- **Create is easy to find, and gating resumes the task.** New sits in the desktop toolbar and in the centre of the phone tab bar, with the same four nouns in both. Tapping New → Event while logged out opens Join, and after "Join" you land straight in the event wizard instead of back on Home.
- **The horizon on phone feels like its own thing.** It has a full-bleed themed cover, the mood line, owner and counts, Add events as the main button, and a numbered list of tracks. Customize carries over to its card on Home.
- **Adding to a horizon works in both directions, and it persists.** The picker's search keeps checked items across queries and its button says "Add 4 events". The event page's Horizon button toggles membership in place with a check and a toast. Horizons, covers, themes, publish state and new events all survived reloads on both viewports.
