import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { HttpError } from "./http";

// Autofill from a link (owner, 2026-10-16: "enter a URL … then click a button for autofill of event details (time,
// host etc)"). Ticket sites describe their events for Google in a schema.org `Event` block (Billetto, Eventbrite,
// Tickster, Resident Advisor …); a page without one still has its og: tags. What can't be read stays empty and the
// person fills it in. Nothing is saved here: this only reads.

/** What a link gives, in the shape of the event form (dates as YYYY-MM-DD, times HH:MM). */
export type LinkDraft = {
  sourceUrl: string;
  site: string; // "billetto.se"
  title: string | null;
  description: string | null;
  startsOn: string | null;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  online: boolean;
  city: string | null;
  region: string | null;
  country: string | null;
  venue: Record<string, unknown> | null;
  access: Record<string, unknown> | null;
  hostName: string | null;
  organizerUrl: string | null;
  imageUrl: string | null;
  /** which fields came from the page (the form says what it could not find) */
  found: string[];
};

/* ---------- the link itself ---------- */

const TRACKING = /^(utm_.*|bref|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_ga|_gl|igshid|si|ref|ref_src|aff|affiliate|source|campaign)$/i;

/** The page's address without tracking parameters or a #fragment: one link is one event. */
export function cleanUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new HttpError(400, "bad_url", "That doesn't look like a link.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new HttpError(400, "bad_url", "Only http and https links.");
  u.hash = "";
  u.username = "";
  u.password = "";
  for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
  u.hostname = u.hostname.toLowerCase();
  return u.toString();
}

export function siteOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/* ---------- fetching it, safely: only public addresses, a few redirects, a size and time limit ---------- */

function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::" || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
    const m = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return m ? privateIp(m[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

export async function assertPublic(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new HttpError(400, "bad_url", "That link points inside a network.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") throw new HttpError(400, "bad_url", "Only links on the usual web ports.");
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((x) => x.address);
  if (!ips.length) throw new HttpError(422, "unreachable", "Couldn't find that site.");
  if (ips.some(privateIp)) throw new HttpError(400, "bad_url", "That link points inside a network.");
}

// A plain bot user agent gets a 403 from Billetto's CloudFront (checked 2026-10-16); a browser's gets the page.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/** GET a public URL, following up to 5 redirects (each one checked again), within `ms` and `maxBytes`. */
export async function safeGet(raw: string, opts: { maxBytes: number; ms?: number; accept?: string }): Promise<{ url: string; type: string; body: Buffer }> {
  let url = new URL(raw);
  const signal = AbortSignal.timeout(opts.ms ?? 8000);
  for (let hop = 0; hop <= 5; hop++) {
    await assertPublic(url);
    let res: Response;
    try {
      res = await fetch(url, { headers: { ...HEADERS, ...(opts.accept ? { Accept: opts.accept } : {}) }, redirect: "manual", signal });
    } catch {
      throw new HttpError(422, "unreachable", "The page didn't answer in time.");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new HttpError(422, "unreachable", "The page sent us somewhere odd.");
      continue;
    }
    if (res.status === 401 || res.status === 403) throw new HttpError(422, "blocked", "That site doesn't let us read its pages. Fill in the details yourself.");
    if (!res.ok || !res.body) throw new HttpError(422, "unreachable", `The page answered ${res.status}.`);
    const len = Number(res.headers.get("content-length") || 0);
    if (len > opts.maxBytes) throw new HttpError(422, "too_big", "That page is too big to read.");
    const chunks: Buffer[] = [];
    let n = 0;
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      n += chunk.byteLength;
      if (n > opts.maxBytes) throw new HttpError(422, "too_big", "That page is too big to read.");
      chunks.push(Buffer.from(chunk));
    }
    return { url: url.toString(), type: (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase(), body: Buffer.concat(chunks) };
  }
  throw new HttpError(422, "unreachable", "Too many redirects.");
}

/** Read a link: fetch the page and parse it. */
export async function readEventLink(raw: string): Promise<LinkDraft> {
  const url = cleanUrl(raw);
  const page = await safeGet(url, { maxBytes: 3 * 1024 * 1024 });
  if (page.type && !/html|xml/.test(page.type)) throw new HttpError(422, "not_a_page", "That link isn't a web page.");
  return parseEventPage(page.body.toString("utf8"), url);
}

/* ---------- reading the page ---------- */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…" };
function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}
/** HTML to plain text: paragraphs and line breaks kept, tags dropped, whitespace tidied. */
function text(s: unknown, max = 5000): string | null {
  if (typeof s !== "string") return null;
  const t = decode(s.replace(/<(br|\/p|\/div|\/li)\b[^>]*>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return t ? t.slice(0, max) : null;
}

function metaTags(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const val = tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1];
    if (key && val != null && !(key in out)) out[key] = decode(val).trim();
  }
  return out;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const first = <T>(v: T | T[] | undefined | null): T | undefined => (Array.isArray(v) ? v[0] : v ?? undefined);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : null);

/** Every schema.org node in the page's JSON-LD blocks (arrays and @graph unpacked). */
function jsonLdNodes(html: string): Obj[] {
  const nodes: Obj[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (isObj(v)) {
      nodes.push(v);
      if (Array.isArray(v["@graph"])) v["@graph"].forEach(walk);
    }
  };
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1].trim()));
    } catch {
      /* a broken block: skip it */
    }
  }
  return nodes;
}
/** Event, MusicEvent, TheaterEvent, Festival … */
function isEventNode(n: Obj): boolean {
  const t = n["@type"];
  return (Array.isArray(t) ? t : [t]).some((x) => typeof x === "string" && (/Event$/.test(x) || x === "Festival"));
}

// The country a page names (code or name, in English or the local language) → ISO code and the time zone its
// events are in. Times on these pages carry an offset; the wall clock is what people read, the zone is for the app.
const COUNTRIES: [string, string, string[]][] = [
  ["SE", "Europe/Stockholm", ["se", "sweden", "sverige"]],
  ["DK", "Europe/Copenhagen", ["dk", "denmark", "danmark"]],
  ["NO", "Europe/Oslo", ["no", "norway", "norge"]],
  ["FI", "Europe/Helsinki", ["fi", "finland", "suomi"]],
  ["DE", "Europe/Berlin", ["de", "germany", "deutschland"]],
  ["GB", "Europe/London", ["gb", "uk", "united kingdom", "great britain", "england", "scotland", "wales"]],
  ["IE", "Europe/Dublin", ["ie", "ireland"]],
  ["NL", "Europe/Amsterdam", ["nl", "netherlands", "nederland"]],
  ["BE", "Europe/Brussels", ["be", "belgium", "belgië", "belgique"]],
  ["FR", "Europe/Paris", ["fr", "france"]],
  ["ES", "Europe/Madrid", ["es", "spain", "españa"]],
  ["PT", "Europe/Lisbon", ["pt", "portugal"]],
  ["IT", "Europe/Rome", ["it", "italy", "italia"]],
  ["CH", "Europe/Zurich", ["ch", "switzerland", "schweiz", "suisse"]],
  ["AT", "Europe/Vienna", ["at", "austria", "österreich"]],
  ["CZ", "Europe/Prague", ["cz", "czechia", "czech republic", "česko", "česká republika"]],
  ["PL", "Europe/Warsaw", ["pl", "poland", "polska"]],
  ["EE", "Europe/Tallinn", ["ee", "estonia", "eesti"]],
  ["LV", "Europe/Riga", ["lv", "latvia", "latvija"]],
  ["LT", "Europe/Vilnius", ["lt", "lithuania", "lietuva"]],
  ["IS", "Atlantic/Reykjavik", ["is", "iceland", "ísland"]],
];
function country(v: unknown): { code: string | null; tz: string | null } {
  const name = str(isObj(v) ? v.name : v);
  if (!name) return { code: null, tz: null };
  const hit = COUNTRIES.find((c) => c[2].includes(name.toLowerCase()));
  return hit ? { code: hit[0], tz: hit[1] } : { code: name.length === 2 ? name.toUpperCase() : name, tz: null };
}

/** "2026-10-17T18:00:00+02:00" → day 2026-10-17, time 18:00 (the clock as written). A UTC "Z" time is moved to `tz`. */
function when(v: unknown, tz: string | null): { day: string | null; time: string | null } {
  const s = str(v);
  if (!s) return { day: null, time: null };
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return { day: null, time: null };
  if (m[2] && /Z$/i.test(s) && tz) {
    const d = new Date(s);
    if (!isNaN(+d)) {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(d).map((x) => [x.type, x.value]));
      return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
    }
  }
  return { day: m[1], time: m[2] ? `${m[2]}:${m[3]}` : null };
}

function image(v: unknown, base: string): string | null {
  const x = first(v as unknown[]);
  const u = str(isObj(x) ? x.url ?? x.contentUrl : x);
  if (!u) return null;
  try {
    const abs = new URL(u, base);
    return abs.protocol === "https:" || abs.protocol === "http:" ? abs.toString() : null;
  } catch {
    return null;
  }
}

/** The price list as the app keeps it (access.model / currency / tiers), or null when the page gives no prices. */
function prices(offers: unknown): Record<string, unknown> | null {
  const list = (Array.isArray(offers) ? offers : offers ? [offers] : []).flatMap((o) =>
    isObj(o) && Array.isArray(o.offers) ? o.offers : [o]).filter(isObj);
  const tiers = list.map((o) => ({ name: str(o.name), price: Number(str(o.price) ?? str(o.lowPrice) ?? NaN), currency: str(o.priceCurrency) }))
    .filter((t) => Number.isFinite(t.price));
  if (!tiers.length) return null;
  const currency = tiers.find((t) => t.currency)?.currency ?? null;
  if (tiers.every((t) => t.price === 0)) return { model: "free" };
  return { model: "ticket", ...(currency ? { currency } : {}), tiers: tiers.map((t) => ({ ...(t.name ? { name: t.name } : {}), price: t.price })) };
}

/** Everything the page says about its event. `url` is the cleaned link it came from. */
export function parseEventPage(html: string, url: string): LinkDraft {
  // the page may know itself by a tidier address (its canonical link, on the same site): that one is the event's
  const canon = html.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i)?.[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if (canon) {
    try {
      const c = cleanUrl(new URL(decode(canon), url).toString());
      if (siteOf(c) === siteOf(url)) url = c;
    } catch {
      /* keep the link as given */
    }
  }
  const meta = metaTags(html);
  const ev = jsonLdNodes(html).find(isEventNode);
  const found = new Set<string>();
  const d: LinkDraft = {
    sourceUrl: url, site: siteOf(url), title: null, description: null, startsOn: null, endsOn: null, startTime: null, endTime: null,
    timezone: null, online: false, city: null, region: null, country: null, venue: null, access: null, hostName: null,
    organizerUrl: null, imageUrl: null, found: [],
  };

  if (ev) {
    const loc = (Array.isArray(ev.location) ? ev.location : [ev.location]).filter(isObj);
    const place = loc.find((l) => l["@type"] !== "VirtualLocation");
    const addr = place && (isObj(place.address) ? place.address : null);
    const c = country(addr?.addressCountry);
    d.timezone = c.tz;
    d.online = !place && loc.some((l) => l["@type"] === "VirtualLocation") || /OnlineEventAttendanceMode$/.test(String(ev.eventAttendanceMode ?? ""));
    const s = when(ev.startDate, d.timezone), e = when(ev.endDate, d.timezone);
    d.title = text(ev.name, 140);
    d.description = text(ev.description);
    d.startsOn = s.day;
    d.startTime = s.time;
    if (e.day && s.day && e.day > s.day) d.endsOn = e.day;
    if (e.time && e.day && s.day && e.day >= s.day) d.endTime = e.time;
    if (place) {
      d.city = str(addr?.addressLocality);
      d.region = str(addr?.addressRegion);
      d.country = c.code;
      const geo = isObj(place.geo) ? place.geo : null;
      const venue: Record<string, unknown> = { name: text(place.name, 200) ?? d.city, addressVisibility: "public" };
      if (str(addr?.streetAddress)) venue.street = str(addr?.streetAddress);
      if (str(addr?.postalCode)) venue.postalCode = str(addr?.postalCode);
      if (geo && Number.isFinite(Number(geo.latitude)) && Number.isFinite(Number(geo.longitude))) {
        venue.lat = Number(geo.latitude);
        venue.lng = Number(geo.longitude);
      }
      if (venue.name) d.venue = venue;
      if (!addr && typeof place.address === "string") d.city = text(place.address, 120);
    }
    const org = first((ev.organizer ?? ev.performer) as unknown[]);
    d.hostName = text(isObj(org) ? org.name : org, 80);
    d.organizerUrl = isObj(org) ? image(org.url, url) : null;
    d.access = prices(ev.offers);
    d.imageUrl = image(ev.image, url);
  }

  // what the schema.org block didn't say, the og: / twitter: tags might
  d.title ??= text(meta["og:title"] ?? meta["twitter:title"] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], 140);
  d.description ??= text(meta["og:description"] ?? meta["description"] ?? meta["twitter:description"]);
  d.imageUrl ??= image(meta["og:image"] ?? meta["og:image:url"] ?? meta["twitter:image"], url);
  if (!d.startsOn) {
    const s = when(meta["event:start_time"] ?? meta["og:event:start_time"] ?? meta["startdate"], d.timezone);
    d.startsOn = s.day;
    d.startTime = s.time;
  }
  d.hostName ??= text(meta["og:site_name"], 80);

  for (const k of ["title", "description", "startsOn", "startTime", "city", "venue", "hostName", "imageUrl", "access"] as const) {
    if (d[k]) found.add(k);
  }
  if (d.online) found.add("online");
  d.found = [...found];
  return d;
}
