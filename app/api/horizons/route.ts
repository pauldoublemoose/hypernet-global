import { randomUUID } from "node:crypto";
import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { horizonFor, hzSlug, setHorizonEvents } from "@/lib/horizons";
import { HttpError, json, readJson, route } from "@/lib/http";
import { j } from "@/lib/ids";
import { horizonCreate } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/horizons {id?, name, description?, published?, look?, eventIds?} — a new Event Horizon of yours. */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const b = horizonCreate.parse(await readJson(req));
  const id = b.id ?? randomUUID();
  const sql = sqlx();
  try {
    await sql.transaction([
      sql.query(
        `insert into horizons (id, slug, owner_id, owner_name, name, description, is_personal_default, published_at, look, cover_event_id)
           values ($1, $2, $3, $4, $5, $6, $7, case when $8 then now() end, $9::jsonb, $10)`,
        [id, hzSlug(b.name, id), me.id, me.displayName, b.name, b.description, b.isPersonalDefault, b.published, j(b.look), b.coverEventId ?? null],
      ),
      ...setHorizonEvents(sql, id, b.eventIds, me.id),
    ]);
  } catch (err) {
    if (pgCode(err) === "23505") throw new HttpError(409, "exists", "That horizon exists already.");
    if (pgCode(err) === "23514") throw new HttpError(400, "invalid", "A value is not allowed (check the colours and the picture).");
    throw err;
  }
  return json({ horizon: await horizonFor(id, me.id) }, 201);
});
