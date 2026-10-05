# Pending decisions — v5-callout (2026-10-05)

To merge into `docs/DECISIONS.md`, newest last, in this style.

- **2026-10-05 · A call out's page is the call out.** Owner: "This design hierarchy is all over. There are overflows, too
  many descriptions and weird paddings all over the place … get rid of having a call-out box inside this page and make
  the call out just full screen." The page has no card inside it. Its band is the call out, as wide as the window: the
  one inverted thing (ink ground, paper type), holding the megaphone and "Call out" (and its skill), the ask at 20, its
  line of detail, the event it is for (a thing at 48 that opens it, "For this event") and who asked at 32 with
  "posted 2h ago · open until Mon 26 Oct". Then the grey toolbar — yours: Edit · Close call out · Share; someone
  else's: Answer (puts you in the box) · Share — then the white page with one group box, **Replies · n**: the thread
  (each person at 32, the dotted line from one to the next and on to your box) and the box (your face, "Write a public
  answer" / on your own "Write a reply", Post). Around it one short line at most: "No replies yet.", "Closed: no new
  replies." — the explanations ("When someone answers, their reply shows here…", "Replies show here, under your call
  out, for everyone to see", "Answers are public…") are gone; the box's own words say an answer is public. One edge:
  the band's padding is the page's (24, 16 when the window is narrow), and the replies box has 16 on every side.
  Supersedes "A call out's own page is its card and its Replies box" in 2026-10-04 "A page is a document (B)", and the
  author's name as a toolbar button.
- **2026-10-05 · The call out is a megaphone.** Owner: "Instead of the sound icon use something like a sound amplifier —
  right now it looks like you can toggle some 🎶 on and off." The call-out icon (the title bar, the tag on a card, Call
  outs in the sidebar and Explore, New → Call out, the event's Call out / New call out, Explore's call-out squares,
  the person page's call outs) is a megaphone drawn in the set's 20 grid: a cone, its open bell as an ellipse, a grip
  under it. No sound waves anywhere near it.
- **2026-10-05 · Add to horizon is the horizon with a plus.** Owner: "Add to Horizon icon is looking very broken." The
  old glyph cut its sun short and its plus ran past the icon's edge (clipped at every size). It is now the Event
  Horizons glyph, smaller (sun on the line, two rays, the line under it), with a plus clear of it at the top right,
  inside its 20 box at 16, 20 and 24.
- **2026-10-05 · On an event, a call out says "No replies yet".** Owner: "these overflows and negative spaces are horrible.
  Instead of the reply box, show here something like 'No replies yet'." An event's Call outs section shows each open
  call out as its card with its latest one or two replies (and "View all N replies" past two), or "No replies yet" under
  a hairline. There is no box to answer in on an event page: Answer opens the call out (stacked in the window, ‹ back
  to the event) with its box focused; on your own call out, once someone answered, Reply does the same. The card's
  "Call out" tag never wraps (the date beside it gives way, "open until … · skill"); a card with only its author in its
  foot has the author on the left, not alone at the right. The section has 16 on every side and the cards 16 apart.
  Supersedes "An event with more than one call out shows each card with its latest answers" / "a call out … with its
  whole thread under it … and the box to answer in" in 2026-10-04 "A page is a document (B)", and the box on an event
  of 2026-10-04 "Answering is a public reply".
- **2026-10-05 · The keyboard is not a new layout.** Owner: "If I click 'Reply to the people answering' the keyboard opens
  and then just closes on the phone." Cause: on Android the keyboard shrinks the viewport, which fires `resize`; every
  resize redrew the whole app (`render()`), and the window's page was rebuilt from its HTML — the reply box you had just
  tapped was replaced by a new one, focus went to the page and the keyboard closed. Now a resize that changes only the
  height re-places what hangs on the viewport (the window, the preview bar's room, toasts) and rebuilds nothing; a new
  width is a new layout and redraws as before. And the window's page is rebuilt only when its HTML changed (the box is
  drawn empty and the draft put in after, so typing doesn't change it); when it did change (a new reply arrives while you
  type), the field you were in comes back focused, with your words and caret. Posting on a phone still lets the keyboard
  go, so you see your reply. Nothing listens to `visualViewport`.
