# Preview review markers

Red numbered boxes for private preview builds. A review aid only. The page does
nothing unless the URL has a `check` query (a query, not a hash, so a Vercel
share redirect keeps it). Put the items in the share link. Never in the code.

`review-markers.js` is loaded last from `index.html`. Leave that script tag and
the file out of any upstream package.

## Format

`?check=` then items separated by `|`. Each item is `target~label`, URL-encoded.

- `target` is a CSS selector, or `t:` plus visible text. Text matches the
  smallest visible clickable element whose trimmed text contains it (otherwise
  any element), case-insensitive.
- `label` is the note. If you omit it, the target text is used.

The notes panel is editable plain text, one numbered line per item, in the
order of the check string: `1. [ ] label`, then `2. [x] label` after that box
is clicked. A target that is not on the screen says `(not on this screen)`.
Numbers do not change when one is dismissed. Each box wears the same number in
a red badge. Feedback goes in the area under the list. Copy adds a header line
(branch or commit when a meta tag or the Vercel host has it, then the page URL
without `_vercel_share`) and keeps the numbers. The bottom-right handle and the
left and top edges resize it (about 220×140, inside the viewport); the text
grows with the panel. On a phone it docks and only the top edge changes height.
Minimize collapses it to a `Review 2/4` pill and keeps the size. Clear all
dismisses every box. Reload keeps the notes, dismissals, position, size and
minimized state for that exact `check` value.

## Examples

Offline landing (Explore):

`?offline=1&check=%23newbtn~New|t:Join%20or%20log%20in~Join%20or%20log%20in|t:Event%20Horizons~Event%20Horizons|t:This%20week~This%20week`

A text target and a selector:
`?check=t:Add%20to%20Chronicle~Try%20Add%20to%20Chronicle|%23newEventBtn~New%20event%20asks%20host%20question`

Event page. Open the cog, the Add to menu, Share, and a past event to attach the ones that are not on the first screen. The question-mark item stays off every screen.

`?offline=1&check=[data-act=evaddto]~Add%20to%20on%20the%20event%20bar|[data-act=evcog]~Cog%2C%20host%20and%20admins|[data-icon=eye]~Eye%20on%20Visibility|.ci.danger~Delete%20last%20in%20the%20cog|[data-act=confirmok]~Delete%20confirm|[data-sharemenu]~Share%20menu%20then%20Boost|t:Add%20people~Add%20people%20on%20a%20past%20event|.helptip-btn~Question%20mark%20should%20be%20off%20this%20screen`
