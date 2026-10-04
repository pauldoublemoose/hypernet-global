import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { json, route } from "@/lib/http";
import { idParam, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** PUT /api/chats/:personId/read — you have read your conversation with this person up to now. */
export const PUT = route(async (_req: Request, ctx: Ctx<"personId">) => {
  const other = await idParam(ctx.params, "personId", "Nobody here with that id.");
  const me = await requirePerson();
  const [a, z] = [me.id, other].sort();
  await sqlx().query(
    `insert into thread_reads (thread_id, person_id, last_read_at) select t.id, $3, now() from dm_threads t where t.a = $1 and t.b = $2
     on conflict (thread_id, person_id) do update set last_read_at = now()`,
    [a, z, me.id],
  );
  return json({ ok: true });
});
