import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { requireChatCard } from "@/lib/chat-cards";
import { inviteBody } from "@/lib/horizon-invites";
import { horizonFor } from "@/lib/horizons";
import { HttpError, json, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";

export const dynamic = "force-dynamic";

async function openInvite(id: string, meId: string): Promise<string | null> {
  const rows = (await sqlx().query(
    `select owner_id, is_personal_default from horizons where id = $1`,
    [id],
  )) as { owner_id: string | null; is_personal_default: boolean }[];
  const row = rows[0];
  if (!row) throw notFound();
  if (row.owner_id === meId) throw forbidden("Only the invited person can answer this.");
  if (row.is_personal_default) throw new HttpError(400, "invalid", "A personal list cannot have collaborators.");
  return row.owner_id;
}

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** POST /api/horizons/:id/invites. The invited person accepts. A collaborator stays on the horizon. A follower becomes a follow. */
export const POST = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const ownerId = await openInvite(id, me.id);
  const [a, z] = pair(ownerId ?? me.id, me.id);
  const pending = inviteBody("pending", "collaborator");
  const pendingFollower = inviteBody("pending", "follower");
  const followed = (await sqlx().query(
    `with del as (
       delete from horizon_collaborators
       where horizon_id = $1 and person_id = $2 and accepted_at is null and role = 'follower'
       returning person_id
     ),
     fol as (
       insert into horizon_follows (person_id, horizon_id)
       select $2::uuid, $1::uuid from del
       on conflict do nothing
       returning person_id
     ),
     msg as (
       update messages m
       set body = $5
       from dm_threads t
       where exists (select 1 from del)
         and m.thread_id = t.id
         and t.a = $3 and t.b = $4
         and m.body = $6
         and m.card_type = $7
         and m.card_id = $1
       returning m.id
     )
     select d.person_id from del d
     left join lateral (select person_id from fol limit 1) f on true
     left join lateral (select id from msg limit 1) m on true`,
    [id, me.id, a, z, inviteBody("accepted", "follower"), pendingFollower, requireChatCard("horizon_invite").type],
  )) as { person_id: string }[];
  if (!followed.length) {
    const updated = (await sqlx().query(
      `with upd as (
         update horizon_collaborators
         set accepted_at = now()
         where horizon_id = $1 and person_id = $2 and accepted_at is null
           and (role is null or role = 'collaborator')
         returning person_id
       ),
       msg as (
         update messages m
         set body = $5
         from dm_threads t
         where exists (select 1 from upd)
           and m.thread_id = t.id
           and t.a = $3 and t.b = $4
           and m.body = $6
           and m.card_type = $7
           and m.card_id = $1
         returning m.id
       )
       select u.person_id from upd u left join lateral (select id from msg limit 1) m on true`,
      [id, me.id, a, z, inviteBody("accepted", "collaborator"), pending, requireChatCard("horizon_invite").type],
    )) as { person_id: string }[];
    if (!updated.length) {
      const already = (await sqlx().query(
        `select 1 from horizon_collaborators where horizon_id = $1 and person_id = $2 and accepted_at is not null`,
        [id, me.id],
      )) as unknown[];
      if (!already.length) throw notFound("No invite to answer.");
    }
  }
  return json({ horizon: await horizonFor(id, me.id) });
});

/** DELETE /api/horizons/:id/invites. The invited person declines a pending invite. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const ownerId = await openInvite(id, me.id);
  const [a, z] = pair(ownerId ?? me.id, me.id);
  const pending = inviteBody("pending", "collaborator");
  const pendingFollower = inviteBody("pending", "follower");
  const removed = (await sqlx().query(
    `with del as (
       delete from horizon_collaborators
       where horizon_id = $1 and person_id = $2 and accepted_at is null
       returning person_id
     ),
     msg as (
       update messages m
       set body = case when m.body = $6 then $8 else $7 end
       from dm_threads t
       where exists (select 1 from del)
         and m.thread_id = t.id
         and t.a = $3 and t.b = $4
         and m.body in ($5, $6)
         and m.card_type = $9
         and m.card_id = $1
       returning m.id
     )
     select d.person_id from del d left join lateral (select id from msg limit 1) m on true`,
    [id, me.id, a, z, pending, pendingFollower, inviteBody("declined", "collaborator"), inviteBody("declined", "follower"), requireChatCard("horizon_invite").type],
  )) as { person_id: string }[];
  if (!removed.length) throw notFound("No invite to answer.");
  const horizon = await horizonFor(id, me.id);
  return json(horizon ? { horizon } : { ok: true });
});
