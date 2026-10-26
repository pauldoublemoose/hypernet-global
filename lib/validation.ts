import { createRequire } from "node:module";
import path from "node:path";
import { z } from "zod";

// Same parser as the page (_shared/map-link.js). Required, not imported, so tsc leaves that script alone.
const requireMap = createRequire(path.join(process.cwd(), "package.json"));
function classifyMap(raw: string): { kind: string } {
  return (requireMap("./_shared/map-link.js") as { classifyMapInput: (s: string) => { kind: string } }).classifyMapInput(raw);
}

// Request shapes. They repeat the database CHECKs on purpose: a bad request gets a readable 400 with the field
// that is wrong, instead of a constraint error from Postgres.

/** #rgb or #rrggbb, any case → lowercase #rrggbb (HN_HEX in _shared/hypernet-themes.js). */
const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "a colour like #1a2b3c")
  .transform((v) => {
    const h = v.slice(1).toLowerCase();
    return h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h}`;
  });

/** Only pictures in our own storage bucket (HN_IMAGE; the database checks the same pattern). */
export const IMAGE_URL = /^https:\/\/br-[a-z0-9-]+\.storage\.c-[0-9]+\.[a-z0-9-]+\.aws\.neon\.tech\/images\/[A-Za-z0-9/_.-]+$/;

/** What the person picked (2026-10-05): the page colour, then an accent and a header colour, each of those two may be
 *  null. bg / ink / accent are what the picks give (HN_PALETTE in _shared/hypernet-palette.js), kept for the CHECK. */
const picks = z
  .array(hex.nullable())
  .min(1)
  .max(3)
  .refine((a) => a[0] !== null, "the first colour is the page's");

export const look = z
  .object({
    bg: hex,
    ink: hex,
    accent: hex,
    image: z.string().regex(IMAGE_URL, "an image uploaded through /api/images").nullish(),
    glyph: z.string().max(4).nullish(),
    colors: picks.nullish(),
  })
  .strip();

const day = z.iso.date(); // YYYY-MM-DD
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "a time like 18:30");
const json = z.record(z.string(), z.unknown());

export const PRIVACY = ["everyone", "friends", "only_me"] as const;
export type Privacy = (typeof PRIVACY)[number];

const AUDIENCE_TOKEN = /^(everyone|friends|fof|followers|list:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|group:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const audienceList = z.array(z.string().trim().toLowerCase().regex(AUDIENCE_TOKEN, "everyone, friends, fof, followers, list:<id>, or group:<id>"));

/** The same rules as audience_ok in db/migrations/0008_friends_privacy.sql. */
export const audience = z
  .object({ include: audienceList, exclude: audienceList })
  .strict()
  .superRefine((a, ctx) => {
    const bad = (message: string, path: "include" | "exclude") =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (a.include.length + a.exclude.length > 20) bad("at most 20 tokens", "include");
    if (new Set(a.include).size !== a.include.length) bad("include repeats a token", "include");
    if (new Set(a.exclude).size !== a.exclude.length) bad("exclude repeats a token", "exclude");
    if (a.exclude.includes("everyone")) bad("everyone is never excluded", "exclude");
    if (a.include.includes("everyone") && a.include.length !== 1) bad("everyone is the whole include list", "include");
  });
export type Audience = z.infer<typeof audience>;

/** The old privacy label, as an audience. everyone is every logged-in person. */
export function audienceFromPrivacy(p: Privacy): Audience {
  if (p === "everyone") return { include: ["everyone"], exclude: [] };
  if (p === "friends") return { include: ["friends"], exclude: [] };
  return { include: [], exclude: [] };
}
export const EVENT_KINDS = [
  "meetup", "build", "workshop", "volunteer_day", "fundraiser", "camp_meeting",
  "burn_night", "town_hall", "decompression", "burn", "sale", "other",
] as const; // EVENTKINDS in index.html

const eventFields = {
  title: z.string().trim().min(1).max(140),
  description: z.string().max(20_000),
  startsOn: day,
  endsOn: day.nullable(),
  startTime: clock.nullable(),
  endTime: clock.nullable(),
  timezone: z.string().min(1).max(64),
  kind: z.enum(EVENT_KINDS),
  tags: z
    .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "a tag id").max(40))
    .max(60)
    .transform((ids) => ids.filter((id, i) => ids.indexOf(id) === i))
    .nullable()
    .optional(),
  schedule: z
    .array(
      z
        .object({
          title: z.string().trim().min(1).max(140),
          start: z.string().regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/, "a date and time like 2026-10-18T18:00"),
          end: z.string().regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/, "a date and time like 2026-10-18T19:00").optional(),
        })
        .strict()
        .refine((b) => !b.end || b.end > b.start, { message: "ends before it starts", path: ["end"] }),
    )
    .max(40)
    .transform((blocks) => (blocks.length ? [...blocks].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0)) : null))
    .nullable()
    .optional(),
  privacy: z.enum(PRIVACY),
  city: z.string().max(120).nullable(),
  region: z.string().max(120).nullable(),
  country: z.string().max(120).nullable(),
  venue: json.nullable(),
  access: json.nullable(),
  whatToBring: z.array(z.string().max(200)).max(50),
  details: json.nullable(),
  look: look.nullable(),
};

const endsAfterStart = (e: { startsOn?: string; endsOn?: string | null }) =>
  !e.startsOn || !e.endsOn || e.endsOn >= e.startsOn;

const URL_MSG = "Only http:// and https:// links.";

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const httpUrl = z.string().trim().max(2000).refine(isHttpUrl, URL_MSG);

const URL_KEYS = new Set(["url", "link", "href", "externalUrl", "organizerUrl", "imageUrl", "sourceUrl"]);

function rejectBadUrls(value: unknown, path: (string | number)[], ctx: z.RefinementCtx, asUrl: boolean) {
  if (value == null) return;
  if (typeof value === "string") {
    if (!asUrl || value.trim() === "") return;
    if (!isHttpUrl(value)) ctx.addIssue({ code: "custom", message: URL_MSG, path });
    return;
  }
  if (Array.isArray(value)) {
    const parent = path[path.length - 1];
    value.forEach((item, i) => {
      rejectBadUrls(item, [...path, i], ctx, parent === "sources" && typeof item === "string");
    });
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      rejectBadUrls(v, [...path, k], ctx, URL_KEYS.has(k));
    }
  }
}

function rejectEventUrls(value: { access?: unknown; details?: unknown; venue?: unknown }, ctx: z.RefinementCtx) {
  for (const key of ["access", "details", "venue"] as const) rejectBadUrls(value[key], [key], ctx, false);
}

export const eventCreate = z
  .object({
    id: z.uuid().optional(), // the browser names what it creates, so it can show it before the server answers
    ...eventFields,
    description: eventFields.description.default(""),
    endsOn: eventFields.endsOn.optional(),
    startTime: eventFields.startTime.optional(),
    endTime: eventFields.endTime.optional(),
    timezone: eventFields.timezone.default("Europe/Stockholm"),
    kind: eventFields.kind.default("meetup"),
    privacy: eventFields.privacy.default("everyone"),
    city: eventFields.city.optional(),
    region: eventFields.region.optional(),
    country: eventFields.country.optional(),
    venue: eventFields.venue.optional(),
    access: eventFields.access.optional(),
    whatToBring: eventFields.whatToBring.default([]),
    details: eventFields.details.optional(),
    look: eventFields.look.optional(),
    audience: audience.optional(),
  })
  .strict()
  .refine(endsAfterStart, { message: "endsOn is before startsOn", path: ["endsOn"] })
  .superRefine(rejectEventUrls);

/** POST /api/events/autofill: the link to read. */
export const linkRead = z.object({ url: httpUrl }).strict();

/** POST /api/maps/resolve: a short https map link. The page parses whatever it opens. */
export const mapResolve = z
  .object({ url: httpUrl })
  .strict()
  .superRefine((v, ctx) => {
    let u: URL;
    try {
      u = new URL(v.url);
    } catch {
      return;
    }
    if (u.protocol !== "https:") {
      ctx.addIssue({ code: "custom", message: "Only https map links.", path: ["url"] });
      return;
    }
    if (classifyMap(v.url).kind !== "short") {
      ctx.addIssue({ code: "custom", message: "Paste a short map link.", path: ["url"] });
    }
  });

/** POST /api/events/link: an event that already exists elsewhere, as the person checked it after Autofill. Always
 *  public (the page it came from is), hosted by whoever the page names; `imageUrl` is copied into our storage. */
export const eventLink = z
  .object({
    id: z.uuid().optional(),
    sourceUrl: httpUrl,
    hostName: z.string().trim().min(1).max(80),
    imageUrl: httpUrl.nullish(),
    ...eventFields,
    description: eventFields.description.default(""),
    endsOn: eventFields.endsOn.optional(),
    startTime: eventFields.startTime.optional(),
    endTime: eventFields.endTime.optional(),
    timezone: eventFields.timezone.default("Europe/Stockholm"),
    kind: eventFields.kind.default("other"),
    city: eventFields.city.optional(),
    region: eventFields.region.optional(),
    country: eventFields.country.optional(),
    venue: eventFields.venue.optional(),
    access: eventFields.access.optional(),
    whatToBring: eventFields.whatToBring.default([]),
    details: eventFields.details.optional(),
    look: eventFields.look.optional(),
  })
  .omit({ privacy: true })
  .strict()
  .refine(endsAfterStart, { message: "endsOn is before startsOn", path: ["endsOn"] })
  .superRefine(rejectEventUrls);

/** PATCH: any subset of the same fields. Ids, host, slug and timestamps are not editable here — except the host's
 *  name of an event added from a link (nobody here hosts it; whoever added it corrects what the page said).
 *  Privacy, who can send invites, and co-creator policy are admin-only. The route rejects them for anyone else. */
export const eventPatch = z
  .object({
    ...eventFields,
    hostName: z.string().trim().min(1).max(80),
    audience: audience.optional(),
    cocreatorPolicy: z.enum(["open", "request"]),
    invitePolicy: z.enum(["admins", "cocreators", "invited"]),
  })
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: "nothing to change" })
  .refine(endsAfterStart, { message: "endsOn is before startsOn", path: ["endsOn"] })
  .superRefine(rejectEventUrls);

export const eventQuery = z.object({
  from: day.optional(),
  to: day.optional(),
  host: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  /** `only` returns past events for the chronicle picker. Omit it and past events stay out. */
  past: z.enum(["only"]).optional(),
});

const handle = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{1,30}$/, "1–30 of a-z 0-9 . _ -");
const profileFields = {
  handle,
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(120).nullable(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30),
  cities: z.array(z.string().trim().min(1).max(80)).max(20),
  look: look.nullable(),
};

/** POST /api/me — join: the profile for the logged-in email. */
export const join = z
  .object({ ...profileFields, bio: profileFields.bio.optional(), skills: profileFields.skills.default([]),
            cities: profileFields.cities.default([]), look: profileFields.look.optional() })
  .strict();

/** PATCH /api/me — Edit profile and Customize your profile. */
export const profilePatch = z
  .object(profileFields)
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: "nothing to change" });

/** PUT /api/events/:id/rsvp — going / interested / neither, went, the shift taken, chronicle role. */
export const rsvpPut = z
  .object({
    status: z.enum(["going", "interested"]).nullable(),
    went: z.boolean().optional(),
    shiftIndex: z.number().int().min(0).max(500).nullable().optional(),
    role: z.enum(["host", "cocreator", "attendee"]).nullable().optional(),
  })
  .strict();

const hzFields = {
  name: z.string().trim().min(1).max(80),
  description: z.string().max(2000),
  published: z.boolean(),
  look: look.nullable(),
  coverEventId: z.uuid().nullable(),
};
export const horizonCreate = z
  .object({ id: z.uuid().optional(), ...hzFields, description: hzFields.description.default(""), published: hzFields.published.default(false),
            look: hzFields.look.optional(), coverEventId: hzFields.coverEventId.optional(), isPersonalDefault: z.boolean().default(false),
            eventIds: z.array(z.uuid()).max(500).default([]) })
  .strict();
export const horizonPatch = z
  .object(hzFields)
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: "nothing to change" });
/** PUT /api/horizons/:id/events — the whole list, in order (add, remove and reorder are one call). */
export const horizonEvents = z.object({ eventIds: z.array(z.uuid()).max(500) }).strict();

const coFields = {
  title: z.string().trim().min(1).max(80),
  body: z.string().max(4000),
  eventId: z.uuid().nullable(),
  skill: z.string().trim().max(80).nullable(),
  expiresOn: day,
  closed: z.boolean(),
};
export const calloutCreate = z
  .object({ id: z.uuid().optional(), ...coFields, body: coFields.body.default(""), eventId: coFields.eventId.optional(),
            skill: coFields.skill.optional(), closed: z.never().optional() })
  .strict();
export const calloutPatch = z
  .object(coFields)
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: "nothing to change" });

/** POST /api/events/:id/admins — invite someone to administer the page. */
export const adminInvite = z.object({ userId: z.uuid() }).strict();
/** POST /api/events/:id/admins/:userId — the invitee accepts or declines. Decline deletes the row. */
export const adminReply = z.object({ status: z.enum(["accepted", "declined"]) }).strict();
/** POST /api/events/:id/demote — an admin sets someone else's co-creator role back to attendee. */
export const demoteBody = z.object({ userId: z.uuid() }).strict();

/** POST /api/events/:id/cocreators — an admin approves or declines a pending co-creator request. */
export const cocreatorReviewBody = z.object({
  userId: z.uuid(),
  action: z.enum(["approve", "decline"]),
}).strict();
/** POST /api/events/:id/invites — a guest invite. Writes event_invites and a DM card. Does not change visibility. */
export const guestInvite = z.object({ personId: z.uuid() }).strict();

export const replyCreate = z.object({ id: z.uuid().optional(), text: z.string().trim().min(1).max(2000) }).strict();
export const messageCreate = z.object({ id: z.uuid().optional(), body: z.string().trim().min(1).max(4000) }).strict();

const listName = z.string().trim().min(1).max(40);
const listDescription = z.string().trim().max(2000);

/** POST /api/lists — a contact list of yours. At most 50. Description is optional. */
export const listCreate = z.object({ id: z.uuid().optional(), name: listName, description: listDescription.optional().default("") }).strict();
/** PATCH /api/lists/:id */
export const listPatch = z.object({ name: listName, description: listDescription.optional() }).strict();

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/avif": "avif" } as const;

/** POST /api/images: what the browser is about to upload. image/* only (no SVG: it can carry script). */
export const imageUpload = z
  .object({
    contentType: z.enum(Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES, ...(keyof typeof IMAGE_TYPES)[]]),
    bytes: z.number().int().min(1).max(MAX_IMAGE_BYTES, "10 MB at most"),
  })
  .strict();
