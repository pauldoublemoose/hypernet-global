import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { json, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** PUT /api/lists/:id/members/:personId — add someone to a list of yours. Not your list, or no such person, is 404. */
export const PUT = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const personId = await idParam(ctx.params, "personId", "Nobody here with that id.");
  const me = await requirePerson();
  const rows = (await sqlx().query(
    `insert into contact_list_members (list_id, person_id)
       select l.id, p.id from contact_lists l join people p on p.id = $3
        where l.id = $1 and l.owner_id = $2
     on conflict do nothing
     returning list_id`,
    [id, me.id, personId],
  )) as unknown[];
  if (rows.length) return json({ member: true });
  const list = (await sqlx().query(`select 1 from contact_lists where id = $1 and owner_id = $2`, [id, me.id])) as unknown[];
  if (!list.length) throw notFound();
  const person = (await sqlx().query(`select 1 from people where id = $1`, [personId])) as unknown[];
  if (!person.length) throw notFound("Nobody here with that id.");
  return json({ member: true });
});

/** DELETE /api/lists/:id/members/:personId — remove someone from a list of yours. Not your list is 404. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const personId = await idParam(ctx.params, "personId", "Nobody here with that id.");
  const me = await requirePerson();
  const list = (await sqlx().query(`select 1 from contact_lists where id = $1 and owner_id = $2`, [id, me.id])) as unknown[];
  if (!list.length) throw notFound();
  await sqlx().query(`delete from contact_list_members where list_id = $1 and person_id = $2`, [id, personId]);
  return json({ member: false });
});
