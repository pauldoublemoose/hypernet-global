/* Hypernet — the page palette: one to three picked colours → every colour a page needs (2026-10-05).
   Owner: "pick just one color that will color the whole page; if we want we can add another color which will add some
   accent; then a third color; behind the scenes figure out how to make it look good."

   A pure function, no DOM: HN_PALETTE(page, accent?, header?) with #rrggbb strings (an accent or header may be null).
   It works in OKLab / OKLCH (Björn Ottosson's perceptual space), where "lighter", "more colourful" and "the same hue"
   mean what the eye sees, so moving a colour keeps it recognisably itself. Contrast is still judged by WCAG 2
   (relative luminance), because that is the rule the text has to pass.

   THE DERIVATION
   1. Ground. Colour 1 is the page. A colour lighter than the WCAG midpoint (luminance ≥ 0.179, where black and white
      read equally) is a LIGHT page; darker is a DARK page. Mid-tones are where no text colour reads well with a muted
      line beside it, so the ground keeps out of them: a light page is lifted to OKLab L ≥ 0.72, a dark one lowered to
      L ≤ 0.45 (and a little further while pure black or white would read under 7.5:1 on it — greens and yellows are
      brighter than their lightness says), keeping its hue and chroma. Most picks are untouched; `nudged` says when.
   2. Text. Never picked, never a surprise: dark ink on a light page, light ink on a dark one, both tinted with the
      ground's own hue (OKLCH L 0.23 / 0.97, a little of its chroma), pushed further only if it would fall under 7:1.
      Dragging colour 1 across the midpoint therefore swaps between two inks that both belong to the colour.
   3. Muted text: the ink mixed toward the ground (in OKLab) as far as it can go and still keep 4.6:1.
   4. Lines: the ink mixed into the ground — 26–34% for group-box borders (`rule`), 12–16% for row separators
      (`line`), 6% for hover; tags (`chip`) are the ground moved 5% (light) or 14% (dark) toward the ink, with 12% of
      the accent, or plain 8% of the ink if that would cost the tag's text its 4.5:1.
   5. Accent. Colour 2 when given; else made from the ground's hue (L 0.52 on light pages, 0.78 on dark, chroma
      0.09–0.19), or the ink itself when the page is grey. `accent` is the colour as a fill (the square's glyph,
      bullets, marks); `accentInk` is the same hue moved in lightness until it reads as text (4.5:1) on the ground.
   6. Header (the band with the square and the title). Colour 3 when given, exactly as picked; else, when step 1 had to
      move the page off colour 1, colour 1 itself — the colour you chose stays, at full strength, where the type is
      large; else colour 1 a step deeper on a light page (L −0.06, a little more chroma) or a step raised on a dark one
      (L +0.06, at least 0.21 so a black page still shows its band). The header gets its own ink, muted ink and accent
      by the same rules, each checked against it (a mid-tone header can only take black or white ink: still ≥ 4.5:1).
   7. The square (an event's or a horizon's tile in lists): the ground with the accent as its glyph, the glyph kept
      at 3:1 (a graphic, not text).
   Out-of-gamut colours are brought back into sRGB by lowering chroma only (same lightness, same hue). */
(function(root){
  'use strict';
  var HEX = /^#[0-9a-f]{6}$/;
  function hex6(v){
    v = String(v == null ? '' : v).trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(v)) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    return HEX.test(v) ? v : null;
  }
  function rgbOf(h){ return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function hexOf(rgb){ return '#' + rgb.map(function(v){ v = Math.round(Math.max(0, Math.min(255, v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function toLin(c){ c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toGam(c){ return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); }
  /* sRGB hex → OKLab [L, a, b] */
  function lab(h){
    var c = rgbOf(h).map(toLin);
    var l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
    var m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
    var s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  /* OKLab → linear sRGB (may fall outside 0..1) */
  function linOfLab(L, a, b){
    var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    var m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    var s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    return [ 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  }
  function inGamut(c){ return c.every(function(v){ return v >= -0.0005 && v <= 1.0005; }); }
  function lch(h){ var o = lab(h), C = Math.sqrt(o[1] * o[1] + o[2] * o[2]); return { L:o[0], C:C, h: C < 1e-4 ? 0 : Math.atan2(o[2], o[1]) }; }
  /* OKLCH → hex, lowering chroma (never lightness or hue) until it is a colour a screen can show */
  function fromLch(L, C, h){
    L = Math.max(0, Math.min(1, L)); C = Math.max(0, C);
    var at = function(c){ return linOfLab(L, c * Math.cos(h), c * Math.sin(h)); };
    var lin = at(C);
    if (!inGamut(lin)){
      var lo = 0, hi = C;
      for (var i = 0; i < 24; i++){ var mid = (lo + hi) / 2; if (inGamut(at(mid))) lo = mid; else hi = mid; }
      lin = at(lo);
    }
    return hexOf(lin.map(function(v){ return toGam(Math.max(0, Math.min(1, v))); }));
  }
  function mix(a, b, t){ var x = lab(a), y = lab(b); return labHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  function labHex(L, a, b){ var C = Math.sqrt(a * a + b * b); return fromLch(L, C, C < 1e-4 ? 0 : Math.atan2(b, a)); }
  /* WCAG 2 */
  function lum(h){ var c = rgbOf(h).map(toLin); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b){ var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function isLight(h){ return contrast(h, '#000000') >= contrast(h, '#ffffff'); }

  var LIGHT_MIN = 0.72, DARK_MAX = 0.45;
  function surf(h){ return { hex:h, light:isLight(h), c:lch(h) }; }
  /* 1. the page's ground: the pick, kept out of the mid-tones on its own side */
  function ground(h){
    var c = lch(h), light = isLight(h), L = light ? Math.max(c.L, LIGHT_MIN) : Math.min(c.L, DARK_MAX), x = h;
    if (Math.abs(L - c.L) > 1e-6) x = fromLch(L, c.C, c.h);
    /* and far enough that a body ink of 7:1 exists (black or white itself 7.5:1): greens and yellows are brighter than
       their OKLab lightness says, so they may need a little more */
    var end = light ? '#000000' : '#ffffff';
    for (var i = 0; i < 60 && contrast(x, end) < 7.5; i++){ L += light ? 0.01 : -0.01; x = fromLch(L, c.C, c.h); }
    return surf(x);
  }
  /* move a colour's lightness (same hue, same chroma where it fits) toward white or black until it reaches `need` on `on` */
  function reach(h, on, need, toLight){
    if (contrast(h, on) >= need) return h;
    var c = lch(h);
    for (var i = 1; i <= 100; i++){
      var x = fromLch(toLight ? c.L + (1 - c.L) * i / 100 : c.L * (1 - i / 100), c.C, c.h);
      if (contrast(x, on) >= need) return x;
    }
    return toLight ? '#ffffff' : '#000000';
  }
  /* 2. the ink for a surface: its own hue, a little of its chroma; 7:1 where the surface allows (a mid-tone header
     only allows black or white, which still give 4.5:1 or more) */
  function inkFor(g){
    var c = g.c, ink = g.light ? fromLch(0.23, Math.min(c.C * 0.35, 0.035), c.h) : fromLch(0.97, Math.min(c.C * 0.25, 0.02), c.h);
    return reach(ink, g.hex, 7, !g.light);
  }
  /* 3. muted text: as far toward the surface as 4.6:1 allows (never more than 60% of the way) */
  function dimFor(ink, h){
    var lo = 0, hi = 0.6;
    if (contrast(mix(ink, h, hi), h) >= 4.6) return mix(ink, h, hi);
    for (var i = 0; i < 20; i++){ var mid = (lo + hi) / 2; if (contrast(mix(ink, h, mid), h) >= 4.6) lo = mid; else hi = mid; }
    return mix(ink, h, lo);
  }
  /* 5. the default accent: the ground's hue, made colourful; a grey page takes its ink */
  function accentFrom(g, ink){
    if (g.c.C < 0.035) return ink;
    return fromLch(g.light ? 0.52 : 0.78, Math.max(0.09, Math.min(0.19, g.c.C * 1.3)), g.c.h);
  }
  /* 6. the header when nobody picked one: the pick itself when the page had to be moved off it (so the colour you chose
     is still there, at full strength, where the title is large), else a step deeper (light) or raised (dark) */
  function headerFrom(g, page){
    if (g.hex !== page) return page;
    var c = g.c;
    return g.light ? fromLch(Math.max(c.L - 0.06, 0.66), c.C * 1.15, c.h) : fromLch(Math.max(c.L + 0.06, 0.21), c.C, c.h);
  }

  function HN_PALETTE(page, accent, header){
    page = hex6(page) || '#f8f7f3'; accent = hex6(accent); header = hex6(header);
    var g = ground(page), ink = inkFor(g);
    var acc = accent || accentFrom(g, ink);
    var b = surf(header || headerFrom(g, page)), bink = inkFor(b);
    /* tags: a little lifted (or sunk) toward the ink, then tinted with the accent; their text keeps 4.5:1 */
    var chip = mix(mix(g.hex, ink, g.light ? 0.05 : 0.14), acc, 0.12);
    if (contrast(ink, chip) < 4.5) chip = mix(g.hex, ink, 0.08);
    var ac = lch(acc), white = fromLch(0.99, 0, 0), dark = fromLch(0.2, Math.min(ac.C * 0.3, 0.03), ac.h);
    return {
      dark: !g.light, nudged: g.hex !== page,
      bg: g.hex, ink: ink, dim: dimFor(ink, g.hex),
      accent: acc, accentInk: reach(acc, g.hex, 4.5, !g.light), onAccent: contrast(white, acc) >= contrast(dark, acc) ? white : dark,
      rule: mix(g.hex, ink, g.light ? 0.26 : 0.34), line: mix(g.hex, ink, g.light ? 0.12 : 0.16), hover: mix(g.hex, ink, 0.06),
      chip: chip,
      band: b.hex, bandInk: bink, bandDim: dimFor(bink, b.hex), bandAccent: reach(acc, b.hex, 4.5, !b.light),
      bandRule: mix(b.hex, bink, b.light ? 0.26 : 0.30),
      /* 7. the square: the ground, its glyph the accent at 3:1 */
      sq: g.hex, sqGlyph: reach(acc, g.hex, 3, !g.light)
    };
  }
  HN_PALETTE.contrast = contrast;
  HN_PALETTE.hex = hex6;
  HN_PALETTE.mix = mix;
  HN_PALETTE.lch = lch;
  HN_PALETTE.fromLch = fromLch;
  HN_PALETTE.isLight = isLight;
  root.HN_PALETTE = HN_PALETTE;
  if (typeof module === 'object' && module.exports) module.exports = HN_PALETTE;
})(typeof window !== 'undefined' ? window : globalThis);
