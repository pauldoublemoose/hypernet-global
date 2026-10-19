import { randomUUID } from "node:crypto";
import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { CALLOUT_JSON } from "@/lib/bootstrap";
import { canSeeEvent, eventGone } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { calloutCreate } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/callouts {id?, title, body?, eventId?, skill?, expiresOn} — ask for a hand. Replies are public. */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const b = calloutCreate.parse(await readJson(req));
  if (b.eventId && !(await canSeeEvent(b.eventId, me.id))) throw eventGone();
  try {
    const rows = (await sqlx().query(
      `insert into callouts as c (id, author_id, event_id, title, body, skill, expires_on) values ($1, $2, $3, $4, $5, $6, $7)
       returning ${CALLOUT_JSON} v`,
      [b.id ?? randomUUID(), me.id, b.eventId ?? null, b.title, b.body, b.skill || null, b.expiresOn],
    )) as { v: unknown }[];
    return json({ callout: rows[0].v }, 201);
  } catch (err) {
    if (pgCode(err) === "23505") throw new HttpError(409, "exists", "That call out exists already.");
    throw err;
  }
});
