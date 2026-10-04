#!/usr/bin/env node
// Splits a migration file into single statements (comments dropped, $$ bodies kept whole) and prints them as a
// JSON array — the shape the Neon MCP `run_sql_transaction` tool takes, so a migration runs as one transaction.
//
//   node scripts/sql-split.mjs db/migrations/0001_init.sql
import { readFileSync } from "node:fs";

export function splitSql(text) {
  const out = [];
  let cur = "";
  let i = 0;
  let dollar = false;
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (!dollar && two === "--") {
      const nl = text.indexOf("\n", i);
      i = nl === -1 ? text.length : nl;
      continue;
    }
    if (!dollar && two === "/*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
      continue;
    }
    if (two === "$$") {
      dollar = !dollar;
      cur += two;
      i += 2;
      continue;
    }
    if (!dollar && text[i] === "'") {
      const end = text.indexOf("'", i + 1);
      cur += text.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    if (!dollar && text[i] === ";") {
      if (cur.trim()) out.push(cur.replace(/\s+\n/g, "\n").trim());
      cur = "";
      i += 1;
      continue;
    }
    cur += text[i];
    i += 1;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node scripts/sql-split.mjs <file.sql>");
    process.exit(1);
  }
  console.log(JSON.stringify(splitSql(readFileSync(file, "utf8")), null, 1));
}
