# Usability test: first-timer (Mia)

Snapshot: frozen `hn-snapshot`, served on 127.0.0.1:8941. Tested in headless Chromium through Playwright at 375x812 (touch, mobile UA), 1440x900 and briefly 768x1024. Tested 2026-09-24.

## Verdict

Mia can complete all six goals on both phone and desktop, and nothing blocks her. The browsing half works well: the Home shelves, the big-burn pages and search are clear, and the in-app back stack is reliable. The pain starts at sign-up.

- **Sign-up doesn't create a new person.** The Join form opens pre-filled as "Michal / @mike". Joining gives Mia the demo user's history: 2 Going events she never chose, 2 events she now "hosts" with edit rights, a horizon, followed horizons and people, and unread chats. So when she looks for "my Going events", she can't tell her own picks from the demo data.
- **Nothing has a URL.** Reload always drops her on Home. On a phone, the browser or Android back gesture leaves the app. She can't send an event to the friend who told her about burns, because Share also needs an account and only posts into Hypernet chats.
- **The answer to "how do I get in?" is on the page, but the action is hard to find.** The ticket link is one of eight identical link chips at the very bottom of the AfrikaBurn page. The Borderland membership platform is never linked at all.

No console errors or failed requests showed up in any session.

## Findings

### FIRSTTIMER-1: A new account inherits the demo user's events, horizons, follows and chats
- **Severity:** major
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** Start with clean storage. Open *Portable shade build*, tap **Interested**, join as "Mia" and tap **Going**. Open the **You** tab.
- **Expected vs actual:** Expected Going 1, and nothing under Hosting, Following or Chats. Actual: Going 3 (Ridge dawn stretch and Camp radio hour were seeded by `logIn()`), Interested 1 (Deep Listening Lab, seeded), Hosting 2, "My Horizon" with 3 events, 3 followed horizons, 4 followed people, and 3 chats with an unread badge. *Portable shade build* now shows **HOST: You** and a **Customize** button, so Mia can edit an event she didn't create. In the Going list that event is labelled **HOSTING** instead of **GOING**.
- **Suggested fix:** Make Join create a fresh, empty person. Move the seed RSVPs, horizons, follows and chats onto a separate demo login.
- **Screenshot:** shots/firsttimer-01.png, shots/firsttimer-02.png

### FIRSTTIMER-2: The Join form is pre-filled with someone else's identity
- **Severity:** major
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** While logged out, tap Interested, Going, Share, Horizon, Promote or Log in.
- **Expected vs actual:** Expected empty Name and Handle fields with focus in Name. Actual: Name says "Michal", Handle says "@mike", and focus lands on the third field (About you), so the pre-filled name is easy to miss. Tapping Join straight away creates the account as Michal.
- **Suggested fix:** Leave Name and Handle empty, focus Name, and keep Join disabled until both are filled.
- **Screenshot:** shots/firsttimer-03.png

### FIRSTTIMER-3: No URLs, so reload loses your place and phone back exits the app
- **Severity:** major
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** Open *The Borderland 2027* and reload. Then open it again and use browser back (the Android back gesture).
- **Expected vs actual:** Expected reload to keep the event open and back to return to Home. Actual: the URL stays `/` for every screen. Reload lands on Home (on desktop the Going list is also lost). Browser back goes to `about:blank`, which means leaving Hypernet.
- **Suggested fix:** Give each event, horizon, person and search a URL (a hash is enough) and push a history entry whenever something opens.

### FIRSTTIMER-4: Logged-out visitors can't share an event, and Share only posts into Hypernet chats
- **Severity:** major
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** While logged out, open *AfrikaBurn 2027* and tap **Share**.
- **Expected vs actual:** Expected the native share sheet or Copy link, so Mia can send it to her friend. Actual: the Join dialog opens. After joining, Share lists only her Hypernet chats. There's no link and no system share.
- **Suggested fix:** Make Share ungated, and make it open `navigator.share` or Copy link, with "Send in a chat" as a second option.

### FIRSTTIMER-5: No primary "get tickets" or "become a member" action on burn pages
- **Severity:** major
- **Viewport:** 375x812 (the same on desktop)
- **Steps to reproduce:** Open *AfrikaBurn 2027* and look for where to buy. Then do the same on *The Borderland 2027*.
- **Expected vs actual:** Expected the ENTRY fact to lead to the official sale. Actual: ENTRY ("Ticket, 0–7,199 ZAR") isn't tappable. The only purchase link, `tickets.afrikaburn.org`, is the first of eight identical chips under LINKS, about 4,000px down on a phone. On Borderland the page says transfers go through `members.theborderland.se`, but that's plain text, and the LINKS section doesn't include it. The "Fall membership sale opens in 14 days" row has no link either.
- **Suggested fix:** Put a "Get tickets" or "Become a member" button, linked to the official sale, in the ENTRY fact and in the verb row.
- **Screenshot:** shots/firsttimer-04.png

### FIRSTTIMER-6: Every logged-out entry point says "Log in", but it opens "Join Hypernet"
- **Severity:** minor
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** While logged out, look at the toolbar, the left-rail card, the **You** tab and the **Chats** tab.
- **Expected vs actual:** Expected a clear Join or Sign up action for someone who has no account. Actual: all four entry points say "Log in", and tapping any of them opens "Join Hypernet". Phone Home has no join entry point at all, so the first sign-up prompt appears only when she taps a verb.
- **Suggested fix:** Label these buttons "Join" and add a small "Log in" link next to them.
- **Screenshot:** shots/firsttimer-05.png

### FIRSTTIMER-7: Phone and desktop Home are different destinations
- **Severity:** minor
- **Viewport:** 375x812 vs 1440x900
- **Steps to reproduce:** Open Home logged out on each viewport.
- **Expected vs actual:** Expected the same sections and filters, in a layout that fits each screen. Actual:
  - Phone FEED shows a greeting, a tagline, **ALL / EVENTS / HORIZONS / CALL OUTS** filter chips and shelves (Coming up, Announced burns, Horizons, Call outs).
  - Desktop FEED shows a sectioned list with no filter chips, no tagline, and an extra **Network news** section.
  - The desktop subtitle "…news from your network" and the Home count "12" appear even though a logged-out visitor has no network.
- **Suggested fix:** Use one section list and the same filter chips on both viewports, and drop the "your network" copy for logged-out visitors.
- **Screenshot:** shots/firsttimer-06.png (desktop), shots/firsttimer-07.png (phone)

### FIRSTTIMER-8: Network news rows look clickable but do nothing, and introduce "Clusters"
- **Severity:** minor
- **Viewport:** 1440x900
- **Steps to reproduce:** On desktop Home, scroll to NETWORK NEWS and click "Clusters unlocked — browse the directory or create a camp", "@nova and @ember are now Friends" or "New user joined…".
- **Expected vs actual:** Expected each row to open what it mentions. Actual: nothing happens (no `data-act`, default cursor). The rows are cut off with no way to read the rest. They also introduce "Clusters" and "camp", which aren't product nouns; person pages show a "CLUSTERS" section too.
- **Suggested fix:** Link each news row to its object and remove rows that have no object, including the cluster and camp rows.
- **Screenshot:** shots/firsttimer-08.png

### FIRSTTIMER-9: "Going: 15 from your network" is shown to people with no network
- **Severity:** minor
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** While logged out, open any event and read the GOING fact and WHO'S GOING.
- **Expected vs actual:** Expected a total count ("≈ 10,000 people", "N on Hypernet") when logged out. Actual: "15 from your network" (AfrikaBurn) or "33 from your network" (Borderland) on a first visit.
- **Suggested fix:** When logged out, or when the network is empty, show "N on Hypernet going" instead of "from your network".

### FIRSTTIMER-10: Search ignores accent-free spellings and doesn't match countries
- **Severity:** minor
- **Viewport:** 375x812 (search logic is the same on desktop)
- **Steps to reproduce:** Search "Malmo", "Eksjo", "Sweden" and "South Africa".
- **Expected vs actual:** Expected "Malmo" to find Malmö events and "Sweden" to find Borderland. Actual: "Malmo", "Eksjo" and "South Africa" return "Nothing matches". "Sweden" returns only an online camp call. "Malmö", "Eksjö" and "Tankwa" work. The empty state offers no way forward.
- **Suggested fix:** Fold diacritics before matching, index region and country, and give the empty state a "Browse all events" button.

### FIRSTTIMER-11: The calendar opens on the wrong month, and day cells can't be tapped
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:** Home → **CALENDAR**. Tap a day that has events, for example 21.
- **Expected vs actual:** Expected the current month (the app's today is 20 Sep) and a tap on a day to show that day's events. Actual: it opens on October 2026 (`calAnchor` is hard-coded to 2026-10-04), which hides this week's Sep 23, 25 and 28 events. Day cells ignore taps. The only tap targets are the 49x6px colour bars. **Today** jumps to September.
- **Suggested fix:** Open on today's month and make the whole day cell a tap target that filters the list below.
- **Screenshot:** shots/firsttimer-09.png

### FIRSTTIMER-12: No confirmation of the action that triggered sign-up
- **Severity:** minor
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** While logged out, tap **Interested** on an event and join.
- **Expected vs actual:** Expected "Interested · Portable shade build", the same feedback a normal tap gives ("Going · Portable shade build"). Actual: only "Welcome to Hypernet". The button changes state, but on a phone the verb row may be off-screen.
- **Suggested fix:** After a gated action, show a toast such as "Welcome, Mia — marked Interested: <event>".

### FIRSTTIMER-13: "+ 12 more" in WHO'S GOING looks like a chip but does nothing
- **Severity:** minor
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** Open *AfrikaBurn 2027* → WHO'S GOING → tap **+ 12 more**.
- **Expected vs actual:** Expected the full attendee list. Actual: nothing happens. It's a `span.chip.plain` styled like the tappable person chips next to it.
- **Suggested fix:** Make it open the full list of people going, or render it as plain text.

### FIRSTTIMER-14: "Horizon" and "Promote" are unclear verbs for a newcomer
- **Severity:** minor
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** Look at the verb row on any event.
- **Expected vs actual:** Expected labels that say what the buttons do. Actual: "Horizon" is a noun; the button actually adds the event to a horizon, and the longer "Add to horizon" label is hidden at both widths. "Promote 8" has a dashed border, so it looks disabled or like a draft.
- **Suggested fix:** Label the button "Add to horizon" (or "Save to…") and give Promote the same solid border as the other secondary buttons.

### FIRSTTIMER-15: Borderland contradicts itself about which year's prices it shows
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:** Open *The Borderland 2027*.
- **Expected vs actual:** Expected one clear statement of which edition the prices are for. Actual: the top banner says "Details below are from the 2026 edition", but the membership block is labelled "PRICES FOR THE 2027 EDITION".
- **Suggested fix:** Mark each section with its own edition year and drop the blanket banner when a section is already current.

### FIRSTTIMER-16: Call-out cards repeat the title
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Scroll phone Home to **Call outs**.
- **Expected vs actual:** Expected the title once. Actual: "LOOKING FOR / Sound engineer" on the card face, then "Sound engineer" again in the caption.
- **Suggested fix:** Use the caption for host and deadline only.
- **Screenshot:** shots/firsttimer-10.png

### FIRSTTIMER-17: Row glyphs paint over the sticky section header
- **Severity:** polish
- **Viewport:** 1440x900
- **Steps to reproduce:** Scroll the desktop Home list slightly.
- **Expected vs actual:** Expected the sticky "HAPPENING SOON" header to cover the rows scrolling under it. Actual: a thumbnail's `span.g` glyph draws on top of it ("HA✳PPENING SOON").
- **Suggested fix:** Give `.band` a z-index above the row thumbnails.
- **Screenshot:** shots/firsttimer-11.png

### FIRSTTIMER-18: Search result titles are cut off at the part that tells them apart
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Search "decompression".
- **Expected vs actual:** Expected full titles. Actual: "Zurich Decompressio…", "SF Bay Area Decompress…" and "London Decompression 2…". The wide date column takes the space.
- **Suggested fix:** Let titles wrap to two lines on a phone, or put the date under the title.
- **Screenshot:** shots/firsttimer-12.png

### FIRSTTIMER-19: Horizon rows show an unexplained single date
- **Severity:** polish
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** Open the **Horizons** tab, or search results that include a horizon.
- **Expected vs actual:** Expected the next upcoming date or the date range. Actual: a bare date such as "FRI 12 JUN" for *Surfaces & Projections*, or "WED 29 APR" for *Season of burns*. Both are past dates.
- **Suggested fix:** Show "next: <date>" or the range, the way the horizon page does.

## Works well

- **The phone back stack is precise.** Search "mira" → event → person → horizon, then **‹** four times, walks back through the same horizon, person, event and search results (query intact) to Home.
- **Sign-up picks up where you left off.** The Interested or Going you tapped is applied without tapping again, Enter submits the form, and Cancel leaves the event unchanged.
- **Big-burn pages answer a newcomer's real questions.** Borderland says plainly "There are no tickets. You join the association…" and lists price tiers, sale windows with a countdown, water and power, rules, and a "Words used here" glossary. Search for "decompression" is instant and grouped by type.
