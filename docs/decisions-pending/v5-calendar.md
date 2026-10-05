- **2026-10-05 · The List / Calendar switch stays at the top right.** Owner: "When I'm in a list and I click on Calendar,
  the buttons shift around. Let's just keep them in one single place — top right." The switch is always the last thing
  at the top right, the same size and in the same place in List and in Calendar:
  - Desktop and tablet: the right end of the view's heading. A list that also has a calendar (Going / Interested /
    Hosting / Promoted, Explore's Events and Event Horizons, Show all of an event section) keeps the calendar's slot in
    both views: the heading spans the calendar's 1120 (or the white, if narrower), and the list's 720 sits at the
    slot's left, where the calendar starts. Before, the heading followed the container (720 for the list, 1120 for the
    calendar), so the switch jumped 200px at 1440 and further at 1920. The list's own width does not change (720 to
    scan); Sort sits just left of the switch. Beside an open window the heading ends with the list, as before.
    *Merge note: with the shell's left alignment both containers start at the white's left, so only the heading's right
    end (`--hr` in `layoutCentre`) is this decision's; it is the slot's right end whatever the container's left is.*
  - Phone: in the app bar, at its right (before Search where there is one), compact — the app bar's bevel buttons, 44
    tall. The full-width List / Calendar bar under the app bar is gone, which gives the month a row back.
  Supersedes the phone's full-width view switch (the `.ctrow` under Explore's kinds included).
- **2026-10-05 · ‹ Today › lead the calendar's bar.** Owner: "The Today button with the arrows is shifting around based
  on the length of the month. … this is not looking nice." The bar starts with ‹ Today › at its left edge (4 apart, a
  group) and the title follows them: "May 2026", "September 2026", a week or a day never moves them. Day / Week / Month
  and Only mine stay at the right. On a narrow calendar the arrows always step a month (they used to step a day when a
  wider screen had left Day mode behind).
- **2026-10-05 · A narrow calendar's day is a page of its own.** Owner: "When I click on a day on a small screen I don't
  see the bottom selection of the bands. I think we should open up a full-page view of the day and its events there. If
  there is just one event, let's open the event straight away." Where the calendar is narrow (a phone; a tablet, whose
  calendar is under 640):
  - A day with several events opens that day in the calendar's place: "‹ October" (the month you tapped it in) and the
    day's title ("Friday 9 October"), then its events as the list's rows. ‹ October and the back gesture return to the
    month where you were, with that day outlined; opening an event from the day and closing it returns to the day.
  - A day with one event opens the event straight away (the window: a phone's sheet, a tablet's centre); back is the
    month.
  - A day with nothing on is just a date: not a button, nothing happens.
  - The day is in the URL (`?day=`), so back, forward and reload work; a day's link opened cold puts its month under it,
    so back goes to the month, not the tab's front page. On a wide screen the same link opens that day in the Day view.
  - The month's events still list under the grid ("October 13"), to scroll down to. The band that listed a picked day
    under the grid, and its "All of October", are gone.
- **2026-10-05 · A narrow month's events are readable.** Owner: "On Android the page is dark by default and in the
  calendar I can almost see no events there." Beside opting out of the browser's forced dark (shell), the narrow month no
  longer marks events with 6px bars of bare accent colour — the many plain events' accents are near-black, so on a
  darkened page they vanished, and a pale accent was faint on white. Each event is a line in its own look: its ground,
  its text (always AA on it), its accent down the left and a hairline round it so a plain (white) look still reads, with
  the title as far as it fits (12, clipped). Two lines at most; with three or more the second says "+2". Today keeps its
  inverted date; the day you come back from is outlined. The desktop's month, week and day keep their titled blocks.
