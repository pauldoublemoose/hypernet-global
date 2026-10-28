import { requirePerson } from "@/lib/auth";
import { pgCode, sqlx } from "@/lib/db";
import { canManageEvent } from "@/lib/event-access";
import { eventGate } from "@/lib/event-gate";
import { HttpError, json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { adminInvite } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/events/:id/admins {userId} — an admin invites an admin. The row stays pending until they accept. */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params);
  const me = await requirePerson();
  const b = adminInvite.parse(await readJson(req));
  const gate = await eventGate(id, me.id);
  if (!gate) throw notFound();
  if (!canManageEvent(gate.access)) throw forbidden("Only an admin of this event can invite an admin.");
  if (gate.hostId && b.userId === gate.hostId) throw new HttpError(400, "host", "The host is already an admin of the page.");
  const people = (await sqlx().query(`select 1 from people where id = $1`, [b.userId])) as unknown[];
  if (!people.length) throw notFound("Nobody here with that id.");
  try {
    await sqlx().query(
      `insert into event_admins (event_id, user_id, invited_by, status) values ($1, $2, $3, 'pending')`,
      [id, b.userId, me.id],
    );
  } catch (err) {
    if (pgCode(err) === "23505") throw new HttpError(409, "exists", "That person is already invited or an admin.");
    throw err;
  }
  return json({ ok: true, status: "pending" }, 201);
});
