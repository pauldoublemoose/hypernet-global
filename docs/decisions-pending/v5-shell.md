# Pending decisions — v5-shell (2026-10-05)

To be merged into `docs/DECISIONS.md` (newest last), in this order.

- **2026-10-05 · Logged out, a phone has no tabs.** Owner: "When I'm not logged in I don't need to see the bottom bar at
  all." "Also doesn't make sense to be able to click on the profile and see nothing there." Logged out on a phone the
  preview bar (Join free + Log in) is the only bar at the foot of the screen, and keeps clear of the home indicator
  itself. A visitor browses Explore: its kinds across the top, search in the app bar, Show all, and whatever they open
  as the full-screen sheet (above the preview bar). A visitor is never in an account's place, on any screen: `#/you`,
  `#/chats` and a chat's link, `#/going`, `#/interested`, `#/hosting` and `#/promoted` land on Explore before anything is
  drawn (as `#/home` already did), and an old history entry for one (from before logging out) shows Explore and is
  rewritten to say so. A desktop's `#/you` or `#/chats` logged out lands on Explore, not Home. Logged in, the phone keeps
  its five tabs; logging in from the preview bar brings them back. Supersedes the "logged out the phone has four:
  Explore, New, Chats, You" of 2026-10-04 "Logged out, there is no Home", and the "between the page … and the tab bar"
  of 2026-09-27 "Logged out is a preview" (logged out there is no tab bar to sit above).
- **2026-10-05 · Login: the code step.** Owner: "There is this triangle icon all the time. Why? Fix it." "We don't need
  'Use another email'." "'Send a new code' should be unlocked after some time and be aligned at bottom left (vertically
  aligned with the two right buttons)." The ⚠ shows only with an error to say: an empty error line is not drawn at all
  (in the login dialog and every other form). The code step's footer is **Send a new code** at the left, then **Back**
  and **Log in** at the right, all on one line. Send a new code is disabled for 30 seconds after a code went out and
  counts down in its label ("Send a new code (0:30)", figures of one width so it doesn't shiver); then it unlocks, and
  using it sends a new code, says "We sent a new code to …" and waits again. Back returns to the email step with the
  address kept and in its field, which is how a mistyped email is fixed; × closes the dialog. A code that turns out
  wrong stays in its field, under "That code isn't right. Check it, or ask for a new one." Supersedes the code step's
  "Send a new code · Use another email" row and its Cancel (2026-10-04 "Login is an emailed code").
- **2026-10-05 · Everything left-aligned in the white (C).** Owner: "On laptop, make everything left aligned like the
  Explore page — that is very nice." "Explore should be left-aligned with the white rectangle below it." Every view's
  container starts at the white panel's left, at every width: Home keeps its 640 reading measure, lists their 720,
  Explore's overview and every calendar their 1120 — only their left edge is fixed, the room to their right stays white.
  The heading and its subtitle (and the calendar's bar under them) stand on the grey with their left edge on the white
  rectangle's left edge; bands, rows and squares keep their 16 gutter inside the white; the heading's tools still end
  where the rows do. Supersedes 2026-10-04 "The white spans the centre … (C)" in part: "Inside it a view sits in one
  container" stands, but containers are no longer centred, "the heading moves with its view's container … 16 inside
  it" becomes "the heading stands on the white's edge", and "At 1920 Home stays 640 in the middle of the white" becomes
  "at the white's left".
- **2026-10-05 · Opening something never moves the page (C).** Owner: "On desktop clicking Zurich Decompression shifts
  the whole Explore page in a weird way. The padding shifts and the sizes of the icons also shift. This should never
  happen. The new window should just overlay what's behind it and the content underneath should not shift." The list
  keeps its exact place, width, padding, scroll and square sizes whether a window opens, is replaced or closes; nothing
  reflows. The window lies over the right of the white: inset 8 from the white's top, right and bottom (clear of the
  list's scrollbar, so the list can still be scrolled), 440 to 720 wide while the list's first 320 stay in view beside it
  (the avatars, who did what, titles, the call out's Answer). 1440: 720 wide, 420 of the list in view; 1440 with the
  dock: 504, 328 in view; 1280: 688, 328; 1920: 720, the whole 720 list beside it. Where the centre has no room for
  both (a tablet; 1280 with the chat dock open) the window is the centre, as before, clear of a tablet's floating dock
  where it can be. Everything else about the window stands: one at a time, drag it anywhere in the main area, □ or a
  double-click to maximise, ×, Esc and back to close, whichever of window and dock was touched last in front, the
  phone's full-screen sheet. Supersedes 2026-10-04 "The list steps aside for the window (C)" entirely (the list no
  longer moves or narrows; "Closing it gives the list back its centred width" no longer applies).
- **2026-10-05 · One look, light.** Owner: "On Android the page is dark by default and in the calendar I can almost see
  no events there." The app has no dark theme; Android Chrome's "darken web pages" (Auto Dark Mode for web contents) was
  inverting its greys. The page opts out — `<meta name="color-scheme" content="only light">` (before first paint) and
  `:root { color-scheme: only light }` (form controls and scrollbars stay light too), Chrome's documented opt-out — so
  it always renders as designed, in every browser setting. A dark look, if ever, is a decision of its own.
