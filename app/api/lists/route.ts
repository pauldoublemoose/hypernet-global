import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { HttpError, json, readJson, route } from "@/lib/http";
import { listCreate } from "@/lib/validation";

export const dynamic = "force-dynamic";

const LIST_JSON = `json_build_object('id', l.id, 'name', l.name, 'createdAt', l.created_at,
  'memberIds', coalesce((select json_agg(m.person_id) from contact_list_members m where m.list_id = l.id), '[]'))`;

/** POST /api/lists {id?, name} — a contact list of yours. The 51st is 409, and so is a name you already use. */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const { id, name } = listCreate.parse(await readJson(req));
  const count = (await sqlx().query(
    `select count(*)::int n from contact_lists where owner_id = $1`,
    [me.id],
  )) as { n: number }[];
  if (count[0].n >= 50) throw new HttpError(409, "list_cap", "You can keep 50 lists.");
  try {
    const rows = (await sqlx().query(
      `insert into contact_lists (id, owner_id, name)
         values (coalesce($1::uuid, gen_random_uuid()), $2, $3)
       returning id`,
      [id ?? null, me.id, name],
    )) as { id: string }[];
    const full = (await sqlx().query(`select ${LIST_JSON} v from contact_lists l where l.id = $1`, [rows[0].id])) as { v: unknown }[];
    return json({ list: full[0].v }, 201);
  } catch (err) {
    if (pgCode(err) === "23505") throw new HttpError(409, "exists", "You already have a list with that name.");
    throw err;
  }
});
