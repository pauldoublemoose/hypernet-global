import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { need } from "./env";

// Neon's serverless driver over HTTPS: one fetch per query, no connection pool to manage, nothing to close.
// DATABASE_URL is the pooled string of the branch this deployment uses (dev locally and in previews, main in
// production — see lib/branch.ts and scripts/env-push.mjs).
let _db: NeonHttpDatabase<typeof schema> | undefined;

export function db(): NeonHttpDatabase<typeof schema> {
  if (!_db) _db = drizzle({ client: neon(need("DATABASE_URL")), schema });
  return _db;
}

export { schema };

/** The Postgres error code of a failed query ('23505' = unique violation), looking through Drizzle's wrapper. */
export function pgCode(err: unknown): string | undefined {
  for (let e = err as { code?: unknown; cause?: unknown } | undefined, i = 0; e && i < 4; e = e.cause as typeof e, i++) {
    if (typeof e.code === "string" && /^[0-9A-Z]{5}$/.test(e.code)) return e.code;
  }
  return undefined;
}

/** The constraint a failed query broke, when Postgres says (e.g. 'people_handle_key'). */
export function pgConstraint(err: unknown): string | undefined {
  for (let e = err as { constraint?: unknown; cause?: unknown } | undefined, i = 0; e && i < 4; e = e.cause as typeof e, i++) {
    if (typeof e.constraint === "string") return e.constraint;
  }
  return undefined;
}
