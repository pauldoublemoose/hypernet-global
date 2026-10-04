#!/usr/bin/env node
// Push the app's secrets from the encrypted .env.enc to the Vercel project — run by the owner, in his terminal.
//
//   node scripts/env-push.mjs production --dry-run     # key names only, nothing sent
//   node scripts/env-push.mjs production               # send
//   node scripts/env-push.mjs preview | development
//
// How it works
//   1. `sops -d` decrypts .env.enc in memory (nothing is written to disk). For production, an optional
//      .env.production.enc is decrypted too; its keys win.
//   2. A key with a `_MAIN` part holds the value of the Neon `main` branch (production). For production it
//      replaces the plain key (DATABASE_URL_MAIN → DATABASE_URL); for preview/development it is left out, so
//      previews and local dev use the `dev` branch. Production refuses to start without DATABASE_URL_MAIN.
//   3. Keys only the tooling uses (SKIP below) never go to Vercel. Empty values are never sent (an empty value
//      would blank a variable set by hand in the dashboard).
//   4. Each value goes to `vercel env add KEY TARGET --force` on stdin — never on the command line, never
//      printed. VERCEL_TOKEN from .env.enc logs the CLI in, so no `vercel login` is needed.
//   Exits non-zero on the first failure. Variables apply on the next deploy.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const TARGETS = ["production", "preview", "development"];

/** Never sent to Vercel: tooling keys, and things the running app does not read. */
export const SKIP = new Set([
  "NEON_API_KEY", // manages every Neon project of the account: never in an app runtime
  "NEON_PROJECT_ID", // tooling (the app has it in lib/branch.ts)
  "VERCEL_TOKEN", // used by this script to log the CLI in
  "DATABASE_URL_UNPOOLED", // migrations only (scripts/sql-payload.mjs through with-secrets), never at runtime
  // RESEND_API_KEY + EMAIL_FROM do go: app/api/hooks/neon-auth sends the login email once that webhook is on
]);

/** Keys production must take from the main branch — sending the dev value there would be a disaster. */
export const MUST_COME_FROM_MAIN = ["DATABASE_URL"];

// The project this repo deploys to (the same ids as .vercel/project.json; not secret).
const VERCEL_ORG_ID = "team_HTPoNl4AIqaUhP5C1qViXPRl";
const VERCEL_PROJECT_ID = "prj_gUA1v1ZmBbdvuJZQ3B12nqwQrKze";

const MAIN_PART = /_MAIN(?=_|$)/;

/** dotenv text → Map. Comments and blank lines ignored, outer quotes removed, `=` inside values kept. */
export function parseDotenv(text) {
  const out = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) v = v.slice(1, -1);
    out.set(m[1], v);
  }
  return out;
}

/**
 * What to send for a target. Returns { send: [{key, value, from}], skipped: [{key, reason}], errors: [] }.
 * `from` is the source key (e.g. DATABASE_URL_MAIN) — printable; `value` is not.
 */
export function plan(target, base, overlay = new Map()) {
  if (!TARGETS.includes(target)) throw new Error(`unknown target "${target}" (${TARGETS.join(" | ")})`);
  const chosen = new Map(); // key → {value, from}
  const skipped = [];
  const errors = [];

  for (const [key, value] of base) {
    if (MAIN_PART.test(key)) continue; // handled below
    chosen.set(key, { value, from: key });
  }
  for (const [key, value] of base) {
    if (!MAIN_PART.test(key)) continue;
    if (target !== "production") {
      skipped.push({ key, reason: "main-branch value (production only)" });
      continue;
    }
    chosen.set(key.replace(MAIN_PART, ""), { value, from: key });
  }
  if (target === "production") {
    for (const [key, value] of overlay) chosen.set(key, { value, from: `${key} (.env.production.enc)` });
    for (const key of MUST_COME_FROM_MAIN) {
      const c = chosen.get(key);
      if (!c || c.value === "" || c.from === key) {
        errors.push(`${key}: ${key}_MAIN is missing or empty — refusing to send the dev branch's ${key} to production`);
      }
    }
  }

  const send = [];
  for (const [key, { value, from }] of [...chosen].sort(([a], [b]) => a.localeCompare(b))) {
    if (SKIP.has(key)) skipped.push({ key, reason: "not for Vercel" });
    else if (value === "") skipped.push({ key, reason: "empty" });
    else send.push({ key, value, from });
  }
  return { send, skipped, errors };
}

function decrypt(file) {
  const r = spawnSync("sops", ["-d", "--input-type", "dotenv", "--output-type", "dotenv", file], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1 << 20,
  });
  if (r.error) fail(`could not run sops (${r.error.code ?? r.error.message}). Install it: brew install sops`);
  if (r.status !== 0) fail(`sops could not decrypt ${file}:\n${String(r.stderr).trim()}`);
  return parseDotenv(r.stdout);
}

/** Hide any secret value that might appear in a CLI error message. */
function scrub(text, values) {
  let t = String(text);
  for (const v of values) if (v && v.length >= 4) t = t.split(v).join("***");
  return t.trim();
}

function fail(msg) {
  console.error(`env-push: ${msg}`);
  process.exit(1);
}

export function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes("--dry-run");
  const [target, ...rest] = argv.filter((a) => a !== "--dry-run");
  if (!TARGETS.includes(target ?? "") || rest.length) {
    fail(`usage: node scripts/env-push.mjs <${TARGETS.join("|")}> [--dry-run]`);
  }
  const root = process.env.ENV_PUSH_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const baseFile = join(root, ".env.enc");
  if (!existsSync(baseFile)) fail(`${baseFile} not found (run sops-init / sops-edit first)`);
  const base = decrypt(baseFile);
  const overlayFile = join(root, ".env.production.enc");
  const overlay = target === "production" && existsSync(overlayFile) ? decrypt(overlayFile) : new Map();

  const { send, skipped, errors } = plan(target, base, overlay);
  if (errors.length) fail(errors.join("\n"));

  console.log(`${dryRun ? "Would send" : "Sending"} ${send.length} variable(s) to Vercel ${target}:`);
  for (const s of send) console.log(`  ${s.key}${s.from !== s.key ? `  ← ${s.from}` : ""}`);
  if (skipped.length) {
    console.log("Not sent:");
    for (const s of skipped) console.log(`  ${s.key}  (${s.reason})`);
  }
  if (dryRun) return;
  if (send.length === 0) fail("nothing to send");

  const token = base.get("VERCEL_TOKEN");
  const env = {
    ...process.env,
    VERCEL_ORG_ID: process.env.VERCEL_ORG_ID ?? VERCEL_ORG_ID,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID ?? VERCEL_PROJECT_ID,
    ...(token ? { VERCEL_TOKEN: token } : {}),
  };
  const secrets = [...base.values(), ...overlay.values()];
  for (const { key, value } of send) {
    // Sensitive (write-only in the dashboard) where Vercel allows it: production and preview.
    const args = ["env", "add", key, target, "--force", "--yes", ...(target === "development" ? [] : ["--sensitive"])];
    const r = spawnSync("vercel", args, { input: value, env, cwd: root, stdio: ["pipe", "ignore", "pipe"] });
    if (r.error) fail(`could not run the Vercel CLI (${r.error.code ?? r.error.message}). Install it: npm i -g vercel`);
    if (r.status !== 0) fail(`vercel refused ${key}:\n${scrub(r.stderr, secrets)}`);
    console.log(`  ✓ ${key}`);
  }
  console.log(`\nDone. The values apply on the next deploy (push a commit, or: vercel redeploy).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
