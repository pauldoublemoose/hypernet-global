import { randomUUID } from "node:crypto";
import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { canInviteGuest, eventDayLabel, pastInviteNotice } from "@/lib/event-access";
import { eventGate, viewerRsvp } from "@/lib/event-gate";
import { canSeeEvent } from "@/lib/events";
import { HttpError, json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { guestInvite } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/:id/invites {personId} — record an invite and send a DM card.
 * The row does not make a private event visible. can_see_event is unchanged.
 */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = guestInvite.parse(await readJson(req));
  if (b.personId === me.id) throw new HttpError(400, "self", "You can’t invite yourself.");
  const gate = await eventGate(id, me.id);
  if (!gate) throw notFound();
  const people = (await sqlx().query(`select 1 from people where id = $1`, [b.personId])) as unknown[];
  if (!people.length) throw notFound("Nobody here with that id.");
  const seen = gate.seat === "host" || gate.seat === "admin" ? true : await canSeeEvent(id, me.id);
  if (!seen) throw notFound();
  const when = (await sqlx().query(
    `select starts_on::text as starts_on, (coalesce(ends_on, starts_on) < current_date) as past from events where id = $1`,
    [id],
  )) as { starts_on: string; past: boolean }[];
  const past = !!when[0]?.past;
  const logged = gate.hostId == null;
  const rsvp = await viewerRsvp(id, me.id);
  const allowed = canInviteGuest({
    seat: gate.seat,
    guestsCanInvite: gate.guestsCanInvite,
    canSee: seen,
    rsvpRole: rsvp.role,
    going: rsvp.status === "going",
    logged,
    past,
  });
  if (!allowed) {
    throw forbidden(logged
      ? "Only events hosted here can take an invite."
      : "Only an admin, or a guest who is going, can invite friends.");
  }
  await sqlx().query(
    `insert into event_invites (event_id, invitee_id, invited_by) values ($1, $2, $3) on conflict (event_id, invitee_id) do nothing`,
    [id, b.personId, me.id],
  );
  const [a, z] = [me.id, b.personId].sort();
  const sql = sqlx();
  const notice = past
    ? pastInviteNotice(me.displayName, eventDayLabel(when[0]?.starts_on || ""), gate.title)
    : `You're invited to ${gate.title}.`;
  await sql.transaction([
    sql.query(`insert into dm_threads (a, b) values ($1, $2) on conflict (a, b) do nothing`, [a, z]),
    sql.query(
      `insert into messages (id, thread_id, sender_id, body, card_type, card_id)
         select $1, t.id, $4, $5, $6, $7 from dm_threads t where t.a = $2 and t.b = $3`,
      [randomUUID(), a, z, me.id, notice, past ? "chronicle" : "event", id],
    ),
  ]);
  return json({ ok: true }, 201);
});
