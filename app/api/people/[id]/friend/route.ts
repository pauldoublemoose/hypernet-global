import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { HttpError, json, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * PUT /api/people/:id/friend — ask to be friends, or accept their request.
 * No row yet: insert pending, requested_by = me.
 * They already asked me: accept (accepted_at set).
 * I already asked, or we are already friends: the row stays as it is.
 * This does not follow them. A declined request is just a deleted row, so it is not remembered.
 * You cannot friend yourself (400). An unknown person is 404.
 */
export const PUT = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", "Nobody here with that id.");
  const me = await requirePerson();
  if (id === me.id) throw new HttpError(400, "self", "You can’t friend yourself.");
  const rows = (await sqlx().query(
    `with person as (
       select id from people where id = $2::uuid
     ), existing as (
       select f.a, f.b, f.requested_by, f.status, f.accepted_at
       from friendships f
       where exists (select 1 from person)
         and f.a = least($1::uuid, $2::uuid) and f.b = greatest($1::uuid, $2::uuid)
     ), ins as (
       insert into friendships (a, b, requested_by)
       select least($1::uuid, $2::uuid), greatest($1::uuid, $2::uuid), $1::uuid
       where exists (select 1 from person) and not exists (select 1 from existing)
       returning a, b, requested_by, status, accepted_at
     ), upd as (
       update friendships f
          set status = 'accepted', accepted_at = coalesce(f.accepted_at, now())
        where f.a = least($1::uuid, $2::uuid) and f.b = greatest($1::uuid, $2::uuid)
          and f.status = 'pending' and f.requested_by <> $1::uuid
          and exists (select 1 from person)
       returning f.a, f.b, f.requested_by, f.status, f.accepted_at
     )
     select json_build_object('a', a, 'b', b, 'requestedBy', requested_by, 'status', status, 'acceptedAt', accepted_at) v
       from (
         select * from ins
         union all
         select * from upd
         union all
         select * from existing e
          where not exists (select 1 from ins)
            and not (e.status = 'pending' and e.requested_by <> $1::uuid)
       ) s`,
    [me.id, id],
  )) as { v: unknown }[];
  if (!rows.length) throw notFound("Nobody here with that id.");
  return json({ friendship: rows[0].v });
});

/**
 * DELETE /api/people/:id/friend — decline their request, cancel yours, or unfriend.
 * The row is deleted. A decline is not remembered, so a later PUT can ask again.
 * Unknown person is 404. No row for a real person is a no-op.
 */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", "Nobody here with that id.");
  const me = await requirePerson();
  if (id === me.id) throw new HttpError(400, "self", "You can’t friend yourself.");
  const known = (await sqlx().query(`select 1 from people where id = $1`, [id])) as unknown[];
  if (!known.length) throw notFound("Nobody here with that id.");
  await sqlx().query(
    `delete from friendships where a = least($1::uuid, $2::uuid) and b = greatest($1::uuid, $2::uuid)`,
    [me.id, id],
  );
  return json({ friendship: null });
});
