import { randomBytes } from "node:crypto";
import { getTableColumns, sql, type SQL } from "drizzle-orm";
import { schema } from "./db";

const { deletedAt: _deletedAt, ...publicColumns } = getTableColumns(schema.events);

/** The columns an event is returned with (everything but the soft-delete marker). */
export const eventColumns = publicColumns;

/**
 * The one privacy rule, in SQL (can_see_event in db/migrations/0001_init.sql, canSeeEvent in index.html):
 * everyone → anyone, logged out too; friends → the host and the people the host follows; only_me → the host.
 * Deleted events are never visible. Use it in every query that reads events.
 */
export function canSee(viewerId: string | null): SQL {
  return sql`can_see_event(${viewerId}::uuid, ${schema.events})`;
}

/** "Sunrise tea service" → "sunrise-tea-service-k3x9qa" (unique enough; the column is unique anyway). */
export function makeSlug(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  const suffix = randomBytes(4).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "x";
  return base ? `${base}-${suffix}` : `event-${suffix}`;
}
