- **2026-10-05 · One Edit.** Owner: "It is weird how the Publish button changes into a Share button. Instead the private
  or public setting should be in Edit details, or there should be some general Edit button which would allow me to set
  the privacy and also the details and the title and the image, everything. Make this setting simpler." An Event
  Horizon, an event you host and your profile each have **one Edit**: one dialog of sections (not tabs — it is one form,
  saved once), a live preview beside it on a desktop.
  - **Your Event Horizon:** the toolbar is **Add events** (primary — filling it is the job) · **Edit** · **Share** · ⋯.
    Edit holds Details (name, description), **Who can see it** — **Private** (only you; not listed, its link opens for
    nobody else) or **Public** (anyone can find it, open its link and follow it; it shows on your profile) — and Look
    (picture, colours). Your personal list of interested events says it is always private and has no Share. ⋯ holds
    Delete only; "Published ✓" is gone from it and from the right-click menu, which has Edit… instead.
  - **Share is always Share.** On a private horizon it says so ("only you can see it") and offers **Make public and copy
    link**; it never turns into something else. Public horizons, events and call outs copy their link as before.
  - **An event you host:** the toolbar is **Edit** · New call out · Promote · Add to horizon · Share · ⋯; the phone's bar
    is Edit · Call out · ⋯. Edit is one form: Details (title, dates, times, type, where / Online, entry), Words
    (description, bring), Who can see it (Everyone / Friends / Only me), Look. Save changes waits until nothing required
    is missing, marked inline (the 2026-10-04 rules, now over the whole form).
  - **Your profile:** the toolbar and the You tab hold **Edit profile** only: Profile (name, handle, photo, about, what
    you can do, where you are) and Look (colours; the photo is the look's picture). Beside it, **your page as others see
    it** with the unsaved changes (Follow · Message, your presence, nothing pressable). On a phone, **Preview** in the
    footer shows that page full width; **Back to editing** returns to the form as you left it.
  Supersedes the Customize buttons and dialogs (2026-09-28 "Profiles can wear a look", 2026-10-01 "Customize is three
  colours and a square image" as a separate dialog), Edit details, and the horizon's Publish button and ⋯ "Published".
- **2026-10-05 · Colours: one to three picks colour the whole page.** Owner: "you should be able to make the whole page
  some color, not only the header … pick just one color that will color the whole page; if we want we can add another
  color which will add some accent; then a third color; behind the scenes figure out how to make it look good."
  - A look is picked as **Page** (one colour — enough), then **Add accent**, then **Add header colour**; each but the
    page can be removed, and removing the accent keeps the header. Six one-click starting points stay (Plain, Night,
    Sand, Sea, Forest, Neon — Sand is light; "Plain paper" became Plain = no colours). **The text colour is never
    picked**: the editor says "Text colours are chosen for you", and when a mid-tone page had to move, "The page shows
    as ■ a little lighter than your colour, so text stays readable; the header keeps it exactly."
  - **The algorithm** (`HN_PALETTE`, `_shared/hypernet-palette.js`, unit-tested in `scripts/palette.test.mjs`), in
    OKLab / OKLCH: the page is light if black reads better on it than white, else dark; a mid-tone ground is lifted to
    L ≥ 0.72 or lowered to L ≤ 0.45 (and on until black or white has 7.5:1), keeping hue and chroma. The ink is tinted
    with the page's own hue (L 0.23 on light pages, 0.97 on dark) at 7:1 or better, so dragging the colour across the
    middle swaps between two inks that both belong to it — never a surprise flip. Muted text is the ink mixed toward the
    ground as far as 4.6:1 allows; hairlines and tags are the ink (and accent) mixed into the ground. The accent is the
    second pick or the page's hue made colourful (the ink on a grey page), moved in lightness to 4.5:1 where it is text.
    The header is the third pick, or the original pick when the page had to move, or a step deeper / raised; it gets its
    own ink, muted ink and accent by the same rules. AA everywhere (4.5:1 text, 3:1 the title and the square's glyph),
    checked on 1,500 random picks.
  - **The whole page wears it**: the sheet, the band, group boxes' hairlines and captions, labels, muted text, links
    (in the accent), tags, the track list. **Controls stay system chrome** (2026-09-27): the toolbar, every button,
    pressable chip, field and the inverted call-out card put the app's own tokens back, whatever page they are on — a
    bevel button reads the same on every look, and the page's identity is the canvas around it. Plain stays the app's
    white sheet under a paper band.
  - Stored: `look.colors = [page, accent|null, header|null]` beside `bg / ink / accent` (now the colours the picks give,
    so the database CHECK and anything older still read a whole look). Looks saved before have no `colors`: their bg and
    accent are read as the page and the accent, their ink is derived. The API validates `colors` (one to three hex, the
    first required); no migration — `is_look` ignores keys it doesn't know. Supersedes 2026-10-01 "A look is { bg, ink,
    accent, image, glyph }" (extended) and B2's "a look's colours reach only the square and the title band".
- **2026-10-05 · Your face wears your look.** Owner: "After I customise my profile to neon and then click on my profile
  I see nothing, just the default look." Cause: a person's look reached only their page's band; every avatar —
  the You tab's card, the toolbar's account button, the window's title icon, Home's lines, Who's going, replies — drew
  only the look's *photo*, else grey initials, so a look without a photo showed nowhere you see yourself; and your look
  lived under `'self'` while your account's own id (what replies and activity carry) had none. Now a person's face is
  their photo, else **their initials in their look's colours** (the ground and the accent), everywhere and on their own
  page (where a glyph square stood: a glyph said nothing about who it was); your account's id reads your look.
  Supersedes 2026-09-28's "a customised profile shows its square in place of the initials".
- **2026-10-05 · The New event wizard: one primary at a time.** Owner: "Publish event button is not looking nice." The
  footer was Cancel · Back · Next · Publish event in one row on a phone, labels overflowing, waiting ones embossed and
  illegible; the step tabs ("1 · Basics / 2 · Words / 3 · Look optional") overflowed; the header had Discard and ×.
  Now: the steps are three equal short tabs (a number in a ring and a word); the footer has what is still needed on its
  own line, then **Back** (from Words on) and **one primary** in the same place — **Next** on Basics and Words,
  **Publish event** on Look (the Look step says "Optional — a plain page is fine"); waiting buttons are grey but not
  embossed and still say what is missing when pressed. One way out: **×** (or Esc) closes and keeps the draft, and the
  toast "Draft kept · Discard" is where it is thrown away (with Undo). Supersedes 2026-10-04's "Publish appears from
  Words on" and, for this form, R2's "Cancel in the footer, Discard in the title bar" (the call-out and horizon forms
  keep that).
