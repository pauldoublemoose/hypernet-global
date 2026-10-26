import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { HttpError, json, readJson, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";
import { listPatch } from "@/lib/validation";

export const dynamic = "force-dynamic";

const LIST_JSON = `json_build_object('id', l.id, 'name', l.name, 'description', l.description, 'createdAt', l.created_at,
  'memberIds', coalesce((select json_agg(m.person_id) from contact_list_members m where m.list_id = l.id), '[]'))`;

async function owned(id: string, me: string): Promise<boolean> {
  const rows = (await sqlx().query(`select 1 from contact_lists where id = $1 and owner_id = $2`, [id, me])) as unknown[];
  return rows.length > 0;
}

/** PATCH /api/lists/:id {name, description?} — rename a list of yours. Anyone else's id is 404. The name is unique for you ignoring case. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const { name, description } = listPatch.parse(await readJson(req));
  try {
    const rows = (await sqlx().query(
      `update contact_lists set name = $3, description = coalesce($4, description) where id = $1 and owner_id = $2 returning id`,
      [id, me.id, name, description ?? null],
    )) as unknown[];
    if (!rows.length) throw notFound();
  } catch (err) {
    if (pgCode(err) === "23505") throw new HttpError(409, "exists", "You already have a list with that name.");
    throw err;
  }
  const full = (await sqlx().query(`select ${LIST_JSON} v from contact_lists l where l.id = $1`, [id])) as { v: unknown }[];
  return json({ list: full[0].v });
});

/**
 * DELETE /api/lists/:id — delete a list of yours.
 * If one of your events excludes this list, refuse with 409 {events:[{id,title}]} and delete nothing.
 * Otherwise take list:<id> out of those events' include lists, then delete the list. One statement, one transaction.
 */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  if (!(await owned(id, me.id))) throw notFound();
  const token = `list:${id}`;
  const rows = (await sqlx().query(
    `with blocked as (
       select e.id, e.title from events e
        where e.host_id = $1 and e.deleted_at is null and (e.audience->'exclude') ? $2
     ), upd as (
       update events e
          set audience = jsonb_set(e.audience, '{include}', coalesce((
                select jsonb_agg(to_jsonb(t)) from jsonb_array_elements_text(e.audience->'include') t where t <> $2
              ), '[]'::jsonb))
        where e.host_id = $1 and (e.audience->'include') ? $2
          and not exists (select 1 from blocked)
       returning e.id
     ), del as (
       delete from contact_lists l
        where l.id = $3::uuid and l.owner_id = $1
          and not exists (select 1 from blocked)
       returning l.id
     )
     select coalesce((select json_agg(json_build_object('id', id, 'title', title)) from blocked), '[]'::json) events,
            (select count(*) from del) deleted`,
    [me.id, token, id],
  )) as { events: { id: string; title: string }[]; deleted: number }[];
  const row = rows[0];
  if (row.events.length) return json({ events: row.events }, 409);
  if (!Number(row.deleted)) throw notFound();
  return json({ ok: true });
});
