# Pending decisions — v5-retro (2026-10-05)

To be merged into `docs/DECISIONS.md` (newest last), in this order.

- **2026-10-05 · The scrollbar is Windows'.** Owner: "the scrollbar is not looking very retro windows, it seems indented
  IN the window somehow?" With a mouse every scrolling place (the list, the window's page, the sidebar, a chat, a
  dialog's list, a long text box) has the Windows 2000 bar: 16 wide, the dithered track (white and the face grey, one
  pixel each), a raised thumb, raised arrow buttons with a small black triangle (7 by 4, on whole pixels) that press in
  and move the triangle a pixel. A touch screen keeps its own thin overlay bars. Firefox, which can't draw the Windows
  bar, gets its own in the same greys.
  - **The bar sits inside the white's frame, flush against it.** The sunken frame round the white (and every sunken
    field that scrolls) is its real 2px border now, in the same two lines as before, so the bar sits inside it and
    touches it, the way a Windows list box's does. Why it looked indented: the list's frame was painted *over* the list
    (an overlay above its rows, added so a band or a lit row never covered the frame's left edge), and so over the bar
    too — its right and top two pixels went under the frame's white and grey lines, the thumb lost its dark edge and the
    light track ran into a white line: a gutter, not a bar. The rows now scroll inside the border, so nothing can paint
    over the frame and no overlay is needed.
  - Home's 640, the lists' 720 and the 1120 are measured inside the frame (the white itself); the heading's tools and
    the window keep their 16 and 8 from the bar as before (both now also clear the frame's 2).
- **2026-10-05 · Nothing above the first band.** Owner: "i dont like the space above today." The list starts at the
  white's top edge: the first band — Call outs for you, Today, This week, Events — or the first entry where a list has
  no band (Explore's call outs, people). The 16 above it is gone in every list.
- **2026-10-05 · Bands are a grey line (B).** Owner: "i think the grey line everywhere would work better? its not looking
  too cohesive now." A band is no longer a grey block: it is its name in bold and how many (in grey), then one grey
  hairline running to the container's right edge (Windows Explorer's and Outlook's group header), on the white. It
  still stays at the top while its group scrolls under it, white so nothing shows through, and lies over the hairline
  under the entry before it, so a group starts with one line, never two. Call outs for you keeps ‹ › at the line's
  right end. One look for every band: Home's (Call outs for you, Coming up with your people, the day bands, Around the
  network), the lists', Explore's kinds and search's, the agenda's months and the chat list's. Supersedes the "grey, one
  line, the count" of 2026-10-04 "Home has one rhythm (B)": still one line and the count, no longer grey.
- **2026-10-05 · You are an entry like the others.** Your "You: …" line is on the white like every entry, with the same
  hairline under it — no grey fill, which made your lines and the bands one run of grey blocks. It is quieter by being
  shorter (a header line with nothing under it: 8 above and below instead of 16); the avatar stays 32 so the column of
  faces holds.
- **2026-10-05 · Names and titles in a sentence flow as words.** In "You: replied to Webdesigner to create themes for
  hypernet, followed Sebastian" a long title wraps inside the sentence and ", followed Sebastian" carries on right after
  it (on a phone it was left alone on a line: a button is one box, so a long title broke the line around it and wrapped
  as a block). Every name and title inside a sentence on Home is a link to that thing's own address: a click or Enter
  opens it in the window, as before; the address is there for opening it in a new tab.
