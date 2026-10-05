// Hypernet — looks. Load AFTER hypernet-data.js.
// The app frame is deliberately quiet; an event, horizon or profile may wear a look: three colours and a square.
// A look is flat and serialisable (it becomes a JSON column):  { bg, ink, accent, image, glyph, colors? }
//   colors           (2026-10-05) what the person picked: [page, accent, header], 1 to 3 hex colours, the accent or
//                    the header may be null. When present it is the look; HN_PALETTE (_shared/hypernet-palette.js)
//                    derives every colour of the page from it.
//   bg, ink, accent  hex colours: the page's ground, text and accent as derived from `colors` (kept so the database
//                    CHECK and anything older still read a whole look). Looks saved before 2026-10-05 have no `colors`:
//                    their bg is the page colour and their accent the accent (their ink is now derived too).
//   image            a square picture (a data URL offline, a storage URL online) or null
//   glyph            one character drawn on the square when there is no image
window.HYPERNET_THEMES = {
  "themes": {
    "evt-deep-listening":         { "bg": "#06080e", "ink": "#e9e7e0", "accent": "#6fd6c8", "image": null, "glyph": "☾" },
    "evt-fill-1":                 { "bg": "#1a0703", "ink": "#ffe9d6", "accent": "#ff5a1f", "image": null, "glyph": "⚡" },
    "evt-fill-3":                 { "bg": "#000000", "ink": "#d8ffe8", "accent": "#39ff88", "image": null, "glyph": "✳" },
    "evt-fill-0":                 { "bg": "#f6f0e4", "ink": "#241f18", "accent": "#d98d3f", "image": null, "glyph": "◗" },
    "evt-fill-11":                { "bg": "#16181a", "ink": "#f2f4f2", "accent": "#ffd400", "image": null, "glyph": "▤" },
    "evt-fill-9":                 { "bg": "#2b1405", "ink": "#ffe6c2", "accent": "#ff9b2f", "image": null, "glyph": "◉" },
    "evt-world-burning-man-2026": { "bg": "#3a2a12", "ink": "#fdf3df", "accent": "#e6b23c", "image": null, "glyph": "✦" },
    "evt-world-borderland-2026":  { "bg": "#0d1b2e", "ink": "#eaf2ff", "accent": "#5ea8ff", "image": null, "glyph": "◆" },
    "evt-fill-6":                 { "bg": "#f2eee9", "ink": "#1d1a17", "accent": "#8b6f4e", "image": null, "glyph": "△" },
    "evt-fill-7":                 { "bg": "#fbe9d8", "ink": "#3a2418", "accent": "#c8552f", "image": null, "glyph": "◠" }
  },
  /* people who customised their profile (the rest stay plain) */
  "people": {
    "p-anna": { "bg": "#06080e", "ink": "#e9e7e0", "accent": "#6fd6c8", "image": null, "glyph": "☾" },
    "p-rio":  { "bg": "#12141f", "ink": "#e8ecff", "accent": "#ff8fb1", "image": null, "glyph": "✦" },
    "p-mira": { "bg": "#000000", "ink": "#d8ffe8", "accent": "#39ff88", "image": null, "glyph": "✳" }
  }
};

/* The plain look: what anything wears until someone customises it. Paper, ink, a kind glyph on the square. */
window.HN_PLAIN = { plain: true, bg: "#f8f7f3", ink: "#161616", accent: "#262626", image: null, glyph: "◆" };

/* Any saved look, old or new, in the flat shape. Looks saved before 2026-10-01 were
   { mood, palette:{ bg, ink, accent, accent2, dim }, square:{ pattern, glyph }, surface, type, headline, motion, shape,
     density, backdrop, atmosphere, ornaments, parallax }: their three colours and glyph are kept, the rest is dropped. */
/* The only colours a look may carry: #rgb or #rrggbb, given back as lower-case #rrggbb; anything else is null.
   Colours go into style="" attributes, so nothing else ever gets through (Neon: a CHECK on the same pattern). */
window.HN_HEX = function(v){
  v = String(v == null ? "" : v);
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return ("#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toLowerCase();
  return null;
};
/* The only images a look may carry: a base64 PNG, JPEG, WebP or GIF data URL, or a real event's picture shipped
   with the page (data/pictures/<name>.jpg — offline; online the same picture is in storage); anything else is null.
   (With Neon this also accepts the app's own storage URLs, and nothing else.) */
window.HN_IMAGE = function(v){
  return typeof v === "string" && (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/]+=*$/.test(v) ||
    /^data\/pictures\/[a-z0-9-]+\.(jpg|png|webp)$/.test(v)) ? v : null;
};
window.HN_MIGRATE_LOOK = function(t){
  if (!t || typeof t !== "object") return null;
  var p = t.palette || t, sq = t.square || {}, P = window.HN_PLAIN;
  var hex = function(v, d){ return window.HN_HEX(v) || d; };
  var g = t.glyph || sq.glyph || P.glyph;
  var m = { bg: hex(p.bg, P.bg), ink: hex(p.ink, P.ink), accent: hex(p.accent, P.accent),
            image: window.HN_IMAGE(t.image), glyph: typeof g === "string" && g ? g.slice(0, 4) : P.glyph };
  var c = window.HN_COLORS(t.colors);
  if (c) m.colors = c;
  return m;
};
/* a look's picks, cleaned: [page, accent|null, header|null] with trailing nulls dropped, or null when there is no page
   colour (anything that is not a #hex is dropped, so nothing else reaches a style) */
window.HN_COLORS = function(a){
  if (!Array.isArray(a) || !a.length) return null;
  var c = [0, 1, 2].map(function(i){ return window.HN_HEX(a[i]); });
  if (!c[0]) return null;
  while (c.length > 1 && !c[c.length - 1]) c.pop();
  return c;
};
/* the picks of any look: its own, or for a look from before 2026-10-05 its page and accent colours */
window.HN_LOOK_PICKS = function(t){
  return (t && window.HN_COLORS(t.colors)) || [window.HN_HEX(t && t.bg) || window.HN_PLAIN.bg, window.HN_HEX(t && t.accent)];
};
