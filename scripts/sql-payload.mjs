#!/usr/bin/env node
// A migration file or a seed as ONE request body for Neon's SQL-over-HTTP endpoint (one transaction: all or
// nothing). It needs no secrets; the connection string is added by curl inside `scripts/with-env`:
//
//   node scripts/sql-payload.mjs db/migrations/0002_v2_api.sql > "$TMPDIR/q.json"     (or: seed:dev, seed:main,
//                                                                                       pictures:dev, pictures:main)
//   scripts/with-env curl -sS --fail-with-body \
//     --variable %DATABASE_URL_UNPOOLED --expand-header 'Neon-Connection-String: {{DATABASE_URL_UNPOOLED}}' \
//     -H 'Content-Type: application/json' -H 'Neon-Batch-Isolation-Level: Serializable' \
//     --data-binary @"$TMPDIR/q.json" https://api.c-7.eu-central-1.aws.neon.tech/sql
//
// (production: DATABASE_URL_MAIN_UNPOOLED instead.) The project lives on Neon cell c-7; the plain
// api.eu-central-1 host answers with a misleading "password authentication failed".
import { readFileSync } from "node:fs";
import { splitSql } from "./sql-split.mjs";
import { buildSeed } from "./seed.mjs";

const arg = process.argv[2];
if (!arg) {
  console.error("usage: node scripts/sql-payload.mjs <file.sql | seed:dev | seed:main | pictures:dev | pictures:main>");
  process.exit(1);
}
const statements = arg.startsWith("seed:") ? buildSeed(arg.slice(5))
  : arg.startsWith("pictures:") ? buildSeed(arg.slice(9), { only: "pictures" })
  : splitSql(readFileSync(arg, "utf8"));
console.log(JSON.stringify({ queries: statements.map((query) => ({ query, params: [] })) }));
