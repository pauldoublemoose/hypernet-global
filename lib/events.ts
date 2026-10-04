import { randomBytes } from "node:crypto";
import { sqlx } from "./db";
import { EVENT_JSON } from "./bootstrap";

/** One event as the app reads it, if the viewer may see it (else null). */
export async function eventFor(id: string, viewer: string | null): Promise<unknown | null> {
  const rows = (await sqlx().query(`select ${EVENT_JSON} v from events e where e.id = $1 and can_see_event($2::uuid, e)`, [id, viewer])) as { v: unknown }[];
  return rows[0]?.v ?? null;
}

/** Is this event visible to the viewer? (the one privacy rule, can_see_event) */
export async function canSeeEvent(id: string, viewer: string | null): Promise<boolean> {
  const rows = (await sqlx().query(`select 1 from events e where e.id = $1 and can_see_event($2::uuid, e)`, [id, viewer])) as unknown[];
  return rows.length > 0;
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
  const suffix = randomBytes(4).toString("hex").slice(0, 6);
  return base ? `${base}-${suffix}` : `event-${suffix}`;
}
