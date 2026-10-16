import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { branch, IMAGES_BUCKET, STORAGE_REGION } from "./branch";
import { need } from "./env";

// Neon Object Storage (S3-compatible, branches with the database). The `images` bucket is public-read: anyone
// can GET a picture by its URL, only our server can hand out a short-lived upload URL.
//
// The keys are a *scoped storage credential* (storage:write only, anchored on the main branch so it also works
// on dev) — never the Neon API key, which can manage (and delete) whole projects.
let _s3: S3Client | undefined;

function s3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: STORAGE_REGION,
      endpoint: branch().storageEndpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: need("NEON_STORAGE_ACCESS_KEY_ID"),
        secretAccessKey: need("NEON_STORAGE_SECRET_ACCESS_KEY"),
      },
      // Neon's docs: newer SDKs sign a checksum of an empty body into presigned PUTs, which then rejects the
      // real upload. Only add checksums when an operation requires them.
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  }
  return _s3;
}

/** Store bytes the server itself fetched (a picture from an event's own page). */
export async function putObject(key: string, contentType: string, body: Buffer): Promise<void> {
  await s3().send(new PutObjectCommand({ Bucket: IMAGES_BUCKET, Key: key, ContentType: contentType, ContentLength: body.byteLength, Body: body }));
}

export function publicUrl(key: string): string {
  return `${branch().storageEndpoint}/${IMAGES_BUCKET}/${key}`;
}

/**
 * A PUT URL valid for `expiresIn` seconds. Content-Type and Content-Length are signed into it, so the browser
 * must upload exactly the type and number of bytes it declared (S3 refuses anything else).
 */
export async function presignUpload(key: string, contentType: string, bytes: number, expiresIn = 300) {
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: IMAGES_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: bytes,
    }),
    { expiresIn, signableHeaders: new Set(["content-type", "content-length"]) },
  );
  return {
    url,
    method: "PUT" as const,
    headers: { "Content-Type": contentType },
    expiresIn,
  };
}
