import { randomUUID } from "node:crypto";
import { requirePerson } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { json, readJson, route } from "@/lib/http";
import { presignUpload, publicUrl } from "@/lib/storage";
import { IMAGE_TYPES, imageUpload, MAX_IMAGE_BYTES } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/images {contentType: "image/webp", bytes: 123456} → a one-time upload URL.
 *
 * The browser then sends the file straight to storage (not through our server):
 *   await fetch(upload.url, { method: upload.method, headers: upload.headers, body: file })
 * and puts `url` into the look (`look.image`). The URL works for 5 minutes, for exactly that type and size.
 */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const { contentType, bytes } = imageUpload.parse(await readJson(req));
  const key = `u/${me.id}/${randomUUID()}.${IMAGE_TYPES[contentType]}`;
  const upload = await presignUpload(key, contentType, bytes);
  const url = publicUrl(key);
  const [image] = await db()
    .insert(schema.images)
    .values({ ownerId: me.id, key, url, mime: contentType, bytes })
    .returning({ id: schema.images.id });
  return json({ id: image.id, url, upload, maxBytes: MAX_IMAGE_BYTES }, 201);
});
