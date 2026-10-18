import { z } from "zod";

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
  })
  .strict()
  .refine(endsAfterStart, { message: "endsOn is before startsOn", path: ["endsOn"] });

const webUrl = z.string().trim().max(2000).regex(/^https?:\/\/\S+$/i, "a link starting with https://");

/** POST /api/events/autofill: the link to read. */
export const linkRead = z.object({ url: webUrl }).strict();

/** POST /api/events/link: an event that already exists elsewhere, as the person checked it after Autofill. Always
 *  public (the page it came from is), hosted by whoever the page names; `imageUrl` is copied into our storage. */
export const eventLink = z
  .object({
    id: z.uuid().optional(),
    sourceUrl: webUrl,
    hostName: z.string().trim().min(1).max(80),
    imageUrl: webUrl.nullish(),
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
  .refine(endsAfterStart, { message: "endsOn is before startsOn", path: ["endsOn"] });

/** PATCH: any subset of the same fields. Ids, host, slug and timestamps are not editable here — except the host's
 *  name of an event added from a link (nobody here hosts it; whoever added it corrects what the page said). */
export const eventPatch = z
  .object({ ...eventFields, hostName: z.string().trim().min(1).max(80) })
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: "nothing to change" })
  .refine(endsAfterStart, { message: "endsOn is before startsOn", path: ["endsOn"] });

export const eventQuery = z.object({
  from: day.optional(),
  to: day.optional(),
  host: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
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

/** PUT /api/events/:id/rsvp — going / interested / neither, went, the shift taken. */
export const rsvpPut = z
  .object({
    status: z.enum(["going", "interested"]).nullable(),
    went: z.boolean().optional(),
    shiftIndex: z.number().int().min(0).max(500).nullable().optional(),
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

export const replyCreate = z.object({ id: z.uuid().optional(), text: z.string().trim().min(1).max(2000) }).strict();
export const messageCreate = z.object({ id: z.uuid().optional(), body: z.string().trim().min(1).max(4000) }).strict();

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/avif": "avif" } as const;

/** POST /api/images: what the browser is about to upload. image/* only (no SVG: it can carry script). */
export const imageUpload = z
  .object({
    contentType: z.enum(Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES, ...(keyof typeof IMAGE_TYPES)[]]),
    bytes: z.number().int().min(1).max(MAX_IMAGE_BYTES, "10 MB at most"),
  })
  .strict();
