import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { requireChatCard } from "@/lib/chat-cards";
import { inviteBody, respondInvite, type InviteRole } from "@/lib/horizon-invites";
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

function nextBody(state: "pending" | "accepted" | "declined", role: InviteRole, answer: "accept" | "decline" | "undo"): string {
  const next = respondInvite({ state, role }, answer);
  if (!next) throw notFound("No invite to answer.");
  return inviteBody(next.state, next.role);
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
       where horizon_id = $1 and person_id = $2 and accepted_at is null and declined_at is null and role = 'follower'
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
    [id, me.id, a, z, nextBody("pending", "follower", "accept"), pendingFollower, requireChatCard("horizon_invite").type],
  )) as { person_id: string }[];
  if (!followed.length) {
    const updated = (await sqlx().query(
      `with upd as (
         update horizon_collaborators
         set accepted_at = now()
         where horizon_id = $1 and person_id = $2 and accepted_at is null and declined_at is null
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
      [id, me.id, a, z, nextBody("pending", "collaborator", "accept"), pending, requireChatCard("horizon_invite").type],
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
    `with upd as (
       update horizon_collaborators
       set declined_at = now()
       where horizon_id = $1 and person_id = $2 and accepted_at is null and declined_at is null
       returning role
     ),
     msg as (
       update messages m
       set body = case when m.body = $6 then $8 else $7 end
       from dm_threads t
       where exists (select 1 from upd)
         and m.thread_id = t.id
         and t.a = $3 and t.b = $4
         and m.body in ($5, $6)
         and m.card_type = $9
         and m.card_id = $1
       returning m.id
     )
     select u.role from upd u left join lateral (select id from msg limit 1) m on true`,
    [id, me.id, a, z, pending, pendingFollower, nextBody("pending", "collaborator", "decline"), nextBody("pending", "follower", "decline"), requireChatCard("horizon_invite").type],
  )) as { person_id: string }[];
  if (!removed.length) throw notFound("No invite to answer.");
  const horizon = await horizonFor(id, me.id);
  return json(horizon ? { horizon } : { ok: true });
});

/** PATCH /api/horizons/:id/invites. The invited person undoes their own accept or decline. */
export const PATCH = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const ownerId = await openInvite(id, me.id);
  const [a, z] = pair(ownerId ?? me.id, me.id);
  const card = requireChatCard("horizon_invite").type;
  const pending = nextBody("accepted", "collaborator", "undo");
  const pendingFollower = nextBody("accepted", "follower", "undo");
  const undone = (await sqlx().query(
    `with upd as (
       update horizon_collaborators
       set accepted_at = null
       where horizon_id = $1 and person_id = $2 and accepted_at is not null and declined_at is null
         and (role is null or role = 'collaborator')
       returning person_id
     ),
     msg as (
       update messages m
       set body = $5
       from dm_threads t
       where exists (select 1 from upd)
         and m.thread_id = t.id and t.a = $3 and t.b = $4
         and m.body = $6 and m.card_type = $7 and m.card_id = $1
       returning m.id
     )
     select u.person_id from upd u left join lateral (select id from msg limit 1) m on true`,
    [id, me.id, a, z, pending, inviteBody("accepted", "collaborator"), card],
  )) as unknown[];
  if (!undone.length) {
    const cleared = (await sqlx().query(
      `with upd as (
         update horizon_collaborators
         set declined_at = null
         where horizon_id = $1 and person_id = $2 and declined_at is not null and accepted_at is null
         returning role
       ),
       msg as (
         update messages m
         set body = case when u.role = 'follower' then $6 else $5 end
         from upd u, dm_threads t
         where m.thread_id = t.id and t.a = $3 and t.b = $4
           and m.card_type = $9 and m.card_id = $1
           and ((u.role = 'follower' and m.body = $8) or (u.role is distinct from 'follower' and m.body = $7))
         returning m.id
       )
       select u.role from upd u left join lateral (select id from msg limit 1) m on true`,
      [id, me.id, a, z, pending, pendingFollower, inviteBody("declined", "collaborator"), inviteBody("declined", "follower"), card],
    )) as unknown[];
    if (!cleared.length) {
      const restored = (await sqlx().query(
        `with del as (
           delete from horizon_follows hf
           where hf.horizon_id = $1 and hf.person_id = $2
             and exists (
               select 1 from messages m
               join dm_threads t on t.id = m.thread_id
               where t.a = $3 and t.b = $4 and m.card_type = $6 and m.card_id = $1 and m.body = $5
             )
           returning hf.person_id
         ),
         ins as (
           insert into horizon_collaborators (horizon_id, person_id, added_by, role)
           select $1::uuid, $2::uuid, $7::uuid, 'follower' from del
           on conflict (horizon_id, person_id) do update
             set role = 'follower', accepted_at = null, declined_at = null, added_by = excluded.added_by
             where horizon_collaborators.accepted_at is null
           returning person_id
         ),
         msg as (
           update messages m
           set body = $8
           from dm_threads t
           where exists (select 1 from ins)
             and m.thread_id = t.id and t.a = $3 and t.b = $4
             and m.body = $5 and m.card_type = $6 and m.card_id = $1
           returning m.id
         )
         select i.person_id from ins i left join lateral (select id from msg limit 1) m on true`,
        [id, me.id, a, z, inviteBody("accepted", "follower"), card, ownerId ?? me.id, pendingFollower],
      )) as unknown[];
      if (!restored.length) throw notFound("No invite to undo.");
    }
  }
  const horizon = await horizonFor(id, me.id);
  return json(horizon ? { horizon } : { ok: true });
});
