import { randomUUID } from "node:crypto";
import { requirePerson } from "@/lib/auth";
import { canSeeEventSql } from "@/lib/audience";
import { pgCode, sqlx } from "@/lib/db";
import { EVENT_GONE, eventGone } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { idParam, type Ctx } from "@/lib/ids";
import { replyCreate } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/callouts/:id/replies {id?, text} — a public reply under an open call out (its author may reply too).
 * Open = not closed and not past its "open until" day (the open_callouts view).
 */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", EVENT_GONE);
  const me = await requirePerson();
  const b = replyCreate.parse(await readJson(req));
  try {
    const rows = (await sqlx().query(
      `insert into callout_replies as r (id, callout_id, author_id, text)
         select $1, c.id, $3, $4 from open_callouts c
          where c.id = $2 and (c.event_id is null or exists (select 1 from events e where e.id = c.event_id and ${canSeeEventSql("$3")}))
       returning json_build_object('id', r.id, 'calloutId', r.callout_id, 'authorId', r.author_id, 'text', r.text, 'createdAt', r.created_at) v`,
      [b.id ?? randomUUID(), id, me.id, b.text],
    )) as { v: unknown }[];
    if (!rows.length) {
      const visible = (await sqlx().query(
        `select 1 from callouts c
          where c.id = $1 and (c.event_id is null or exists (select 1 from events e where e.id = c.event_id and ${canSeeEventSql("$2")}))`,
        [id, me.id],
      )) as unknown[];
      if (!visible.length) throw eventGone();
      throw new HttpError(409, "closed", "This call out is closed.");
    }
    return json({ reply: rows[0].v }, 201);
  } catch (err) {
    if (pgCode(err) === "23505") throw new HttpError(409, "exists", "That reply exists already.");
    throw err;
  }
});
