// node --test scripts/real-pictures.test.mjs — the real events' pictures: storage URLs, the seed and the patch.
// No network, no secrets: it only reads the repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PICTURE, STORAGE, realPictures } from "./real-pictures.mjs";
import { buildSeed } from "./seed.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = Date.UTC(2026, 9, 5, 10); // 2026-10-05: the 2026 burns are over, their next editions exist
/* the database's own rule for a look's picture (is_look, db/migrations/0001_init.sql) */
const IS_LOOK_IMAGE = /^https:\/\/br-[a-z0-9-]+\.storage\.c-[0-9]+\.[a-z0-9-]+\.aws\.neon\.tech\/images\/[A-Za-z0-9/_.-]+$/;

test("the storage hosts are lib/branch.ts's", () => {
  const ts = readFileSync(join(root, "lib/branch.ts"), "utf8");
  for (const [name, host] of Object.entries(STORAGE)) {
    const block = ts.slice(ts.indexOf(`  ${name}: {`));
    assert.match(block.slice(0, 400), new RegExp(`storageEndpoint: "${host.replace(/[.]/g, "\\.")}"`), name);
  }
});

test("every picture is a file in data/pictures, every file is someone's, URLs pass is_look and differ per branch", () => {
  const files = readdirSync(join(root, "data/pictures")).map((f) => "data/pictures/" + f).sort();
  for (const target of ["dev", "main"]) {
    const pics = realPictures(target);
    assert.ok(pics.length >= 10);
    assert.deepEqual([...new Set(pics.map((p) => p.file))].sort(), files);
    for (const p of pics) {
      assert.match(p.file, PICTURE);
      assert.match(p.url, IS_LOOK_IMAGE);
      assert.ok(p.url.startsWith(STORAGE[target] + "/images/real-events/"), p.url);
      assert.equal(p.contentType, "image/jpeg");
    }
  }
  assert.notEqual(realPictures("dev")[0].url, realPictures("main")[0].url);
});

test("a fresh main seed gives each real event and its next edition its picture, on a plain look", () => {
  const stmts = buildSeed("main", { now: NOW }).filter((s) => s.startsWith("insert into events "));
  const withPic = stmts.filter((s) => s.includes("/images/real-events/"));
  assert.equal(withPic.length, 16); // 11 pictures, 5 of them burns with a next edition
  for (const s of withPic) assert.match(s, /"bg":"#f8f7f3","ink":"#161616","accent":"#262626","image":"https:\/\/br-holy-dawn-b2fwcldg\.storage\.[^"]+","glyph":"."/);
  // Čarodění has no site of its own with a picture: no look at all
  assert.ok(stmts.some((s) => s.includes("'Čarodění 2026'") && /, null, 'import'/.test(s)));
  // the file path stays out of the event's details
  assert.ok(stmts.every((s) => !s.includes("data/pictures/")));
});

test("on dev a fixture's own look keeps its colours and gains the picture", () => {
  const bm = buildSeed("dev", { now: NOW }).find((s) => s.startsWith("insert into events ") && s.includes("'Burning Man 2026'"));
  assert.match(bm, /"bg":"#3a2a12","ink":"#fdf3df","accent":"#e6b23c","image":"https:\/\/br-rapid-butterfly-b2sgym8n\.storage\.[^"]+\/burning-man-[0-9a-f]{8}\.jpg"/);
});

test("the pictures patch: one guarded update per event, then its _migrations row", () => {
  const stmts = buildSeed("main", { now: NOW, only: "pictures" });
  const ups = stmts.slice(0, -1);
  assert.equal(ups.length, 16);
  for (const s of ups) {
    assert.match(s, /^update events set look = case when look is null then '\{.*\}'::jsonb else jsonb_set\(look, '\{image\}', to_jsonb\('https:\/\/br-holy-dawn-b2fwcldg[^']+'::text\)\) end where id = '[0-9a-f-]{36}' /);
    // idempotent and never over someone's own picture
    assert.match(s, /and look->>'image' is distinct from '[^']+' and \(look->>'image' is null or look->>'image' like '%\/images\/real-events\/%'\)$/);
  }
  assert.equal(stmts.at(-1), "insert into _migrations (name) values ('pictures-real-events') on conflict do nothing");
  assert.throws(() => buildSeed("main", { now: NOW, only: "people" }));
});
