# Usability test, round 2: crew member (Sasha)

Frozen snapshot, driven in headless Chromium through Playwright with real taps, touch swipes and long-presses (CDP touch events), plus OS back/forward and reloads. Viewports: 375x812 with touch (primary), 1440x900, and a short pass at 768x1024. Sasha signed up fresh on the phone. On desktop and tablet the demo account was used, because the fresh account has no existing chats to read. No console errors or page errors appeared in any context.

## Verdict

Sasha can now complete every goal without workarounds. It is much less painful than in round 1: all 22 round-1 findings are fixed except one partial. Back, reload and drafts are now trustworthy on the phone. The OS back gesture never left the app. The Home scroll position (809px), a shelf's sideways offset (648px), the scroll inside a horizon (339px) and LIST view with an open event all came back after back or reload. A group chat, a DM, a draft and the open conversation all survived reload. Answering a call out is now an editable DM draft, and the call out then shows "You answered · Open chat". On desktop the list, reading pane and chat dock sit side by side at 1440, and the draft stays while you browse.

The problems left are smaller and mostly on the phone event page. The new sticky action bar has the toast drawn on top of it. When a toast with a button disappears, the next tap lands on Going. It happened to me during the test and set an unintended RSVP. On the phone, Promote and Share are hidden behind an unlabelled ⋯. A new account's Chats tab is a blank white page. The volunteer-shift event tells you to "pick a shift" when there is no way to do it.

## Round-1 re-check

| ID | Status | Evidence |
|---|---|---|
| CREW-1 | FIXED | Event → OS back returns to `#/home`. A cold deep link to `#/chats/<id>` → back lands on `#/chats`, and only the next back leaves the app. |
| CREW-2 | FIXED | "Strike crew 2026", the Rio DM and the sent replies survive reload on phone. On desktop, reload restores the open event, the dock, the open Baltic Circuit chat and the reply. |
| CREW-3 | FIXED | A typed draft survives in-app back and reload. The list shows "Draft: DRAFT bring zip ties". On desktop the draft survives browsing and reload. |
| CREW-4 | FIXED | Answer opens Anna's DM with "Re: Sound engineer — …" as an editable, focused draft. After sending, the call out shows "You answered · Open chat". |
| CREW-5 | FIXED | At 1440 with Sidebar and dock open, the list (354px) and reading pane stay side by side while a chat is open. |
| CREW-6 | FIXED | Answer and Share → Open push the chat onto the Home tab (`?in=home`). Back returns to the call out or event. Chat card → event → back → chat. |
| CREW-7 | FIXED | Home `listbody` 809 → 809, shelf `srow` scrollLeft 648 → 648, horizon `dscroll` 339 → 339 after back. |
| CREW-8 | FIXED | "From people you follow" is second on both desktop FEED (8 rows) and the phone Home shelves. |
| CREW-9 | FIXED | Tapping the phone chat title opens members (each opens a profile, and back returns to the chat), Add people, Rename and Leave group. |
| CREW-10 | FIXED | Join opens blank. A new account has no follows, RSVPs, hosting or chats. "Try the demo account" is a separate first row. |
| CREW-11 | FIXED | "@sasha is taken" appears inline and Join stays disabled. |
| CREW-12 | FIXED | Share searches people and chats, takes an optional message, keeps you on the event, and toasts "Sent to Strike crew 2026 · Open". |
| CREW-13 | FIXED | With three people picked, the name placeholder reads "Anna, Jon, Kai" and "Create group" is enabled. |
| CREW-14 | FIXED | Chats are sorted by last message, and opening a chat doesn't reorder them. A DM with no messages is not listed. |
| CREW-15 | FIXED | The New sheet reads Event · Event Horizon · Chat · Call out with no subtitles. The entry point reads "Join / Log in". |
| CREW-16 | FIXED | `#/event/temple-volunteer-shift?view=list` survives reload. Back returns to LIST at scrollTop 596. |
| CREW-17 | PARTIAL | Promote now adds a "Promoted · By you and 5 more" fact, You › Promoted (1) and a PROMOTED tag on the card. Nothing shows up in followers' feeds, and the toast says "Promoted to your followers" to an account with 0 followers. |
| CREW-18 | FIXED | Search (empty) › Browse › People lists everyone. The You tab keeps only "People you follow". |
| CREW-19 | FIXED | Interested · Going · ⋯ is a sticky bar above the tab bar on long event pages. See CREW-R2-1 and CREW-R2-3 for new problems with that bar. |
| CREW-20 | FIXED | The call out tile reads "Looking for / Sound engineer / Anna Vale / until Thu 15 Oct", with the title shown once. |
| CREW-21 | FIXED | The verbs are all 44px on desktop and all 48px in the phone bar. |
| CREW-22 | FIXED | Chip remove buttons are 44x44. "New chat" is 44 tall. A scan of the phone conversation screen found no target under 44px. |

## New findings

### CREW-R2-1: The toast sits on top of the phone action bar, so a late tap on "Open" or "See all" turns on Going
- **Severity**: major
- **Viewport**: 375x812
- **Steps to reproduce**: Open LED forest walk. Tap ⋯ › Share…, tap Strike crew 2026. The toast "Sent to Strike crew 2026 · Open" appears. Wait until it disappears (6s), then tap where Open was.
- **Expected vs actual**: Expected the toast to stay clear of the page's controls, so a tap either hits Open or does nothing. Actually the toast (y 673–717) covers the Interested / Going bar (y 691–739), and Open sits right over Going. Once the toast times out, the tap marks you Going. The "Going" confirmation toast is easy to miss, so a public RSVP changes without Sasha meaning to. Promote ("See all") and plain toasts ("Following", "Going") cover the bar in the same way.
- **Suggested fix**: On phone, anchor toasts above the sticky action bar (bottom = bar top + 8px) whenever the bar is showing.
- **Screenshot**: shots/crew-01.png

### CREW-R2-2: A volunteer-shift event lists shifts that you can't pick, and a hint points to a chat that doesn't exist
- **Severity**: major
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Open Temple volunteer shift. Scroll to Shifts and Take part.
- **Expected vs actual**: Expected to pick Shift 1, 2 or 3 and get into the crew's chat. Actually the shifts are static text. "Take part" says "Pick a shift with Going, then confirm it in the camp chat". Going just sets Going with no shift choice, and nothing links to a "camp chat". This is a dead end for the most crew-like action in the app, and it is exactly the kind of instruction text the owner wants removed.
- **Suggested fix**: Make each shift row a selectable button that sets Going with that shift. Replace the hint with an "Open camp chat" button (or "Message host") when the host has a chat.
- **Screenshot**: shots/crew-02.png

### CREW-R2-3: On phone, Promote and Share are hidden behind an unlabelled ⋯, while desktop shows all five verbs
- **Severity**: minor
- **Viewport**: 375x812 compared with 1440x900
- **Steps to reproduce**: Open any event on phone and look for Promote and Share.
- **Expected vs actual**: Expected the three event verbs (Interested / Going / Promote) together, as on desktop, which is what the owner asked for ("interested, going, and promoted should be in the native view"). Actually the phone bar shows Interested · Going · ⋯, and Promote, Add to horizon and Share are only in the ⋯ sheet. Goal 5 (promote, then share into a chat) takes two extra taps on phone and depends on guessing what ⋯ holds.
- **Suggested fix**: Put Promote in the phone bar as a third icon-and-label button (Interested · Going · Promote · ⋯), and keep Add to horizon and Share in ⋯.
- **Screenshot**: shots/crew-07.png

### CREW-R2-4: A new account's Chats tab is a blank white page
- **Severity**: minor
- **Viewport**: 375x812 (also 1440 dock)
- **Steps to reproduce**: Join as a new user (from Home or from Chats), then open Chats.
- **Expected vs actual**: Expected an empty state that leads somewhere, like the logged-out Chats tab, which has "Chat with your crews" and a Join button. Actually everything below the app bar is empty white. The only control is "New chat" in the corner. Before signing up the tab explains itself; after signing up it shows nothing.
- **Suggested fix**: When a signed-in account has no chats, list the people she follows (or everyone) with a Message button each, under the "New chat" action.
- **Screenshot**: shots/crew-03.png

### CREW-R2-5: New chat shows "Group name" for a one-person DM and silently drops what you type
- **Severity**: minor
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Chats › New chat. Pick only Jon Hale. Type "Van run" in Group name. Tap "Message Jon".
- **Expected vs actual**: Expected either no name field for a DM, or the name to be used. Actually the field is always shown, even before anyone is picked, with the placeholder "Rio" for a single pick. The typed name is thrown away and a plain "Jon Hale" DM opens with no feedback. Round 1 showed the field only from two people up.
- **Suggested fix**: Show Group name only once two or more people are picked.
- **Screenshot**: shots/crew-04.png

### CREW-R2-6: Closing New chat throws away the picked people and the group name
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Chats › New chat. Pick two people and type "Temple crew". Close with × or the back gesture. Open New chat again.
- **Expected vs actual**: Expected the picks and name to still be there. FIX-PLAN A3 says every create form keeps its draft through ×, Cancel and back. Actually the dialog reopens empty (0 checked, empty name). Event, call out and horizon forms keep their drafts; this one doesn't.
- **Suggested fix**: Store the New chat picks and name as a draft like the other create forms, and clear it only on Create or Discard.

### CREW-R2-7: "Add people" on an existing group shows an empty Group name field
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Open Strike crew 2026 › title › Add people.
- **Expected vs actual**: Expected only a people picker. Actually the reused New chat form shows an empty "Group name" field, and after one pick its placeholder becomes "Mira". It looks as if adding Mira will rename the group to "Mira" (it doesn't: the name is kept and "You added Mira" is posted).
- **Suggested fix**: Hide the Group name field in the Add people variant, because renaming already has its own row.
- **Screenshot**: shots/crew-05.png

### CREW-R2-8: An unsent call-out answer is hard to find again
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Open Kitchen lead › Answer. Go back without sending. Open Chats.
- **Expected vs actual**: Expected the Kai DM with its "Draft: Re: Kitchen lead…" in the list, or a sign on the call out that an answer is in progress. Actually the DM is not listed (empty DMs are hidden, even when they hold a draft). The call out still shows a plain Answer, and the Home call-out card never shows "answered", even after you have sent one.
- **Suggested fix**: List any chat that has a draft. Add an "Answered" tag to call-out cards and rows, the same way cards get GOING or PROMOTED.

### CREW-R2-9: The long-press and right-click menu only works on events
- **Severity**: minor
- **Viewport**: 1440x900 and 375x812
- **Steps to reproduce**: Desktop: right-click Kai Okonkwo under People you follow, a call out row in the FEED, or a chat in the dock list. Phone: long-press a person in People or a call out tile on Home.
- **Expected vs actual**: Expected the same menu pattern for every noun (person: Message / Follow; call out: Answer / Open chat; chat: Open / Leave). Actually right-click on these shows no app menu (the browser just selects the word), and a long-press opens the item like a tap. Events get the full menu (Open, Interested, Going, Promote, Add to horizon, Share…), so a crew member learns the gesture and then finds it missing on the nouns she uses most.
- **Suggested fix**: Add menu entries for persons (Message, Follow/Unfollow), call outs (Answer or Open chat) and chats (Open, Rename, Leave), using the existing menu component.

### CREW-R2-10: Following someone reorders the People list, so the next tap hits someone else
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Search › People. Open Kai, tap Follow, go back. Tap the row where Mira was.
- **Expected vs actual**: Expected the list to stay put. Actually Kai moves into a new "People you follow" section at the top, which pushes every row down about 74px, and the tap opens Rio. In the test Sasha followed Rio instead of Mira.
- **Suggested fix**: Keep the list order stable until the screen is reopened (mark followed people in place), or animate the row moving.

### CREW-R2-11: The chat dock header cuts off the group name
- **Severity**: polish
- **Viewport**: 1440x900 and 768x1024
- **Steps to reproduce**: Open the dock and open Baltic Circuit.
- **Expected vs actual**: Expected the chat name to be readable. Actually it reads "Baltic C…" at 1440 and "Baltic Circ…" at 768, because three member avatars and ⋯ share the 300px header.
- **Suggested fix**: Drop the avatar strip from the dock header (members are one tap away in ⋯), or move the avatars under the name.
- **Screenshot**: shots/crew-06.png

### CREW-R2-12: "Call outs from your crews" uses a noun the product doesn't have
- **Severity**: polish
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Follow two people and open Home.
- **Expected vs actual**: Expected "Call outs". Actually the section is renamed "Call outs from your crews" and includes Anna, whom Sasha doesn't follow. "Crew" isn't one of the product nouns, and the list isn't filtered to any crew.
- **Suggested fix**: Keep the heading "Call outs".

### CREW-R2-13: The Host fact on an event is not tappable, but the same person is a chip at the bottom
- **Severity**: polish
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Open Temple volunteer shift and tap "Jon Hale" under HOST.
- **Expected vs actual**: Expected to open Jon's page (to message the host). Actually nothing happens. The tappable "Hosted by · Jon Hale" chip is at the very bottom, below "Who's going", and the page shows the host twice.
- **Suggested fix**: Make the Host fact value a person link, and remove the bottom "Hosted by" block.

### CREW-R2-14: "This month" groups October events in September
- **Severity**: polish
- **Viewport**: 375x812 (Home LIST, You › Promoted)
- **Steps to reproduce**: Home › LIST, or You › Promoted after promoting LED forest walk.
- **Expected vs actual**: The app's today is Sun 20 Sep. Expected "This month" to hold September dates. Actually "This month · 13" contains Sun 4 Oct through Wed 21 Oct, and Promoted puts Fri 2 Oct under "This month".
- **Suggested fix**: Name the group by calendar month ("October") or call it "Next 30 days".

## Works well

- **Back, reload and drafts are now trustworthy on the phone.** Every back (in-app arrow or OS gesture) returned to the exact place, including sideways shelf offsets. Dialogs and the long-press sheet close on back without leaving the page. Reload kept the open chat, its draft and LIST view.
- **Answering a call out.** It opens a focused, editable draft in the host's DM. After sending, back returns to the call out, which now reads "You answered · Open chat". A second tap opens the same chat, never a duplicate.
- **Chatting while browsing on desktop.** At 1440 the list, reading pane and dock sit side by side. Share into the open chat shows up at once in the dock with a card that opens the event. Reload brings back the event, the dock, the conversation and the unsent draft.
