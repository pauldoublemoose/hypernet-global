# Usability test: crew member (Sasha)

Frozen snapshot, headless Chromium through Playwright. Viewports: 375x812 with touch emulation (primary), 1440x900, and a quick pass at 768x1024. Test date: 2026-09-24.

## Verdict

Sasha can finish every task: sign up, read and reply to chats, start a DM, create a named group of three, answer a call out, follow people and a horizon, promote an event and share it into a chat. Creating a chat is now easy to find and works well. Chat as an ongoing tool breaks down, though. **Nothing she does in Chats survives a reload.** Drafts disappear as soon as she leaves a conversation. **On a phone, the system back gesture takes her out of the app.** Actions that open a chat move her to another tab, and back does not return her to where she started. On desktop, opening the chat dock collapses the event list, so "chat while browsing" means pressing Back between every event. Following people changes the phone Home but not the desktop Home. No console errors were seen in any flow.

Pain level: high for daily crew coordination on a phone, moderate on desktop.

## Findings

### CREW-1: The system or browser back gesture leaves the app
- **Severity**: blocker
- **Viewport**: 375x812 (affects all viewports)
- **Steps to reproduce**: Open the app. On Home, tap any event card. Use the browser or OS back (Android back button, iOS edge swipe, or `history.back()`).
- **Expected vs actual**: Expected to return to Home with the feed where you left it. Actually the tab navigates to the previous site (`about:blank` in the test). The app never adds a history entry (`history.length` stays at 2), so the first back press always exits, and everything in memory is lost with it (see CREW-2).
- **Suggested fix**: Push a history entry for every tab switch, pushed page and open chat, and route `popstate` to the existing `phoneBack()`.
- **Screenshot**: none (the result is a blank page)

### CREW-2: Chats, sent messages, new groups and DMs are lost on reload
- **Severity**: major
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Sign up. In Chats, reply in Baltic Circuit. Create the group "Strike crew 2026" with Anna, Kai and Rio. Start a DM with Rio. Reload.
- **Expected vs actual**: Expected the new group, the DM and the replies to still be there. Actually the list goes back to the three fixture chats, Baltic Circuit is unread again, and the app opens on the Home tab. On desktop the chat dock is closed after reload. RSVPs, follows and horizons are saved, but nothing from Chats is.
- **Suggested fix**: Save the chats, chat order and unread flags, plus the current tab, open chat and whether the dock is open, in the same `hypernet-feed:v1` store.
- **Screenshot**: shots/crew-04.png (chat list after reload; "Strike crew 2026" is gone)

### CREW-3: Drafts are discarded when you leave a conversation
- **Severity**: major
- **Viewport**: 375x812; 1440x900 (chat dock)
- **Steps to reproduce**: Open Baltic Circuit and type "DRAFT keep me" without sending. Tap back (phone app-bar back, or the dock's back arrow on desktop). Open Baltic Circuit again.
- **Expected vs actual**: Expected the draft to still be in the composer. Actually the composer is empty. On phone the tab bar is hidden inside a conversation, so back is the only way out, and it always throws the draft away. (On desktop the draft does survive browsing events in the centre and closing and reopening the dock.)
- **Suggested fix**: Keep a draft per chat, restore it when the chat opens, and show "Draft: …" as that chat's preview in the list.

### CREW-4: "Answer" on a call out sends a canned message for you, repeatably, and nothing records it
- **Severity**: major
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Home, CALL OUTS, open "Sound engineer", tap Answer. Go back to the call out and tap Answer again.
- **Expected vs actual**: Expected a chance to write or edit the reply, confirmation that it was sent, and the call out marked as answered. Actually "Re: Sound engineer — I can do this. When do you need me?" is sent straight to Anna's DM with no toast. The second tap sends an identical duplicate. The call out page still shows the same Answer button, with no sign that you answered. On phone you are also moved to the Chats tab (see CREW-6).
- **Suggested fix**: Answer opens the host's DM with that text as an editable draft in the composer. After sending, the call out shows "You answered · Open chat" instead of Answer.
- **Screenshot**: shots/crew-10.png

### CREW-5: On desktop, opening the chat dock collapses the event list and reading pane into one pane
- **Severity**: major
- **Viewport**: 1440x900
- **Steps to reproduce**: Sign up (Sidebar is open by default). Click Chats in the toolbar and open Baltic Circuit. Click events in Home.
- **Expected vs actual**: Expected to keep the list and reading pane while chatting. Actually, with sidebar (258px) and dock (350px) both open, the centre is 820px, below the 860px split threshold. Each event now replaces the list and adds a "Back / Home" bar, so reading several events means Back, click, Back, click. Share, Message and Answer all open the dock, so they trigger this too. It is fixed only by hiding the sidebar, and nothing points you there. At 768 the centre drops to 406px with the dock open.
- **Suggested fix**: When the dock opens below 1680px, shrink the sidebar to an icon rail, not the list and reading pane.
- **Screenshot**: shots/crew-09.png

### CREW-6: On phone, actions that open a chat move you to another tab, and back does not return you
- **Severity**: major
- **Viewport**: 375x812
- **Steps to reproduce**: (a) Open a call out and tap Answer, or open a person and tap Message, or open an event, tap Share and pick a chat. (b) In a chat, tap a shared event card.
- **Expected vs actual**: Expected back to return to the call out, person or event you came from. Actually, in (a) you land in the Chats tab, and back goes to the Chats list. Tapping Home then shows the feed with the stack cleared, so the call out or event you were on is gone. In (b) the event opens in the Home tab, and back goes to the Home feed, not the chat. The tab bar is hidden in the conversation, so there is no visible path back.
- **Suggested fix**: Open the conversation as a pushed screen in the current tab, and open event cards from a chat as a pushed screen in Chats, so that one back always returns to where you were.

### CREW-7: Phone scroll positions are lost after back
- **Severity**: major
- **Viewport**: 375x812
- **Steps to reproduce**: On Home (FEED), scroll down to "Coming up" (scrollTop 700) and swipe that shelf sideways (scrollLeft 300). Open an event and tap back. Separately: Horizons, open Baltic Circuit, scroll to 300, open an event, tap back.
- **Expected vs actual**: Expected to return to the same spot. Actually the Home feed comes back at scrollTop 179 with the shelf reset to scrollLeft 0, and the horizon page comes back at the top (0). Only the LIST view keeps its position.
- **Suggested fix**: Save the `#listbody` and `#dscroll` scrollTop and each `.srow` scrollLeft before opening an item, and restore them after back.
- **Screenshot**: shots/crew-05.png (before) and shots/crew-06.png (after back)

### CREW-8: Following people does nothing to the desktop Home
- **Severity**: major
- **Viewport**: 1440x900 (compared with 375x812)
- **Steps to reproduce**: On desktop, go to People and follow Jon Hale and Mira Chen. Go to Horizons and follow "Feeding the Ridge". Go back to Home.
- **Expected vs actual**: Expected their events to show up in a "From people you follow" section. Actually the desktop FEED bands are Happening soon, Announced, Horizons worth following, Call outs and Network news, and none of them depends on who you follow. The only change is that the followed horizon drops out of "Horizons worth following". On phone the "From people you follow" shelf does gain Jon's and Mira's events, but it is the fifth shelf, at the bottom of the feed. In the sidebar and the You tab, both people and the horizon appear correctly.
- **Suggested fix**: Add a "From people you follow" band to the desktop FEED, and on phone move that shelf up to second place.

### CREW-9: A phone conversation has no header actions (members, profile, rename, add people)
- **Severity**: major
- **Viewport**: 375x812
- **Steps to reproduce**: Create the group "Strike crew 2026" with three people and look at the header. Open a DM and look at the header.
- **Expected vs actual**: Expected to see and tap members, add someone, rename the group, and open the DM partner's profile. Actually the app bar shows only the name and "4 members", and the title does nothing when tapped. The pane header that holds member avatars and the profile button (visible on desktop) is hidden by `#app.phone .phead{display:none}`. Desktop can open members but also cannot add people or rename the group.
- **Suggested fix**: Make the app-bar title tappable, opening a chat info sheet with members (each opens their profile), Add people, Rename and Leave.
- **Screenshot**: shots/crew-03.png

### CREW-10: A new account inherits the demo owner's identity and activity
- **Severity**: minor
- **Viewport**: all
- **Steps to reproduce**: On a clean profile, tap Log in.
- **Expected vs actual**: Expected an empty sign-up form and an empty account. Actually the form is prefilled with Name "Michal" and Handle "@mike". Right after joining, Sasha already follows 4 people and 3 horizons, is Hosting 2 events, is Going to 2 and Interested in 1 that she never chose, and is in 3 chats. This makes "what changed when I followed?" impossible to judge, and "Hosting" events she didn't create is confusing.
- **Suggested fix**: Start sign-up with empty Name and Handle, and start new accounts with no follows, RSVPs or hosting. Offer the seeded crews as suggestions she can follow.
- **Screenshot**: shots/crew-01.png

### CREW-11: Sign-up accepts a handle that is already taken
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Join with handle "sasha", then open You, People.
- **Expected vs actual**: Expected an inline "@sasha is taken" error. Actually both Sasha Novak and Sasha Reed are @sasha. The Night Kitchen preview "Sasha: rangers will hold…" now reads as if Sasha herself wrote it.
- **Suggested fix**: Check the handle as it is typed and disable Join while it is taken.
- **Screenshot**: shots/crew-08.png

### CREW-12: The share sheet is limited and pulls you out of the event
- **Severity**: minor
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Open an event, tap Share.
- **Expected vs actual**: Expected to pick any person or chat, optionally add a line of text, and stay on the event. Actually the sheet lists only existing chats (no search, and no way to reach people you have no chat with yet). The card is sent with no text, and you are taken into the chat (on phone that switches tabs; see CREW-6).
- **Suggested fix**: Reuse the New chat picker (search people and chats), add an optional message field, and stay on the event with a toast "Sent to X · Open".

### CREW-13: "Create group" is disabled with no reason, and the placeholder looks like a real name
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Chats, New chat, tick three people.
- **Expected vs actual**: Expected Create group to be available. Actually it is greyed out. The Group name field shows "Ridge build crew" as its placeholder, which looks like a filled-in name, so it is not obvious that the name is what's missing.
- **Suggested fix**: Pre-fill the name from members' first names ("Anna, Kai, Rio") so the button is enabled, and remove the example placeholder.
- **Screenshot**: shots/crew-02.png

### CREW-14: The chat list is ordered by last opened, and empty DMs clutter it
- **Severity**: minor
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Open Night Kitchen (23:52), then go back to the list. Separately: New chat, pick Rio, tap "Message Rio", then back without typing.
- **Expected vs actual**: Expected newest message first, and a DM listed only after something is sent. Actually Night Kitchen jumps above Baltic Circuit (09:31) just because it was opened. An empty "Rio Moss · No messages yet" row stays at the top.
- **Suggested fix**: Sort chats by last message time, and list a new DM only once it has a message.

### CREW-15: One destination has two names, and the New sheet has instruction subtitles
- **Severity**: minor
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Tap New (tab bar) and compare with the "New chat" button in Chats. On a clean profile, tap "Log in".
- **Expected vs actual**: Expected one label per action and no how-to text. Actually the New sheet says "Group chat" with the subtitle "Pick people, name it", yet it opens a dialog titled "New chat" that also makes DMs. Every row in the sheet has an instruction subtitle ("Ask the network for hands", …). "Log in" opens "Join Hypernet".
- **Suggested fix**: Call it "New chat" everywhere, drop the subtitles, and label the button "Join" when no account exists yet.

### CREW-16: Reload loses the open item and the chosen view
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: On Home, switch to LIST, open "First aid refresh", reload.
- **Expected vs actual**: Expected the same event in LIST view. Actually you are on Home FEED with nothing open.
- **Suggested fix**: Put the tab, folder, view and open item in the URL hash; the same entries fix CREW-1.

### CREW-17: Promoting an event has no visible effect beyond the button
- **Severity**: minor
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Open LED forest walk, tap Promote.
- **Expected vs actual**: Expected to see where the promotion appears (a "Promoted by you" list, or the event showing up for followers). Actually a toast says "Promoted to your followers" and the button shows a count of 1. Nothing else changes anywhere: not Home, not the You tab, not the sidebar.
- **Suggested fix**: Add a "Promoted" row under Your events in the sidebar and You tab, and show "Promoted by Anna" on cards in followers' feeds.

### CREW-18: The people directory sits under the You tab on phone
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Try to find a person to follow, starting from Home.
- **Expected vs actual**: Expected to browse people from Home or Search. Actually the only way to browse is You > People, between "Edit profile" and "Your events". Everyone on the network is filed under "You".
- **Suggested fix**: Add a PEOPLE chip to the Home filter row (ALL / EVENTS / HORIZONS / CALL OUTS / PEOPLE), and keep only "People you follow" in the You tab.

### CREW-19: The event verbs scroll out of reach on long phone event pages
- **Severity**: minor
- **Viewport**: 375x812
- **Steps to reproduce**: Open Elsewhere 2027 and scroll down to Tickets.
- **Expected vs actual**: Expected Going, Promote and Share to stay reachable. Actually they are near the top, so you must scroll back up past facts and tickets to act.
- **Suggested fix**: Make the verb bar sticky at the bottom of the event page, just above the tab bar.

### CREW-20: A call out tile shows its title twice
- **Severity**: polish
- **Viewport**: 375x812
- **Steps to reproduce**: Home, CALL OUTS.
- **Expected vs actual**: Expected the title once. Actually the tile reads "LOOKING FOR / Sound engineer", with "Sound engineer" repeated under it, then the truncated "Anna Vale · until Thu…".
- **Suggested fix**: Show only host and deadline under the tile.
- **Screenshot**: shots/crew-07.png

### CREW-21: The event verbs are not the same height
- **Severity**: polish
- **Viewport**: 375x812 and 1440x900
- **Steps to reproduce**: Open any event and measure the verb row.
- **Expected vs actual**: Expected all verbs to share one height and baseline (IA-v2 "Align the action buttons"). Actually Interested and Going are 44px tall, while Promote, Horizon and Share are 48px.
- **Suggested fix**: Use one height token for every button in `.verbs`.

### CREW-22: Some touch targets are too small
- **Severity**: polish
- **Viewport**: 375x812
- **Steps to reproduce**: New chat, pick two people, then try to remove one with the × on its chip. Also check the "New chat" button in the app bar.
- **Expected vs actual**: Expected at least 44x44px. Actually the × is 24x24px and the "New chat" button is 38px tall.
- **Suggested fix**: Give every chip remove button and app-bar button a hit area of at least 44x44px.

## Works well

- **The New chat dialog does DMs and groups in one flow.** Pick one person and the button reads "Message Rio". Pick two or more and the Group name field appears and the button becomes "Create group". The To chips, search, and "Following" people listed first make a three-person crew chat quick to set up.
- **The desktop chat dock behaves like Messenger.** The open conversation and its unsent draft stay put while you browse events in the centre. Group member avatars open that person's page in the centre, as IA-v2 intends. The unread badge on the Chats toggle and tab clears as you read.
- **Feedback on follow and state changes is clear and consistent.** Follow, Unfollow, Promote, Share and Group created each show a short toast. The sidebar and You tab update immediately with the new "Following" and "People you follow" entries. The phone LIST view keeps its scroll position through open and back.
