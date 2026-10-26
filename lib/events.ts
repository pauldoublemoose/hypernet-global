import { randomBytes } from "node:crypto";
import { canSeeEventSql } from "./audience";
import { sqlx } from "./db";
import { EVENT_JSON, presentEvent } from "./bootstrap";
import { notFound } from "./ids";

/** Missing and hidden events share this 404, so one cannot be told from the other. */
export const EVENT_GONE = "This event is private or no longer here.";

export const eventGone = () => notFound(EVENT_GONE);

/** One event as the app reads it, if the viewer may see it (else null). */
export async function eventFor(id: string, viewer: string | null): Promise<unknown | null> {
  const rows = (await sqlx().query(`select ${EVENT_JSON} v from events e where e.id = $1 and ${canSeeEventSql("$2")}`, [id, viewer])) as { v: unknown }[];
  return presentEvent((rows[0]?.v ?? null) as { hostId: string | null } | null, viewer);
}

/** The event made from this (cleaned) link, if there is one the viewer may see: one link is one event. */
export async function eventByLink(url: string, viewer: string | null): Promise<unknown | null> {
  const rows = (await sqlx().query(`select ${EVENT_JSON} v from events e where e.source_url = $1 and ${canSeeEventSql("$2")}`, [url, viewer])) as { v: unknown }[];
  return presentEvent((rows[0]?.v ?? null) as { hostId: string | null } | null, viewer);
}

/** Is this event visible to the viewer? can_see_event, including an invite row from 0013. */
export async function canSeeEvent(id: string, viewer: string | null): Promise<boolean> {
  const rows = (await sqlx().query(`select 1 from events e where e.id = $1 and ${canSeeEventSql("$2")}`, [id, viewer])) as unknown[];
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
