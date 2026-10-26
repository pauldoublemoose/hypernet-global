// node --test scripts/env-push.test.mjs — uses only FAKE values (scripts/fixtures/env-push.fixture.env).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDotenv, plan } from "./env-push.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "fixtures", "env-push.fixture.env");
const fixture = readFileSync(fixturePath, "utf8");
const env = parseDotenv(fixture);
const keys = (p) => p.send.map((s) => s.key);

test("parseDotenv: comments, quotes, = inside values, spaces in values", () => {
  assert.equal(env.get("DATABASE_URL_MAIN"), "fake-db-url-main-pooled?sslmode=require&a=b");
  assert.equal(env.get("AUTH_SECRET"), "fake=a=b=c");
  assert.equal(env.get("EMAIL_FROM"), "Hypernet <login@example.invalid>");
  assert.equal(env.get("NEON_STORAGE_SECRET_ACCESS_KEY"), "");
  assert.equal([...env.keys()].some((k) => k.startsWith("#")), false);
});

test("production: _MAIN values replace the dev ones; tooling keys and empty values stay home", () => {
  const p = plan("production", env);
  assert.deepEqual(p.errors, []);
  assert.deepEqual(keys(p), ["AUTH_SECRET", "DATABASE_URL", "EMAIL_FROM", "NEON_STORAGE_ACCESS_KEY_ID", "RESEND_API_KEY"]);
  const db =p.send.find((s) => s.key === "DATABASE_URL");
  assert.equal(db.value, "fake-db-url-main-pooled?sslmode=require&a=b");
  assert.equal(db.from, "DATABASE_URL_MAIN");
  const skipped = Object.fromEntries(p.skipped.map((s) => [s.key, s.reason]));
  for (const k of ["NEON_API_KEY", "VERCEL_TOKEN", "NEON_PROJECT_ID", "DATABASE_URL_UNPOOLED"]) {
    assert.equal(skipped[k], "not for Vercel", k);
  }
  assert.equal(skipped.NEON_STORAGE_SECRET_ACCESS_KEY, "empty");
});

test("preview and development: dev values, never the main branch's", () => {
  for (const target of ["preview", "development"]) {
    const p = plan(target, env);
    assert.deepEqual(keys(p), ["AUTH_SECRET", "DATABASE_URL", "EMAIL_FROM", "NEON_STORAGE_ACCESS_KEY_ID", "RESEND_API_KEY"]);
    assert.equal(p.send.find((s) => s.key === "DATABASE_URL").value, "fake-db-url-dev-pooled");
    assert.ok(p.send.every((s) => !s.value.includes("main")));
  }
});

test("production refuses to send the dev database when DATABASE_URL_MAIN is missing or empty", () => {
  const noMain = new Map([...env].filter(([k]) => !k.startsWith("DATABASE_URL_MAIN")));
  assert.match(plan("production", noMain).errors.join(), /refusing to send the dev branch's DATABASE_URL/);
  const emptyMain = new Map(env).set("DATABASE_URL_MAIN", "");
  assert.match(plan("production", emptyMain).errors.join(), /refusing/);
});

test("an .env.production.enc overlay wins for production only", () => {
  const overlay = new Map([["AUTH_SECRET", "fake-prod-only-secret"]]);
  assert.equal(plan("production", env, overlay).send.find((s) => s.key === "AUTH_SECRET").value, "fake-prod-only-secret");
  assert.equal(plan("preview", env, overlay).send.find((s) => s.key === "AUTH_SECRET").value, env.get("AUTH_SECRET"));
});

test("unknown target is an error", () => {
  assert.throws(() => plan("staging", env), /unknown target/);
});

// End to end with fake `sops` (prints the fixture) and fake `vercel` (records argv and stdin).
function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), "env-push-"));
  const bin = join(dir, "bin");
  spawnSync("mkdir", [bin]);
  copyFileSync(fixturePath, join(dir, ".env.enc"));
  writeFileSync(join(bin, "sops"), '#!/bin/sh\nfor a; do f="$a"; done\ncat "$f"\n');
  writeFileSync(
    join(bin, "vercel"),
    `#!/bin/sh\necho "ARGS $*" >> "${join(dir, "vercel.log")}"\necho "STDIN $(cat)" >> "${join(dir, "vercel.log")}"\n` +
      `echo "TOKEN \${VERCEL_TOKEN:+set} PROJECT $VERCEL_PROJECT_ID" >> "${join(dir, "vercel.log")}"\n`,
  );
  chmodSync(join(bin, "sops"), 0o755);
  chmodSync(join(bin, "vercel"), 0o755);
  const run = (...args) =>
    spawnSync(process.execPath, [join(here, "env-push.mjs"), ...args], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ENV_PUSH_ROOT: dir },
    });
  return { dir, run, log: () => (existsSync(join(dir, "vercel.log")) ? readFileSync(join(dir, "vercel.log"), "utf8") : "") };
}

const secretValues = [...env.values()].filter((v) => v.length >= 8 && v.startsWith("fake"));

test("--dry-run prints key names only and calls nothing", () => {
  const s = sandbox();
  const r = s.run("production", "--dry-run");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /DATABASE_URL {2}← DATABASE_URL_MAIN/);
  for (const v of secretValues) assert.ok(!r.stdout.includes(v) && !r.stderr.includes(v), `leaked ${v}`);
  assert.equal(s.log(), "");
});

test("a real run sends each value on stdin, with --force, to the right target", () => {
  const s = sandbox();
  const r = s.run("preview");
  assert.equal(r.status, 0, r.stderr);
  for (const v of secretValues) assert.ok(!r.stdout.includes(v), `printed ${v}`);
  const log = s.log();
  assert.match(log, /ARGS env add DATABASE_URL preview --force --yes --sensitive/);
  assert.match(log, /STDIN fake-db-url-dev-pooled/);
  assert.match(log, /TOKEN set PROJECT prj_/);
  assert.ok(!/ARGS .*fake-/.test(log), "a value reached the command line");
  assert.ok(!log.includes("fake-neon-api-key"), "NEON_API_KEY was sent");
});

test("a failing vercel call stops the run with a non-zero exit", () => {
  const s = sandbox();
  writeFileSync(join(s.dir, "bin", "vercel"), "#!/bin/sh\ncat >/dev/null\necho 'boom fake-db-url-dev-pooled' >&2\nexit 3\n");
  const r = s.run("development");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /vercel refused AUTH_SECRET/);
  assert.ok(!r.stderr.includes("fake-db-url-dev-pooled"), "error output was not scrubbed");
});
