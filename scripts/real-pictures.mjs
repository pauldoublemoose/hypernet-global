#!/usr/bin/env node
// The real events' pictures: the square "profile picture" each real event shows, taken from its own site
// (docs/research/real-event-pictures.md). data/real-events.json names the file (`picture`), the file is in
// data/pictures/. No secrets, no network: it only reads the repo.
//
//   offline  the page shows the file itself (data/pictures/<name>.jpg, accepted by HN_IMAGE).
//   online   a look may only carry a picture in its branch's `images` bucket (`is_look`, db/migrations/0001_init.sql),
//            so each file is uploaded there as real-events/<name>-<sha8>.jpg. The content hash is in the name: a
//            replaced picture gets a new URL, never a stale cached one; the same bytes always get the same URL.
//
//   node scripts/real-pictures.mjs plan <dev|main>   → "file<TAB>url<TAB>content type" per picture (what
//                                                       scripts/real-pictures.sh uploads)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Each branch's storage host — the same as lib/branch.ts (scripts/real-pictures.test.mjs checks they agree). */
export const STORAGE = {
  dev: "https://br-rapid-butterfly-b2sgym8n.storage.c-6.eu-central-1.aws.neon.tech",
  main: "https://br-holy-dawn-b2fwcldg.storage.c-6.eu-central-1.aws.neon.tech",
};
export const BUCKET = "images";
export const PREFIX = "real-events/";
const TYPES = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
/** what a `picture` may be: a file in data/pictures (the same pattern as HN_IMAGE's) */
export const PICTURE = /^data\/pictures\/[a-z0-9-]+\.(jpg|png|webp)$/;

/** The storage URL of one picture file on a branch. */
export function pictureUrl(target, file) {
  if (!STORAGE[target]) throw new Error(`target must be dev or main, not ${target}`);
  if (!PICTURE.test(file)) throw new Error(`not a picture in data/pictures: ${file}`);
  const sha = createHash("sha256").update(readFileSync(join(ROOT, file))).digest("hex").slice(0, 8);
  const ext = extname(file);
  return `${STORAGE[target]}/${BUCKET}/${PREFIX}${basename(file, ext)}-${sha}${ext}`;
}

/** Every real event's picture: { eventId, file, url, contentType }. */
export function realPictures(target) {
  const real = JSON.parse(readFileSync(join(ROOT, "data/real-events.json"), "utf8"));
  const list = Array.isArray(real) ? real : real.events;
  return list
    .filter((e) => e && e.picture && !e.illustrative)
    .map((e) => ({ eventId: e.id, file: e.picture, url: pictureUrl(target, e.picture), contentType: TYPES[extname(e.picture)] }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [cmd, target] = process.argv.slice(2);
  if (cmd !== "plan" || !STORAGE[target]) {
    console.error("usage: node scripts/real-pictures.mjs plan <dev|main>");
    process.exit(1);
  }
  const seen = new Set();
  for (const p of realPictures(target)) {
    if (seen.has(p.file)) continue;
    seen.add(p.file);
    console.log([p.file, p.url, p.contentType].join("\t"));
  }
}
