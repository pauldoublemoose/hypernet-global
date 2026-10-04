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

export const look = z
  .object({
    bg: hex,
    ink: hex,
    accent: hex,
    image: z.string().regex(IMAGE_URL, "an image uploaded through /api/images").nullish(),
    glyph: z.string().max(4).nullish(),
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

/** PATCH: any subset of the same fields. Ids, host, slug and timestamps are not editable here. */
export const eventPatch = z
  .object(eventFields)
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

export const join = z
  .object({
    handle: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{1,30}$/, "1–30 of a-z 0-9 . _ -"),
    displayName: z.string().trim().min(1).max(80),
    bio: z.string().max(120).optional(),
  })
  .strict();

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/avif": "avif" } as const;

/** POST /api/images: what the browser is about to upload. image/* only (no SVG: it can carry script). */
export const imageUpload = z
  .object({
    contentType: z.enum(Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES, ...(keyof typeof IMAGE_TYPES)[]]),
    bytes: z.number().int().min(1).max(MAX_IMAGE_BYTES, "10 MB at most"),
  })
  .strict();
