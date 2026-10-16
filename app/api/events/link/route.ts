import { randomUUID } from "node:crypto";
import { requirePerson } from "@/lib/auth";
import { db, pgCode, schema } from "@/lib/db";
import { eventByLink, eventFor, makeSlug } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { cleanUrl, safeGet, siteOf } from "@/lib/link-event";
import { publicUrl, putObject } from "@/lib/storage";
import { eventLink, IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation";

export const dynamic = "force-dynamic";

// the plain look (HN_PLAIN in _shared/hypernet-themes.js) wearing the event's own picture
const PLAIN = { bg: "#f8f7f3", ink: "#161616", accent: "#262626" };

/**
 * POST /api/events/link {sourceUrl, hostName, title, startsOn, …, imageUrl?} — add an event that already exists
 * elsewhere (owner, 2026-10-16). Nobody here hosts it: it carries the organiser's name, links back to its page and
 * credits the person who added it (added_by), who may correct it. It is public, like the page it came from.
 * The same link twice is one event: the second time answers 200 with the first one.
 */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const { id, sourceUrl, imageUrl, look, details, access, ...body } = eventLink.parse(await readJson(req));
  const url = cleanUrl(sourceUrl);
  const existing = await eventByLink(url, me.id);
  if (existing) return json({ event: existing, existing: true });

  const picture = look?.image ? null : imageUrl ? await copyPicture(imageUrl, me.id) : null;
  const values = {
    ...body,
    ...(id ? { id } : {}),
    slug: makeSlug(body.title),
    hostId: null,
    privacy: "everyone" as const,
    source: "link",
    sourceUrl: url,
    addedBy: me.id,
    access: access ? { ...access, url } : null,
    details: { ...(details ?? {}), externalUrl: url, sourceSite: siteOf(url) },
    look: look ?? (picture ? { ...PLAIN, image: picture, glyph: "◆" } : null),
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [row] = await db().insert(schema.events).values(values).returning({ id: schema.events.id });
      return json({ event: await eventFor(row.id, me.id), existing: false }, 201);
    } catch (err) {
      const code = pgCode(err), constraint = String((err as { cause?: { constraint?: string } }).cause?.constraint ?? "");
      if (code === "23505" && constraint === "events_one_per_link") {
        // someone added the same link a moment ago
        const first = await eventByLink(url, me.id);
        if (first) return json({ event: first, existing: true });
      }
      if (code === "23505" && id && constraint.includes("pkey")) throw new HttpError(409, "exists", "An event with this id exists.");
      if (code === "23514") throw new HttpError(400, "invalid", "A value is not allowed (check the dates).");
      if (code !== "23505") throw err; // a slug collision: try another suffix
      values.slug = makeSlug(body.title);
    }
  }
  throw new HttpError(409, "slug_conflict", "Could not find a free slug; try again.");
});


/** The event's picture from its own page, into our bucket (a look may only show pictures from there). Best effort:
 *  a picture that can't be fetched leaves the event plain. */
async function copyPicture(src: string, ownerId: string): Promise<string | null> {
  try {
    const img = await safeGet(src, { maxBytes: MAX_IMAGE_BYTES, ms: 8000, accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" });
    const ext = IMAGE_TYPES[img.type as keyof typeof IMAGE_TYPES];
    if (!ext || !img.body.byteLength) return null;
    const key = `l/${ownerId}/${randomUUID()}.${ext}`;
    await putObject(key, img.type, img.body);
    const url = publicUrl(key);
    await db().insert(schema.images).values({ ownerId, key, url, mime: img.type, bytes: img.body.byteLength });
    return url;
  } catch (err) {
    console.error("link picture", src, err);
    return null;
  }
}
