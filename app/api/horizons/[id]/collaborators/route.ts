import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { horizonAccess, horizonAfterEdit, horizonFor } from "@/lib/horizons";
import { HttpError, json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { horizonCollaborator } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/horizons/:id/collaborators {personId}. The owner invites someone. A pending invite grants nothing. */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const { personId } = horizonCollaborator.parse(await readJson(req));
  const access = await horizonAccess(id, me.id);
  if (!access || access.role === "stranger") throw notFound("No horizon of yours with that id.");
  if (access.role === "collaborator") throw forbidden();
  if (access.isPersonalDefault) throw new HttpError(400, "invalid", "A personal list cannot have collaborators.");
  if (personId === access.ownerId) throw new HttpError(400, "invalid", "The owner is already on this horizon.");
  const person = (await sqlx().query(`select 1 from people where id = $1`, [personId])) as unknown[];
  if (!person.length) throw new HttpError(400, "invalid", "No person with that id.");
  const [a, z] = [me.id, personId].sort();
  await sqlx().query(
    `with ins as (
       insert into horizon_collaborators (horizon_id, person_id, added_by)
       values ($1, $2, $3)
       on conflict (horizon_id, person_id) do nothing
       returning person_id
     ),
     new_thread as (
       insert into dm_threads (a, b)
       select $4, $5
       where exists (select 1 from ins)
       on conflict (a, b) do nothing
       returning id
     ),
     msg as (
       insert into messages (thread_id, sender_id, body, card_type, card_id)
       select coalesce(
                (select id from new_thread),
                (select t.id from dm_threads t where t.a = $4 and t.b = $5)
              ),
              $3, 'pending', 'horizon_invite', $1
       where exists (select 1 from ins)
       returning id
     )
     select i.person_id from ins i left join lateral (select id from msg limit 1) m on true`,
    [id, personId, me.id, a, z],
  );
  return json({ horizon: await horizonFor(id, me.id) });
});

/** DELETE /api/horizons/:id/collaborators?personId=. The owner cancels a pending invite or removes an accepted collaborator. With no personId, an accepted collaborator leaves. */
export const DELETE = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const raw = new URL(req.url).searchParams.get("personId");
  const target = raw === null ? me.id : horizonCollaborator.parse({ personId: raw }).personId;
  const access = await horizonAccess(id, me.id);
  if (!access || access.role === "stranger") throw notFound("No horizon of yours with that id.");
  if (access.role === "owner" && raw === null) throw new HttpError(400, "invalid", "Say which collaborator to remove.");
  if (access.role === "collaborator" && target !== me.id) throw forbidden();
  if (access.isPersonalDefault) throw new HttpError(400, "invalid", "A personal list cannot have collaborators.");
  const [a, z] = [me.id, target].sort();
  await sqlx().query(
    `with del as (
       delete from horizon_collaborators
       where horizon_id = $1 and person_id = $2
       returning accepted_at
     ),
     msg as (
       update messages m
       set body = 'cancelled'
       from dm_threads t
       where exists (select 1 from del d where d.accepted_at is null)
         and m.thread_id = t.id
         and t.a = $3 and t.b = $4
         and m.body = 'pending'
         and m.card_type = 'horizon_invite'
         and m.card_id = $1
       returning m.id
     )
     select d.accepted_at from del d left join lateral (select id from msg limit 1) m on true`,
    [id, target, a, z],
  );
  return json({ horizon: await horizonAfterEdit(id, me.id) });
});
