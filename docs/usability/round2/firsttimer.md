# Usability test, round 2: first-timer (Mia)

I tested the frozen `hn-snapshot`, served on 127.0.0.1:8941, on 2026-09-24. The browser was headless Chromium driven through Playwright. Viewports:

- **375x812** with touch and a mobile user agent: the main pass.
- **1440x900**: the main pass.
- **768x1024**: a quick check only.

The test used real taps, CDP long-presses, right-clicks, typing, back, forward and reload. There were no console errors, failed requests or 4xx responses in any session. Twelve phone routes had no horizontal overflow.

## Verdict

**Yes: Mia can now do all six goals on phone and on desktop, and it is much less painful than in round 1.** All four major problems from round 1 are fixed:

- **Sign-up:** Joining creates a fresh, empty "Mia". The Interested or Going she tapped is completed after she joins, and a toast confirms it.
- **URLs:** Every screen has a URL. Reload keeps her place. The phone back gesture closes dialogs and walks the stack instead of leaving the app.
- **Sharing:** Share works while logged out, and Copy link gives a real URL.
- **Getting in:** Burn pages lead with a "Get tickets" or "Become a member" button that goes to the official page.

What's left is minor or polish. The most important remaining gap is on desktop: a logged-out visitor arrives on an Outlook-style list with an unexplained "13" badge, and nothing says what Hypernet is. On a phone, the toast after every Interested or Going tap covers the button she just pressed. Once she follows a single person, every event claims "N from your network".

## Round-1 re-check

| ID | Status | Evidence |
|---|---|---|
| FIRSTTIMER-1 | FIXED | A new Mia has Going 1, Interested 1, empty Hosting and no chats, and only "Popular" horizons. Portable shade build shows HOST Michal and no Customize button. |
| FIRSTTIMER-2 | FIXED | Name and Handle are blank with placeholders, and focus is in Name. Join stays disabled until both are valid. "@sasha is taken" shows live. |
| FIRSTTIMER-3 | FIXED | `#/event/borderland-2027` survives reload. Back walks person → event → Going → You. Back closes the Join sheet and the ⋯ sheet without leaving the page. |
| FIRSTTIMER-4 | FIXED | Logged out, ⋯ → Share… opens "Share 'AfrikaBurn 2027'". Copy link puts `…/#/event/afrikaburn-2027` on the clipboard and shows "Link copied". |
| FIRSTTIMER-5 | FIXED | An Entry block sits under the title. "Get tickets" opens tickets.afrikaburn.org and "Become a member" opens members.theborderland.se, both in a new tab. Borderland shows "Fall membership sale: opens in 14 days". |
| FIRSTTIMER-6 | FIXED | The phone app bar, desktop toolbar, You tab and Chats tab all say "Join / Log in". After an account exists they say "Log in", which opens an account picker. |
| FIRSTTIMER-7 | PARTIAL | Both viewports now show the same sections in the same order. The phone has a greeting and tagline but desktop has none, and desktop still shows an unexplained "Home 13" count (see R2-1). |
| FIRSTTIMER-8 | FIXED | Network news and "Clusters" are gone from Home. The desktop bands are This week, Coming up, Announced burns, Event Horizons worth following and Call outs. |
| FIRSTTIMER-9 | PARTIAL | Logged out it reads "15 on Hypernet". After Mia follows one person, every event switches to "N from your network" with the full total (see R2-3). |
| FIRSTTIMER-10 | FIXED | "Malmo", "Eksjo", "Sweden" and "South Africa" all return the right events. When nothing matches, the page offers This week and Popular Event Horizons. |
| FIRSTTIMER-11 | FIXED | The calendar opens on September 2026. Tapping 23 lists Ridge dawn stretch under the grid, and `&day=2026-09-23` survives reload. |
| FIRSTTIMER-12 | FIXED | The toast reads "Welcome, Mia · Interested · Portable shade build". The demo-account path confirms too: "Demo account · Going · The Borderland 2027". |
| FIRSTTIMER-13 | FIXED | "and 12 more" is now plain text, not a fake chip. |
| FIRSTTIMER-14 | FIXED | The button reads "Add to horizon". Promote has a solid border on desktop, and on phone it sits in the ⋯ sheet. |
| FIRSTTIMER-15 | FIXED | Borderland says "Entry and prices are for 2027; the rest is from 2026 until the organisers update it." |
| FIRSTTIMER-16 | FIXED | The call-out card shows "LOOKING FOR / Sound engineer" with "Anna Vale · until Thu 15 Oct" as its caption. |
| FIRSTTIMER-17 | FIXED | The sticky "THIS WEEK" header now covers the thumbnails scrolling under it on desktop. |
| FIRSTTIMER-18 | FIXED | The full "SF Bay Area Decompression 2026: Oakland Edition Vol. II" wraps to two lines. The meta line below it still loses the city (see R2-8). |
| FIRSTTIMER-19 | FIXED | Horizon rows read "Next Fri 9 Oct" or "Next Wed 23 Sep". |

## New findings

### FIRSTTIMER-R2-1: Desktop Home doesn't say what Hypernet is, and shows an unexplained, shifting "13" badge
- **Severity:** minor
- **Viewport:** 1440x900 (also 768x1024)
- **Steps to reproduce:**
  1. Start with clean storage and open `/` on desktop.
  2. Open The Borderland 2027 from the list.
  3. Follow Jon Hale.
- **Expected vs actual:**
  - Expected: the same one-line intro as on phone ("Burns, builds and the people who make them."), and no unread-style count for a logged-out visitor.
  - Actual: desktop Home is a bare list, and the first event (Ridge dawn stretch) opens automatically in the reading pane. The only sign of what the product is comes from the event data itself.
  - The sidebar shows **Home 13**. It drops to 12 after opening an event, rises to 14 after following someone, and resets on reload. Nothing says what it counts.
- **Suggested fix:** Render the phone greeting and tagline as the first band of the desktop feed, and hide the Home count when logged out (or drop it altogether).
- **Screenshot:** shots/firsttimer-02.png

### FIRSTTIMER-R2-2: On phone, the toast covers the Interested/Going bar you just tapped
- **Severity:** minor
- **Viewport:** 375x812
- **Steps to reproduce:**
  1. Open any event.
  2. Tap **Going** in the sticky bar.
  3. Tap it again.
- **Expected vs actual:**
  - Expected: the toast appears above the action bar, so the pressed state stays visible.
  - Actual: the toast ("Going / Portable shade build", or "Removed / LED forest walk") sits at about y=679–730. The bar is at about y=691–739, so the toast hides both verbs for about 2.5s after every tap. The same happens with the "Welcome, Mia" toast after joining.
  - Taps still pass through the toast (`pointer-events: none`), but Mia can't see whether she is now Going or not.
  - "Removed" doesn't say what was removed.
- **Suggested fix:** Anchor toasts above `.vbar` whenever it is shown, and word the undo toast "Not going · LED forest walk".
- **Screenshot:** shots/firsttimer-01.png

### FIRSTTIMER-R2-3: After following one person, every event says "N from your network"
- **Severity:** minor
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:**
  1. Join as Mia.
  2. Follow Rio Moss (and nobody else).
  3. Open Zurich Decompression 2026, then LED forest walk.
- **Expected vs actual:**
  - Expected: "N on Hypernet", or a count of the people Mia actually follows who are going.
  - Actual: the pages say "29 from your network" (Zurich), "12 from your network" (LED forest walk), "33 from your network" (Borderland) and "15 from your network" (AfrikaBurn). The number is the full fixture total, although Mia's network is one person.
  - This is the remainder of FIRSTTIMER-9.
- **Suggested fix:** Count only followed people who are going for "from your network", and fall back to "N on Hypernet" when that count is 0.
- **Screenshot:** shots/firsttimer-01.png (GOING fact)

### FIRSTTIMER-R2-4: Entry is shown two or three times on the same event page
- **Severity:** minor
- **Viewport:** 375x812 (same on 1440x900)
- **Steps to reproduce:**
  1. Open AfrikaBurn 2027 and scroll one screen.
  2. Open Portable shade build.
- **Expected vs actual:**
  - Expected: the Entry block states access once, and the facts grid doesn't repeat it.
  - Actual on AfrikaBurn: the Entry block ("Ticket, 0–7,199 ZAR, Get tickets"), then the facts grid ENTRY ("Ticket, 0–7,199 ZAR") about 400px lower, then the TICKETS section.
  - Actual on the small event: the facts grid ENTRY ("Free"), then an ENTRY section ("FREE / Free to come.").
  - On a phone that is three stops for one fact, and the hierarchy gets flatter because of it.
- **Suggested fix:** Drop the ENTRY cell from the facts grid when the Entry block is shown. On free events, drop the ENTRY section that only repeats "Free".
- **Screenshot:** shots/firsttimer-03.png

### FIRSTTIMER-R2-5: Desktop Home section counts disagree with what is shown and with the phone
- **Severity:** minor
- **Viewport:** 1440x900 vs 375x812
- **Steps to reproduce:** Compare the desktop Home "COMING UP" band with the phone "Coming up" shelf.
- **Expected vs actual:**
  - Expected: one number per section, and the same number on both viewports.
  - Actual on desktop: the band header says **9**, it lists **8** rows, and the footer says **Show all 12**. The Show all page then says "12 events".
  - Actual on phone: the shelf holds **10** cards.
- **Suggested fix:** Make the band header show the section's total (12), and use the same cap on both viewports.
- **Screenshot:** shots/firsttimer-04.png

### FIRSTTIMER-R2-6: The Join sheet doesn't say why it opened, and Join stays silently disabled after typing a name
- **Severity:** minor
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:**
  1. While logged out, tap **Interested** on Portable shade build.
  2. Type "Mia" in Name.
- **Expected vs actual:**
  - Expected: the sheet acknowledges the pending action. Handle is pre-filled from Name ("@mia"), so Join lights up.
  - Actual: the sheet is a generic "Join Hypernet". The first and most prominent row is "Try the demo account · Michal". After typing a name, **Join** stays grey with no reason given until she invents a handle.
- **Suggested fix:** Pre-fill Handle from Name (still editable) and put the event's title in the sheet header ("Join to save Portable shade build").
- **Screenshot:** shots/firsttimer-05.png

### FIRSTTIMER-R2-7: The Horizons tab repeats "Following" and "Event Horizon" at the expense of the owner's name
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Follow Dust & Neon, then open the **Horizons** tab.
- **Expected vs actual:**
  - Expected: the owner's name is visible on each row.
  - Actual: under the "FOLLOWING 1" header, the row carries a second black "✓ FOLLOWING" pill. The pill squeezes the meta line to "NEXT FRI 2 OCT · Event Ho…".
  - Every row in a tab called Horizons also spells out "Event Horizon", which truncates the owner on 4 of the 6 rows ("Anna V…", "Kai Oko…").
- **Suggested fix:** Drop the pill inside the Following section and drop the "Event Horizon" word from rows on the Horizons tab.
- **Screenshot:** shots/firsttimer-06.png

### FIRSTTIMER-R2-8: Phone list rows cut off the city, which is the part a newcomer scans for
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Search "decompression".
- **Expected vs actual:**
  - Expected: the city is visible on every row.
  - Actual: the meta line is host · city · type, so it ends "Zurich Decompression · Z…", "Burning Man Project · Oaklan…" and "London Decompression · Lond…". The host usually repeats the title, and the city is what gets cut.
- **Suggested fix:** Order the phone meta as city · type · host, or drop the host when the title already contains it.
- **Screenshot:** shots/firsttimer-07.png

### FIRSTTIMER-R2-9: Logged-out Share on phone is a full-screen sheet holding a single row
- **Severity:** polish
- **Viewport:** 375x812 (headless, so `navigator.share` was absent)
- **Steps to reproduce:** While logged out, open an event and tap ⋯ → **Share…**.
- **Expected vs actual:**
  - Expected: a short bottom sheet sized to its content.
  - Actual: a full-height grey dialog with the link field and Copy link at the top, about 1,200px of empty grey, and **Done** at the bottom.
- **Suggested fix:** Size the Share sheet to its content, like the ⋯ sheet, and make Copy link close it after the toast.
- **Screenshot:** shots/firsttimer-08.png

### FIRSTTIMER-R2-10: "From the event's own pages" is an empty heading at the bottom of burn pages
- **Severity:** polish
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** Open The Borderland 2027 or AfrikaBurn 2027 and scroll to the end.
- **Expected vs actual:**
  - Expected: a source line attached to the content it credits, or nothing.
  - Actual: after LINKS, a section-style heading "FROM THE EVENT'S OWN PAGES" appears with nothing under it.
- **Suggested fix:** Make it a caption under the LINKS heading ("Links from the event's own pages"), or remove it.
- **Screenshot:** shots/firsttimer-09.png

### FIRSTTIMER-R2-11: A new account's Chats tab is a blank white screen
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Join as a new user and open **Chats**.
- **Expected vs actual:**
  - Expected: some way forward besides the corner button.
  - Actual: the whole body is white, and the only control is **New chat** in the app bar. The logged-out Chats tab has a line and a button; the logged-in empty state has less.
- **Suggested fix:** When the list is empty, show the people she follows (or the People directory) as rows that open a DM.
- **Screenshot:** shots/firsttimer-10.png

### FIRSTTIMER-R2-12: The no-results "This week" list includes events that aren't this week
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** Search "Cape Town" (or "this weekend").
- **Expected vs actual:**
  - Expected: the "This week" fallback matches Home's This week (Ridge dawn stretch and Night kitchen line).
  - Actual: under "Nothing matches 'Cape Town'.", the list headed **This week** also includes Portable shade build (Mon 28 Sep) and Camp call (Thu 1 Oct), which are 8 and 11 days out. Home and the query "this week" both return only 2 events.
- **Suggested fix:** Label the fallback "Coming up", or limit it to the same 7-day window Home uses.

### FIRSTTIMER-R2-13: Entry price ranges follow different rules, and "0–" reads as free
- **Severity:** polish
- **Viewport:** 375x812 and 1440x900
- **Steps to reproduce:** Compare the Entry block on AfrikaBurn 2027 with the one on Zurich Decompression 2026.
- **Expected vs actual:**
  - Expected: both ranges are built the same way, and the headline price is what most people pay.
  - Actual on AfrikaBurn: "0–7,199 ZAR", where the lower bound is the age-70+ pensioner tier. To a newcomer it looks like the burn can be free.
  - Actual on Zurich: "65–85 CHF", which leaves out its own 45 CHF low-income tier.
- **Suggested fix:** Show the general-admission tier as the headline ("from 3,099 ZAR"), and leave concession tiers to the Tickets section.

### FIRSTTIMER-R2-14: Promote fires instantly and says "Promoted to your followers" when Mia has none
- **Severity:** polish
- **Viewport:** 375x812
- **Steps to reproduce:** As a new user with no followers, open an event and tap ⋯ → **Promote**.
- **Expected vs actual:**
  - Expected: for a newcomer, a clear, reversible result that is true.
  - Actual: a single tap in the sheet adds "PROMOTED: By you and 6 more" to the event. The toast says "Promoted to your followers", but Mia has 0 followers.
- **Suggested fix:** Word the toast "Promoted · <event>" (with Undo), and mention followers only when there are some.

### FIRSTTIMER-R2-15: On a desktop deep link, the open event isn't selected in the list
- **Severity:** polish
- **Viewport:** 1440x900
- **Steps to reproduce:** Open `/#/event/afrikaburn-2027` directly (for example from a copied link).
- **Expected vs actual:**
  - Expected: the AfrikaBurn row is highlighted and scrolled into view, the way it is when clicked.
  - Actual: the reading pane shows AfrikaBurn, but the list sits at the top (This week), no row is selected, and the window title reads "Hypernet — Home".
- **Suggested fix:** On a deep link, select the matching row and scroll it into view, and set the window title to the item's name.

## Works well

- **Sign-up is now honest and picks up where Mia left off.**
  - Blank fields, focus in Name, and a live "@sasha is taken" check.
  - The Interested or Going she tapped (from the page, the ⋯ sheet or a long-press) is applied after she joins and confirmed in the toast.
  - The new account is empty. Log out and Log in offer a picker with "Mia" and the demo account.
- **Hash URLs and the back stack feel native.**
  - You → Going → event → person, then reload, keeps the person open.
  - OS back walks through event (scroll restored) → Going → You.
  - The search query survives an event visit, and the phone back gesture closes the Join, ⋯ and Share sheets instead of the page.
- **"How do I get in?" is answered at the top of the page.**
  - The Entry block shows the model, the price and the next sale ("Fall membership sale: opens in 14 days"), with a single "Get tickets" or "Become a member" button to the official site.
  - The long-press sheet (touch) and the right-click menu (desktop) carry the same verbs. On desktop, the menu ticks the current state (✓ Interested).
