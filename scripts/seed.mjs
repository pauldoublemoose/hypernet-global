#!/usr/bin/env node
// Seed SQL for a Neon branch, printed as a JSON array of statements (the shape the Neon MCP `run_sql_transaction`
// takes). No secrets, no database connection: it only reads the files in the repo.
//
//   node scripts/seed.mjs main   → the real events only (data/real-events.json, not the illustrative ones), their
//                                  announced next editions, and the curated "Season of burns" horizon. No people.
//   node scripts/seed.mjs dev    → the prototype's mock world on top: the six fixture people and Michal (the demo),
//                                  their events, horizons, follows, friendships, lists, RSVPs, promotions, call outs, replies and chats.
//   node scripts/seed.mjs pictures:<dev|main>
//                                → only the real events' pictures, for a branch that is already seeded: points each
//                                  real event's look (and its next edition's) at its picture in that branch's storage
//                                  (scripts/real-pictures.sh uploads the files first, then runs this).
//   add --sql to print plain SQL instead of JSON.
//
// Real events wear the picture from their own site (data/real-events.json `picture`, scripts/real-pictures.mjs):
// a plain look with that image, or the fixture's look with it on dev.
//
// Ids are derived from the fixture ids (same input → same uuid), and every insert is `on conflict do nothing`,
// so running a seed twice changes nothing. Dates in the mock fixtures (written for 2026-09-20) move with today,
// as the prototype does; real events keep their dates.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { PREFIX as PICTURE_PREFIX, pictureUrl } from "./real-pictures.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DAY = 86400000;

// ---------- helpers (the same rules as index.html) ----------
export function seedUuid(key) {
  const h = createHash("sha1").update("hypernet-seed:" + key).digest("hex").split("");
  h[12] = "5"; // version 5
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16); // RFC 4122 variant
  const s = h.slice(0, 32).join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}
const hashId = (str) => { let n = 0; for (const ch of String(str)) n = (n * 31 + ch.charCodeAt(0)) >>> 0; return n; };
const mix32 = (n) => { n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); return (n ^ (n >>> 16)) >>> 0; };
const seedU = (key) => mix32(hashId(key)) / 4294967296;
export function slugify(t) {
  return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^\s*the\s+/, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}
const normTitle = (t) => String(t || "").toLowerCase().replace(/\b(19|20)\d\d\b/g, "").replace(/^\s*the\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();
const isoDate = (v) => { if (v == null) return null; const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : null; };
const titleCase = (s) => String(s).toLowerCase().replace(/(^|[\s\-/&])([a-zà-ÿ])/g, (_, a, b) => a + b.toUpperCase());
const cityShort = (c) => { if (!c) return ""; const b = String(c).split("|"); return titleCase(b[b.length - 1]); };
const COUNTRY = { SE: "Sweden", US: "USA", ZA: "South Africa", ES: "Spain", AT: "Austria", NO: "Norway", CZ: "Czechia", CH: "Switzerland",
  GB: "United Kingdom", UK: "United Kingdom", DE: "Germany", DK: "Denmark", NL: "Netherlands", LT: "Lithuania", IL: "Israel",
  FR: "France", FI: "Finland", BE: "Belgium", IT: "Italy", PT: "Portugal", PL: "Poland", HU: "Hungary" };
const CITYPOOL = ["Stockholm", "Malmö", "Copenhagen", "Berlin", "Oslo", "Gothenburg", "Amsterdam"];
/* the glyph a plain look wears for its kind (index.html PLAINGLYPH) */
const PLAINGLYPH = { burn: "✦", burn_night: "✳", decompression: "☾", meetup: "◉", build: "▲", workshop: "■", volunteer_day: "✜", fundraiser: "◈",
  camp_meeting: "◗", town_hall: "▤", sale: "⬟", gathering: "✦", other: "◆" };
const KINDS = ["meetup", "build", "workshop", "volunteer_day", "fundraiser", "camp_meeting", "burn_night", "town_hall", "decompression", "burn", "sale", "other"];
const utcDay = (iso) => { const p = String(iso).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
function shiftIso(s, n) {
  const m = typeof s === "string" && s.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  if (!m || !n) return s;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n));
  return d.toISOString().slice(0, 10) + m[4];
}
function shiftDates(o, n) {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === "string") o[k] = shiftIso(v, n);
    else if (v && typeof v === "object") shiftDates(v, n);
  }
}
const HEX = /^#[0-9a-f]{6}$/;
function cleanLook(t) {
  if (!t || typeof t !== "object") return null;
  const hex = (v) => {
    if (typeof v !== "string") return null;
    let h = v.trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(h)) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return HEX.test(h) ? h : null;
  };
  const bg = hex(t.bg), ink = hex(t.ink), accent = hex(t.accent);
  if (!bg || !ink || !accent) return null;
  return { bg, ink, accent, image: null, glyph: typeof t.glyph === "string" && t.glyph ? [...t.glyph].slice(0, 2).join("") : null };
}

// ---------- SQL literals ----------
const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const qj = (v) => (v == null ? "null" : `${q(JSON.stringify(v))}::jsonb`);
const qa = (arr) => `array[${(arr || []).map(q).join(",")}]::text[]`;
const qts = (ms) => `${q(new Date(ms).toISOString())}::timestamptz`;
const insert = (table, row, conflict = "do nothing") => {
  const cols = Object.keys(row);
  return `insert into ${table} (${cols.join(", ")}) values (${cols.map((c) => row[c]).join(", ")}) on conflict ${conflict}`;
};

/** The audience a fixture event stores. A missing one is the old privacy label. */
function audienceOf(e) {
  if (e.audience && Array.isArray(e.audience.include)) {
    return { include: e.audience.include, exclude: Array.isArray(e.audience.exclude) ? e.audience.exclude : [] };
  }
  if (e.privacy === "friends") return { include: ["friends"], exclude: [] };
  if (e.privacy === "only_me") return { include: [], exclude: [] };
  return { include: ["everyone"], exclude: [] };
}

/** The privacy label the audience trigger would write. */
function privacyOf(e) {
  const a = audienceOf(e);
  if (a.include.length === 1 && a.include[0] === "everyone" && a.exclude.length === 0) return "everyone";
  if (a.include.length === 0) return "only_me";
  return "friends";
}

// ---------- the fixtures ----------
function loadFixtures() {
  const w = {};
  w.window = w;
  vm.createContext(w);
  for (const f of ["_shared/hypernet-data.js", "_shared/hypernet-themes.js", "_shared/hypernet-event-details.js"]) {
    vm.runInContext(readFileSync(join(ROOT, f), "utf8"), w, { filename: f });
  }
  const real = JSON.parse(readFileSync(join(ROOT, "data/real-events.json"), "utf8"));
  return { H: w.HYPERNET, DETAILS: w.HYPERNET_DETAILS?.records ?? {}, THEMES: w.HYPERNET_THEMES, PLAIN: w.HN_PLAIN, REAL: Array.isArray(real) ? real : real.events };
}

/** Builds the seed for a target. `now` (ms) fixes the clock (tests); `today` is its date.
 *  `only: "pictures"` returns just the statements that give an already seeded branch the real events' pictures. */
export function buildSeed(target, { now = Date.now(), only = null } = {}) {
  if (target !== "dev" && target !== "main") throw new Error(`target must be dev or main, not ${target}`);
  const mock = target === "dev";
  const { H, DETAILS, THEMES, PLAIN, REAL } = loadFixtures();
  const TODAY = new Date(now).toISOString().slice(0, 10);
  const FIXSHIFT = Math.round((utcDay(TODAY) - utcDay(H.meta.today)) / DAY);
  const isPast = (iso) => iso < TODAY;
  /* when someone did something: `min`..`max` days back (denser toward now), 07:00–22:00 UTC, never after now */
  const seedTs = (key, max = 20, min = 0, flat = false) => {
    const u = seedU(key), d = min + Math.floor((flat ? u : Math.pow(u, 1.35)) * (max - min + 1));
    let ms = utcDay(TODAY) - d * DAY + (7 * 60 + Math.floor(seedU(key + "#m") * 15 * 60)) * 60000;
    if (ms > now - 20 * 60000) ms = now - (20 + Math.floor(seedU(key + "#r") * 280)) * 60000;
    return ms;
  };

  const people = {}; // fixture id -> row values
  const PEOPLE = {};
  if (mock) {
    for (const p of H.people) PEOPLE[p.id] = p;
    PEOPLE["p-michal"] = { id: "p-michal", displayName: "Michal", handle: "mike", bio: H.self.bio, skills: ["EVENT PRODUCTION/PRODUCING"], city: "SWEDEN|STOCKHOLM" };
  }
  const pid = (fid) => seedUuid("person:" + fid);
  const byName = (name) => Object.keys(PEOPLE).find((k) => PEOPLE[k].displayName === name) || null;

  // ----- events: the fixtures (dev), then the real records merged in (by id, then by title), as mergeReal does
  const EVENTS = {}, REC = {}, LOOK = {};
  if (mock) {
    for (const e0 of H.events) {
      const e = { ...e0 };
      const rec = DETAILS[e.id] ? JSON.parse(JSON.stringify(DETAILS[e.id])) : {};
      if (FIXSHIFT && e.kind !== "world") { e.date = shiftIso(e.date, FIXSHIFT); shiftDates(rec, FIXSHIFT); }
      if (rec.hostName) e.hostName = rec.hostName;
      if (e.hostName === "You") e.hostName = "Michal";
      if (!e.city) e.city = CITYPOOL[hashId(e.id) % CITYPOOL.length];
      EVENTS[e.id] = e; REC[e.id] = rec;
      if (THEMES.themes[e.id]) LOOK[e.id] = cleanLook(THEMES.themes[e.id]);
    }
  }
  const REALIDS = [];
  for (const raw of REAL) {
    if (!raw || !raw.title) continue;
    if (raw.illustrative && !mock) continue;
    let id = raw.id && EVENTS[raw.id] ? raw.id : null;
    if (!id) { const nt = normTitle(raw.title); id = Object.keys(EVENTS).find((k) => normTitle(EVENTS[k].title) === nt) || null; }
    if (!id) id = raw.id || "real-" + normTitle(raw.title).replace(/ /g, "-");
    const e = EVENTS[id] || (EVENTS[id] = { id, ownerIds: [], kind: "real" });
    e.title = raw.title;
    if (isoDate(raw.date)) e.date = isoDate(raw.date);
    e.hostName = raw.hostName || raw.organiser?.name || e.hostName || "Hypernet";
    e.description = raw.description || e.description || "";
    e.privacy = raw.privacy || e.privacy || "everyone";
    e.city = raw.city || raw.region || COUNTRY[raw.country] || raw.country || e.city || "";
    e.groups = raw.ownerGroupIds || [];
    REC[id] = JSON.parse(JSON.stringify(raw));
    if (!REALIDS.includes(id) && !raw.illustrative) REALIDS.push(id);
    // its square is the picture from its own site, in this branch's storage (index.html mergeReal does the same offline)
    if (raw.picture && !raw.illustrative && !LOOK[id]?.image) {
      const base = LOOK[id] || { bg: PLAIN.bg, ink: PLAIN.ink, accent: PLAIN.accent, image: null, glyph: PLAINGLYPH[raw.kind] || PLAINGLYPH[raw.scale] || "◆" };
      LOOK[id] = { ...base, image: pictureUrl(target, raw.picture) };
    }
  }
  // next editions of the burns that are over (makeNextEditions)
  const NEXTED = {};
  for (const id of Object.keys(REC)) {
    const r = REC[id], b = r.burn, e = EVENTS[id];
    if (!e || !b || !b.nextEdition || NEXTED[id]) continue;
    const nd = isoDate(b.nextEdition.date), last = isoDate(r.endDate) && r.endDate > e.date ? isoDate(r.endDate) : e.date;
    if (!nd || !isPast(last)) continue;
    const nid = id + "--next", ny = nd.slice(0, 4);
    const title = /\b(19|20)\d\d\b/.test(e.title) ? e.title.replace(/\b(19|20)\d\d\b/, ny) : `${e.title} ${ny}`;
    EVENTS[nid] = { id: nid, title, date: nd, description: e.description, hostName: e.hostName, privacy: e.privacy, audience: e.audience, ownerIds: [], kind: e.kind, city: e.city, prev: id };
    const nr = JSON.parse(JSON.stringify(r));
    nr.id = nid; nr.date = nd; nr.endDate = isoDate(b.nextEdition.endDate) || undefined;
    nr.theme = b.nextEdition.theme ? (typeof b.nextEdition.theme === "object" ? b.nextEdition.theme : { name: b.nextEdition.theme }) : undefined;
    nr.burn.edition = { year: +ny }; delete nr.burn.phases; delete nr.burn.nextEdition;
    delete nr.blocks; delete nr.startTime; delete nr.endTime;
    if (nr.access) {
      const ay = +(nr.access.asOf || 0);
      nr.access.sales = (nr.access.sales || []).filter((sl) => { const l = isoDate(sl.closes) || isoDate(sl.opens); return l ? l >= TODAY : ay >= +ny; });
    }
    nr._prevYear = e.date.slice(0, 4); nr._note = b.nextEdition.note;
    REC[nid] = nr;
    if (LOOK[id]) LOOK[nid] = LOOK[id];
    NEXTED[id] = nid;
  }
  const realIds = REALIDS.map((id) => NEXTED[id] || id);

  // ----- pictures only, for a branch seeded before they existed: each look that should carry a real event's
  // picture gets it (a plain look if it had none). Only looks without a picture, or with an older one of ours, change,
  // so running it twice changes nothing and a picture someone chose is never replaced.
  if (only === "pictures") {
    const ours = `%/images/${PICTURE_PREFIX}%`;
    const stmts = Object.keys(LOOK).filter((id) => LOOK[id]?.image?.includes(`/images/${PICTURE_PREFIX}`)).sort().map((id) => {
      const look = LOOK[id];
      return `update events set look = case when look is null then ${qj(look)} else jsonb_set(look, '{image}', to_jsonb(${q(look.image)}::text)) end ` +
        `where id = ${q(seedUuid("event:" + id))} and look->>'image' is distinct from ${q(look.image)} and (look->>'image' is null or look->>'image' like ${q(ours)})`;
    });
    stmts.push(`insert into _migrations (name) values (${q("pictures-real-events")}) on conflict do nothing`);
    return stmts;
  }
  if (only) throw new Error(`only must be "pictures", not ${only}`);

  // ----- statements
  const out = [];
  const created = {}; // event id -> created ms

  for (const [fid, p] of Object.entries(PEOPLE)) {
    const look = cleanLook(THEMES.people?.[fid]);
    const cities = p.cities || (p.city ? [cityShort(p.city)] : []);
    people[fid] = true;
    out.push(insert("people", {
      id: q(pid(fid)), auth_user_id: q(seedUuid("auth:" + fid)), email: q(`${p.handle}@seed.hypernet.invalid`), handle: q(p.handle),
      display_name: q(p.displayName), bio: q(p.bio ? String(p.bio).slice(0, 120) : null), skills: qa(p.skills), cities: qa(cities),
      look: qj(look), created_at: qts(p.joinedMinutesAgo != null ? now - p.joinedMinutesAgo * 60000 : now - 60 * DAY), // newcomers joined lately (Home: "N people joined")
    }));
  }

  const usedSlugs = new Set();
  const eventIdOf = (id) => seedUuid("event:" + id);
  const order = Object.keys(EVENTS).sort((a, b) => (EVENTS[a].prev ? 1 : 0) - (EVENTS[b].prev ? 1 : 0)); // previous editions first
  for (const id of order) {
    const e = EVENTS[id], r = REC[id] || {};
    const hostFid = byName(e.hostName);
    let slug = e.slug || slugify(e.title) || "event";
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(id).split("-").pop()}`;
    usedSlugs.add(slug);
    const start = isoDate(e.date), endRaw = isoDate(r.endDate);
    const made = hostFid ? seedTs("made|" + id, 60, 2, true) : now - 90 * DAY;
    created[id] = made;
    const kind = KINDS.includes(r.kind) ? r.kind : r.kind ? String(r.kind) : "meetup";
    const tagOk = (id) => typeof id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
    const tags = Array.isArray(r.tags) ? [...new Set(r.tags.filter(tagOk))].slice(0, 60) : null;
    const wall = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
    const schedule = Array.isArray(r.schedule) ? r.schedule.flatMap((b) => {
      if (!b || typeof b.title !== "string" || !b.title.trim() || !wall.test(b.start || "")) return [];
      const o = { title: b.title.trim().slice(0, 140), start: b.start };
      if (wall.test(b.end || "") && b.end > b.start) o.end = b.end;
      return [o];
    }).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0)).slice(0, 40) : null;
    const details = { ...r, _kind: e.kind };
    for (const k of ["id", "title", "date", "endDate", "startTime", "endTime", "timezone", "privacy", "hostName", "description", "whatToBring",
      "kind", "tags", "schedule", "city", "region", "country", "venue", "access", "picture"]) delete details[k];
    out.push(insert("events", {
      id: q(eventIdOf(id)), slug: q(slug), host_id: hostFid ? q(pid(hostFid)) : "null", host_name: q(e.hostName || "Hypernet"),
      title: q(e.title), description: q(r.description || e.description || ""), starts_on: q(start), ends_on: q(endRaw && endRaw > start ? endRaw : null),
      start_time: q(/^\d\d:\d\d/.test(r.startTime || "") ? r.startTime : null), end_time: q(/^\d\d:\d\d/.test(r.endTime || "") ? r.endTime : null),
      timezone: q(r.timezone || H.meta?.timezone || "Europe/Stockholm"), kind: q(kind),
      tags: tags ? qa(tags) : "null", schedule: schedule && schedule.length ? qj(schedule) : "null",
      privacy: `${q(privacyOf(e))}::privacy`,
      audience: `${q(JSON.stringify(audienceOf(e)))}::jsonb`,
      city: q(r.city || cityShort(e.city) || null), region: q(r.region || null), country: q(r.country || null),
      venue: qj(r.venue || null), access: qj(r.access || null),
      what_to_bring: qa(Array.isArray(r.whatToBring) ? r.whatToBring.map(String) : r.whatToBring ? [String(r.whatToBring)] : []),
      details: qj(details), look: qj(LOOK[id] || null), source: q(hostFid ? "user" : "import"),
      previous_edition_id: e.prev ? q(eventIdOf(e.prev)) : "null", created_at: qts(made), updated_at: qts(made),
    }));
  }
  const evUuid = (id) => (EVENTS[id] ? eventIdOf(NEXTED[id] || id) : null);

  // ----- horizons
  const hzRows = [];
  if (mock) {
    for (const h of H.horizons) hzRows.push({ ...h, ownerFid: h.ownerId === "self" ? "p-michal" : h.ownerGroupId ? null : byName(h.ownerName) });
    hzRows.push({ id: "horizon-feed", name: "Feeding the Ridge", description: "Kitchen shifts, tea, and everything that ends in washing up.", isPublished: true, ownerFid: "p-kai", eventIds: ["evt-fill-1", "evt-fill-7", "evt-world-camp-dinner"] });
    hzRows.push({ id: "horizon-surface", name: "Surfaces & Projections", description: "Anything you can throw light at after dark.", isPublished: true, ownerFid: "p-mira", eventIds: ["evt-fill-3", "evt-fill-9", "evt-world-hyperstition-2026"] });
    // a camp's own events land on the camp's horizon
    for (const h of hzRows) if (h.ownerGroupId) for (const [id, e] of Object.entries(EVENTS)) if ((e.groups || []).includes(h.ownerGroupId) && !h.eventIds.includes(id)) h.eventIds.push(id);
  }
  if (realIds.length) {
    const sorted = realIds.slice().sort((a, b) => (EVENTS[a].date < EVENTS[b].date ? -1 : 1));
    hzRows.push({ id: "horizon-season", name: "Season of burns", description: "Burns, decompressions and meetups from the community’s own pages.",
      isPublished: true, ownerFid: null, ownerName: "Hypernet", eventIds: sorted, cover: realIds.find((k) => /burning-man/.test(k)) || realIds[0] });
  }
  for (const h of hzRows) {
    const hid = seedUuid("horizon:" + h.id);
    const pub = h.isPublished ? (h.ownerFid ? seedTs("pub|" + h.id, 30, 0, true) : now - 30 * DAY) : null;
    const coverId = h.cover ? evUuid(h.cover) : null;
    out.push(insert("horizons", {
      id: q(hid), slug: q(h.id.replace(/^horizon-/, "")), owner_id: h.ownerFid ? q(pid(h.ownerFid)) : "null",
      owner_name: q(h.ownerFid ? PEOPLE[h.ownerFid].displayName : h.ownerName || null), name: q(h.name), description: q(h.description || ""),
      is_personal_default: h.isPersonalDefault ? "true" : "false", published_at: pub ? qts(pub) : "null", cover_event_id: coverId ? q(coverId) : "null",
      created_at: qts((pub || now) - 2 * DAY),
    }));
    const ids = [...new Set(h.eventIds.map(evUuid).filter(Boolean))];
    const addAt = pub && ids.length >= 3 ? pub + (0.05 + 0.95 * seedU("add|" + h.id)) * (now - 30 * 60000 - pub) : (pub || now - 30 * DAY);
    ids.forEach((eid, i) => out.push(insert("horizon_events", {
      horizon_id: q(hid), event_id: q(eid), position: String(i), added_by: h.ownerFid ? q(pid(h.ownerFid)) : "null",
      added_at: qts(i >= ids.length - 2 ? addAt : (pub || now) - DAY),
    })));
    if (h.id === "horizon-ridge" && h.ownerFid && PEOPLE[h.ownerFid]) {
      for (const fid of h.collaboratorIds || []) {
        if (!PEOPLE[fid] || fid === h.ownerFid) continue;
        out.push(insert("horizon_collaborators", {
          horizon_id: q(hid), person_id: q(pid(fid)), added_by: q(pid(h.ownerFid)),
          created_at: qts(seedTs("hc|" + fid + "|" + h.id)),
          accepted_at: qts(seedTs("hc|" + fid + "|" + h.id)),
        }));
      }
    }
  }

  if (mock) {
    const CREW = ["p-anna", "p-rio", "p-kai", "p-mira", "p-jon", "p-sasha"];
    const personFid = (fid) => (fid === "self" ? "p-michal" : fid);
    // friendships are their own rows (a < b). Pending stays pending. They are not follows.
    const bondRows = (H.bonds && H.bonds.length) ? H.bonds : (H.friendships || []).map((f) => ({
      a: f[0], b: f[1], requestedBy: f[0], status: "accepted",
    }));
    for (const row of bondRows) {
      const fa = personFid(row.a), fb = personFid(row.b);
      if (!PEOPLE[fa] || !PEOPLE[fb] || fa === fb) continue;
      const ua = pid(fa), ub = pid(fb);
      const lo = ua < ub ? fa : fb, hi = ua < ub ? fb : fa;
      const by = personFid(row.requestedBy);
      const status = row.status === "pending" ? "pending" : "accepted";
      const ms = now - 12 * DAY;
      out.push(insert("friendships", {
        a: q(pid(lo)), b: q(pid(hi)), requested_by: q(pid(by === lo || by === hi ? by : lo)),
        status: q(status), accepted_at: status === "accepted" ? qts(ms) : "null", created_at: qts(ms - DAY),
      }));
    }
    for (const list of H.lists || []) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(list.id)) continue;
      const ms = now - 10 * DAY;
      out.push(insert("contact_lists", { id: q(list.id), owner_id: q(pid("p-michal")), name: q(list.name), created_at: qts(ms) }));
      for (const m of list.memberIds || []) if (PEOPLE[m]) out.push(insert("contact_list_members", {
        list_id: q(list.id), person_id: q(pid(m)), added_at: qts(ms),
      }));
    }
    // follows are the fixture's own edges, not a copy of each friendship
    const follows = new Set();
    const add = (a, b) => { if (a !== b && PEOPLE[a] && PEOPLE[b]) follows.add(a + ">" + b); };
    for (const f of H.follows || []) add(f[0], f[1]);
    for (const f of follows) {
      const [a, b] = f.split(">");
      const ms = seedU("fp|" + a + "|" + b) < 0.55 ? seedTs("fp|" + a + "|" + b) : now - 40 * DAY;
      out.push(insert("person_follows", { follower_id: q(pid(a)), followee_id: q(pid(b)), created_at: qts(ms) }));
    }
    // RSVPs: who the prototype showed as going (a world's participants, else a deterministic few of the crew)
    const base = (id) => {
      const w = H.worlds.find((x) => x.eventId === id);
      const ids = w?.participantIds ? w.participantIds.filter((p) => PEOPLE[p]) : [];
      if (ids.length) return ids;
      const n = hashId(id);
      return CREW.filter((_, i) => (n >> i) & 1);
    };
    const rsvp = new Map();
    for (const id of Object.keys(EVENTS)) {
      if (NEXTED[id] || EVENTS[id].prev) continue;
      const host = byName(EVENTS[id].hostName);
      const past = isPast(isoDate(REC[id]?.endDate) || EVENTS[id].date);
      const made = created[id];
      const after = (key) => (past ? made + DAY : made > now - 20 * DAY ? made + (0.05 + 0.95 * seedU(key + "#a")) * (now - 30 * 60000 - made) : seedTs(key));
      const going = base(id).filter((p) => p !== host);
      going.forEach((p) => rsvp.set(p + "|" + id, { status: "going", ms: after("going|" + p + "|" + id), went: past }));
      const others = CREW.filter((p) => !going.includes(p) && p !== host);
      if (!past && others.length && seedU("int|" + id) < 0.6) { const ip = others[mix32(hashId(id)) % others.length]; rsvp.set(ip + "|" + id, { status: "interested", ms: after("int|" + ip + "|" + id) }); }
      if (!past && going.length && hashId(id) % 17 >= 12) out.push(insert("promotions", { person_id: q(pid(going[0])), event_id: q(evUuid(id)), created_at: qts(after("promo|" + id)) }));
    }
    for (const [id, st] of [["evt-deep-listening", "interested"], ["evt-fill-0", "going"], ["evt-fill-6", "going"]]) if (EVENTS[id]) rsvp.set("p-michal|" + id, { status: st, ms: seedTs("demo|" + id) });
    for (const [k, v] of rsvp) {
      const [p, id] = k.split("|");
      out.push(insert("rsvps", { person_id: q(pid(p)), event_id: q(evUuid(id)), status: `${q(v.status)}::rsvp`, went: v.went ? "true" : "false", updated_at: qts(v.ms) }));
    }
    // horizon follows
    for (const h of hzRows) {
      if (!h.isPublished) continue;
      for (const p of CREW) if (p !== h.ownerFid && seedU("fh|" + p + "|" + h.id) < 0.3) out.push(insert("horizon_follows", { person_id: q(pid(p)), horizon_id: q(seedUuid("horizon:" + h.id)), created_at: qts(seedTs("fh|" + p + "|" + h.id)) }));
    }
    for (const h of ["horizon-baltic", "horizon-dust", "horizon-quiet"]) if (hzRows.some((x) => x.id === h)) out.push(insert("horizon_follows", { person_id: q(pid("p-michal")), horizon_id: q(seedUuid("horizon:" + h)), created_at: qts(now - 25 * DAY) }));
    // call outs and their replies
    const CALLOUTFOR = { "co-sound": "evt-deep-listening", "co-kitchen": "evt-fill-7" };
    const CALLOUTSKILL = { "co-sound": "SOUND/SOUND ENGINEERING / PA", "co-kitchen": "CAMP OPERATIONS/KITCHEN & COOKING" };
    const posted = {};
    for (const c of H.callouts) {
      const author = byName(c.hostName); if (!author) continue;
      posted[c.id] = c.id === H.callouts[0].id ? now - 95 * 60000 : seedTs("co|" + c.id, 9);
      out.push(insert("callouts", {
        id: q(seedUuid("callout:" + c.id)), author_id: q(pid(author)), event_id: CALLOUTFOR[c.id] && EVENTS[CALLOUTFOR[c.id]] ? q(evUuid(CALLOUTFOR[c.id])) : "null",
        title: q(c.title), body: q(c.body || ""), skill: q(CALLOUTSKILL[c.id] || null), expires_on: q(shiftIso(c.expiresAt, FIXSHIFT)),
        created_at: qts(posted[c.id]), updated_at: qts(posted[c.id]),
      }));
    }
    const REPLYSEED = [
      { id: "r-sound-rio", calloutId: "co-sound", author: "p-rio", f: 0.3, text: "I have a 2 kW PA and can do the Saturday. How big is the room?" },
      { id: "r-sound-jon", calloutId: "co-sound", author: "p-jon", f: 0.75, text: "Mixed the Quiet Rooms nights last winter. Happy to take the desk for a set or two." },
      { id: "r-kitchen-mira", calloutId: "co-kitchen", author: "p-mira", f: 0.5, text: "Fed sixty on two burners at Borderland. Can we talk menus this week?" },
    ];
    for (const x of REPLYSEED) {
      if (!posted[x.calloutId]) continue;
      const ms = Math.round(posted[x.calloutId] + x.f * (now - 10 * 60000 - posted[x.calloutId]));
      out.push(insert("callout_replies", { id: q(seedUuid("reply:" + x.id)), callout_id: q(seedUuid("callout:" + x.calloutId)), author_id: q(pid(x.author)), text: q(x.text), created_at: qts(ms) }));
    }
    // the demo's chats: one direct message thread per person (a group chat becomes a DM with whoever spoke last)
    const seen = new Set();
    for (const c of H.chats) {
      const other = c.kind === "dm" ? c.memberIds[0] : c.messages.filter((m) => m.from !== "self").map((m) => m.from).pop();
      if (!other || !PEOPLE[other] || seen.has(other)) continue;
      seen.add(other);
      const [a, b] = [pid("p-michal"), pid(other)].sort();
      const tid = seedUuid("thread:" + a + ":" + b);
      out.push(insert("dm_threads", { id: q(tid), a: q(a), b: q(b), created_at: qts(now - 3 * DAY) }));
      const msgs = c.messages.filter((m) => (m.from === other || m.from === "self") && m.cardType !== "horizon_invite");
      msgs.forEach((m, i) => out.push(insert("messages", {
        id: q(seedUuid("message:" + c.id + ":" + i)), thread_id: q(tid), sender_id: q(pid(m.from === "self" ? "p-michal" : other)),
        body: q(m.text), created_at: qts(now - (msgs.length - i) * 47 * 60000),
      })));
      out.push(insert("thread_reads", { thread_id: q(tid), person_id: q(pid("p-michal")), last_read_at: qts(c.id === "c-kitchen" ? now - DAY : now) }));
    }
  }
  out.push(`insert into _migrations (name) values (${q("seed-" + target)}) on conflict do nothing`);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const arg = args.find((a) => !a.startsWith("--")) || "";
  const stmts = arg.startsWith("pictures:") ? buildSeed(arg.slice(9), { only: "pictures" }) : buildSeed(arg);
  console.log(args.includes("--sql") ? stmts.map((s) => s + ";").join("\n") : JSON.stringify(stmts));
}
