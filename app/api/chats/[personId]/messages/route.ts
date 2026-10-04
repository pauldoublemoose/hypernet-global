import { randomUUID } from "node:crypto";
import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { HttpError, json, readJson, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";
import { messageCreate } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/chats/:personId/messages {id?, body} — a message to someone. There is one conversation per pair of
 * people, whoever writes first; it is made on the first message. Sending also marks the conversation read.
 */
export const POST = route(async (req: Request, ctx: Ctx<"personId">) => {
  const other = await idParam(ctx.params, "personId", "Nobody here with that id.");
  const me = await requirePerson();
  if (other === me.id) throw new HttpError(400, "self", "You can’t message yourself.");
  const b = messageCreate.parse(await readJson(req));
  const exists = (await sqlx().query(`select 1 from people where id = $1`, [other])) as unknown[];
  if (!exists.length) throw notFound("Nobody here with that id.");
  const [a, z] = [me.id, other].sort();
  const sql = sqlx();
  try {
    const res = await sql.transaction([
      sql.query(`insert into dm_threads (a, b) values ($1, $2) on conflict (a, b) do nothing`, [a, z]),
      sql.query(
        `insert into messages as m (id, thread_id, sender_id, body)
           select $1, t.id, $4, $5 from dm_threads t where t.a = $2 and t.b = $3
         returning json_build_object('id', m.id, 'threadId', m.thread_id, 'senderId', m.sender_id, 'body', m.body, 'createdAt', m.created_at) v`,
        [b.id ?? randomUUID(), a, z, me.id, b.body],
      ),
      sql.query(
        `insert into thread_reads (thread_id, person_id, last_read_at) select t.id, $3, now() from dm_threads t where t.a = $1 and t.b = $2
         on conflict (thread_id, person_id) do update set last_read_at = now()`,
        [a, z, me.id],
      ),
    ]);
    return json({ message: (res[1] as { v: unknown }[])[0].v }, 201);
  } catch (err) {
    if (pgCode(err) === "23505") throw new HttpError(409, "exists", "That message exists already.");
    throw err;
  }
});
