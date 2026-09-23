# The event canvas — shared spec for concepts 07–10

Read this alongside `IA.md`. Every concept in this round implements **the same IA** and **the
same theme system**; they differ only in what the frame around them looks like.

---

## The principle

**The application chrome is deliberately quiet. The events are the only colour.**

The app is a neutral frame — greys, hairlines, system type, lots of empty space. Every drop of
personality in the product belongs to the *hosts*. When you scroll a feed you should be able to
tell five events apart at a glance purely by their art, and when you open one you should feel
you have walked into somebody's room.

Reference point: Discord server theming, but wilder. Discord gives you an icon, a banner and an
accent. A host here owns their event's **entire colour world**, its texture, its typeface, its
motion and its shape language.

If a concept's own styling is loud enough to fight the events, the concept is wrong.

---

## The theme object

`_shared/hypernet-themes.js` defines `window.HYPERNET_THEMES` and the helper
`HN_THEME(eventId)`, which returns a hand-authored theme for the ten named events and a stable
generated one for everything else. **Load it after `hypernet-data.js`. Never invent a parallel
theme system** — the whole point of this round is that the four concepts are comparable.

```js
{
  mood:     "a basement, long tones, no phones",   // the host writes this; render it, it is art
  palette:  { bg, ink, accent, accent2, dim },     // the event's whole colour world
  square:   { pattern, glyph },                    // thumbnail, drawn procedurally
  surface:  grain | paper | dither | halftone | scanlines | grid | rays | photocopy | plasma | none,
  type:     serif | grotesk | mono | stencil | display,
  headline: huge | condensed | stacked | outlined | marquee,
  motion:   none | drift | pulse | flicker | scroll,
  shape:    sharp | rounded | cut,
  density:  airy | packed
}
```

Every one of these must have a **visible** effect. A theme field that renders the same as its
neighbour is a bug.

No image files anywhere — backgrounds, textures and patterns are CSS gradients, repeating
gradients, `box-shadow`, inline SVG or canvas. Respect `prefers-reduced-motion` for `motion`.

---

## Where the theme shows up, in increasing intensity

1. **The square** — the thumbnail. Pattern + glyph + palette. Must be legible at 32px and
   striking at 180px.
2. **The row** — a one-line list entry. Gets a colour edge, the glyph, and the accent on the
   title. Enough to be recognisable in a long list; never enough to make the list unreadable.
3. **The card** — a feed tile. Square plus a themed footer.
4. **The event detail — the full takeover.** This is the payoff and it should be genuinely
   dramatic. The event's background, texture, typography, accent and motion own the entire
   content area, edge to edge. The app's own chrome stays put around it, so the effect is
   looking *through a neutral window into somebody's world*.

The detail view must render, all themed: a full-bleed banner using `surface` + `palette`; the
title in the event's `type`/`headline` treatment; the `mood` line as display copy; host, date,
city; description; who's going; which horizons it appears on; and the three verbs.

**The three verbs keep their semantics even when themed:** `[♥ Interested]` and `[✓ Going]` are
a paired toggle on your own state; **Promote** is a separate broadcast action — it bounces the
event back to the top of your followers' feeds — and must stay visually distinct from the pair.
They must remain obviously clickable and readable against whatever palette the host chose;
contrast-check them rather than tinting them blindly.

---

## The host's editor

Creating or editing an event ends in a **Customize** step that exposes every theme field with a
**live preview of the square, the row and the detail view together**. Give it two or three
one-click **presets** with names in the scene's voice, and let the host then break them. This
screen is a selling point of the product, not a settings page — treat it as such.

---

## The IA, unchanged from concept 06

- **Left = things you collected.** Interested / Going / Hosting tiles with live counts, then
  your horizons and the ones you follow. **No people in this pane.**
- **Right = people you know.** Who you follow, clusters, conversations. PROFILE / CHAT toggle.
- **Center = whatever you opened.**
- **Opening is type-determined, always:** event → detail in the center; horizon → detail in the
  center, and an event inside it → event detail in the center; person or group → the *right*
  pane, never the center.
- **The one bridge, one-way:** a person's profile lists their published horizons; clicking one
  opens it in the center.
- **Home feed is always one click away**, in both auth states.
- **Logged out** browses public events freely; actions prompt a login. Never collect a password.
- Search covers both families, visibly grouped: content opens center, people open right.
- No floating windows except dialogs and chats. No "now playing" bar — it was cut for good.
