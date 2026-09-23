// Hypernet — per-event theme system. Load AFTER hypernet-data.js.
// The app frame is deliberately quiet; each event controls its own world.
window.HYPERNET_THEMES = {
  "_schema": {
    "note": "Per-event theme. The app chrome stays neutral; THIS is where an event's personality lives. Discord-like, wilder.",
    "palette": "bg / ink / accent / accent2 / dim — the event owns its whole colour world, not just an accent",
    "square": "pattern + glyph — the thumbnail, drawn procedurally, no image files",
    "surface": "grain | paper | dither | halftone | scanlines | grid | rays | photocopy | plasma | none",
    "type": "serif | grotesk | mono | stencil | display",
    "headline": "huge | condensed | stacked | outlined | marquee",
    "motion": "none | drift | pulse | flicker | scroll",
    "shape": "sharp | rounded | cut",
    "density": "airy | packed",
    "mood": "one line the host writes; render it, it is part of the art"
  },
  "themes": {
    "evt-deep-listening": {
      "mood": "a basement, long tones, no phones",
      "palette": {
        "bg": "#06080e",
        "ink": "#e9e7e0",
        "accent": "#6fd6c8",
        "accent2": "#17233a",
        "dim": "#7d8796"
      },
      "square": {
        "pattern": "moon",
        "glyph": "☾"
      },
      "surface": "grain",
      "type": "serif",
      "headline": "huge",
      "motion": "drift",
      "shape": "sharp",
      "density": "airy"
    },
    "evt-fill-1": {
      "mood": "forty kilos of onions and a two-burner stove",
      "palette": {
        "bg": "#1a0703",
        "ink": "#ffe9d6",
        "accent": "#ff5a1f",
        "accent2": "#7a1b06",
        "dim": "#b4795e"
      },
      "square": {
        "pattern": "stripe",
        "glyph": "⚡"
      },
      "surface": "photocopy",
      "type": "stencil",
      "headline": "condensed",
      "motion": "flicker",
      "shape": "cut",
      "density": "packed"
    },
    "evt-fill-3": {
      "mood": "walk into the trees, the trees walk back",
      "palette": {
        "bg": "#000000",
        "ink": "#d8ffe8",
        "accent": "#39ff88",
        "accent2": "#ff2fd0",
        "dim": "#4c7f66"
      },
      "square": {
        "pattern": "scan",
        "glyph": "✳"
      },
      "surface": "scanlines",
      "type": "mono",
      "headline": "stacked",
      "motion": "flicker",
      "shape": "sharp",
      "density": "packed"
    },
    "evt-fill-0": {
      "mood": "cold air, warm bodies, the sun does the rest",
      "palette": {
        "bg": "#f6f0e4",
        "ink": "#241f18",
        "accent": "#d98d3f",
        "accent2": "#e8dcc4",
        "dim": "#8b8172"
      },
      "square": {
        "pattern": "rays",
        "glyph": "◗"
      },
      "surface": "paper",
      "type": "serif",
      "headline": "huge",
      "motion": "none",
      "shape": "rounded",
      "density": "airy"
    },
    "evt-fill-11": {
      "mood": "if it feeds back we start again",
      "palette": {
        "bg": "#16181a",
        "ink": "#f2f4f2",
        "accent": "#ffd400",
        "accent2": "#2e3438",
        "dim": "#8a9196"
      },
      "square": {
        "pattern": "grid",
        "glyph": "▤"
      },
      "surface": "grid",
      "type": "grotesk",
      "headline": "condensed",
      "motion": "pulse",
      "shape": "sharp",
      "density": "packed"
    },
    "evt-fill-9": {
      "mood": "bring the thing that shouldn't drive",
      "palette": {
        "bg": "#2b1405",
        "ink": "#ffe6c2",
        "accent": "#ff9b2f",
        "accent2": "#6b3410",
        "dim": "#b8875a"
      },
      "square": {
        "pattern": "halftone",
        "glyph": "◉"
      },
      "surface": "halftone",
      "type": "display",
      "headline": "outlined",
      "motion": "drift",
      "shape": "cut",
      "density": "airy"
    },
    "evt-world-burning-man-2026": {
      "mood": "the big one. dust, and then more dust.",
      "palette": {
        "bg": "#3a2a12",
        "ink": "#fdf3df",
        "accent": "#e6b23c",
        "accent2": "#7a5a24",
        "dim": "#b9a077"
      },
      "square": {
        "pattern": "rays",
        "glyph": "✦"
      },
      "surface": "rays",
      "type": "stencil",
      "headline": "huge",
      "motion": "drift",
      "shape": "sharp",
      "density": "airy"
    },
    "evt-world-borderland-2026": {
      "mood": "a nordic field and everyone you know",
      "palette": {
        "bg": "#0d1b2e",
        "ink": "#eaf2ff",
        "accent": "#5ea8ff",
        "accent2": "#12304f",
        "dim": "#7d97b8"
      },
      "square": {
        "pattern": "dither",
        "glyph": "◆"
      },
      "surface": "dither",
      "type": "grotesk",
      "headline": "stacked",
      "motion": "none",
      "shape": "sharp",
      "density": "airy"
    },
    "evt-fill-6": {
      "mood": "quiet work, no photographs",
      "palette": {
        "bg": "#f2eee9",
        "ink": "#1d1a17",
        "accent": "#8b6f4e",
        "accent2": "#ded5c8",
        "dim": "#8d8478"
      },
      "square": {
        "pattern": "plain",
        "glyph": "△"
      },
      "surface": "paper",
      "type": "serif",
      "headline": "huge",
      "motion": "none",
      "shape": "rounded",
      "density": "airy"
    },
    "evt-fill-7": {
      "mood": "one cup, no talking, until the light lands",
      "palette": {
        "bg": "#fbe9d8",
        "ink": "#3a2418",
        "accent": "#c8552f",
        "accent2": "#f3d2b0",
        "dim": "#9c7a62"
      },
      "square": {
        "pattern": "rays",
        "glyph": "◠"
      },
      "surface": "grain",
      "type": "serif",
      "headline": "huge",
      "motion": "drift",
      "shape": "rounded",
      "density": "airy"
    }
  },
  "fallbackNote": "Events without a hand-authored theme get a deterministic one from their id via HN_THEME(id)."
};

(function(){
  var PALS=[{"bg": "#101014", "ink": "#ececf0", "accent": "#a98cff", "accent2": "#2a2440", "dim": "#807c93"}, {"bg": "#0b1410", "ink": "#e4f4ea", "accent": "#48c98a", "accent2": "#17372a", "dim": "#749a86"}, {"bg": "#f4f2ed", "ink": "#1c1c1c", "accent": "#d0452f", "accent2": "#e2ddd2", "dim": "#8a857c"}, {"bg": "#12141f", "ink": "#e8ecff", "accent": "#ff8fb1", "accent2": "#262b45", "dim": "#8288a8"}, {"bg": "#1e1405", "ink": "#ffeed4", "accent": "#d9a441", "accent2": "#4a3412", "dim": "#a98f68"}], SURF=["grain", "dither", "halftone", "scanlines", "grid", "paper"], TYPE=["grotesk", "mono", "serif", "stencil", "display"], HEAD=["huge", "condensed", "stacked", "outlined"], MOT=["none", "drift", "pulse"], SHAPE=["sharp", "rounded", "cut"], PAT=["plain", "stripe", "grid", "dither", "rays", "scan", "halftone", "moon"], GLY=["◆", "✳", "▲", "◉", "✦", "■", "☾", "◗", "⬟", "✜", "◈", "▤"];
  function hash(s){ var v=0; for(var i=0;i<s.length;i++){ v=(v*131+s.charCodeAt(i))>>>0; } return v; }
  window.HN_THEME = function(id){
    var T = window.HYPERNET_THEMES.themes;
    if (T[id]) return T[id];
    var v = hash(id||'x');
    var t = {
      mood: '',
      palette: PALS[v % PALS.length],
      square: { pattern: PAT[(v>>>3) % PAT.length], glyph: GLY[(v>>>7) % GLY.length] },
      surface: SURF[(v>>>11) % SURF.length],
      type: TYPE[(v>>>5) % TYPE.length],
      headline: HEAD[(v>>>13) % HEAD.length],
      motion: MOT[(v>>>17) % MOT.length],
      shape: SHAPE[(v>>>19) % SHAPE.length],
      density: (v>>23 & 1) ? 'packed' : 'airy'
    };
    T[id] = t; return t;
  };
})();
