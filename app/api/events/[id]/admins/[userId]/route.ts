import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { allows } from "@/lib/event-access";
import { eventGate } from "@/lib/event-gate";
import { json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { adminReply } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/events/:id/admins/:userId {status} — only that person accepts or declines their own pending invite. */
export const POST = route(async (req: Request, ctx: Ctx<"id" | "userId">) => {
  const id = await idParam(ctx.params);
  const userId = await idParam(ctx.params, "userId", "Nobody here with that id.");
  const me = await requirePerson();
  const b = adminReply.parse(await readJson(req));
  if (userId !== me.id) throw forbidden("You can only answer your own invite.");
  const gate = await eventGate(id, me.id);
  if (!gate) throw notFound();
  if (b.status === "accepted") {
    const rows = (await sqlx().query(
      `update event_admins set status = 'accepted' where event_id = $1 and user_id = $2 and status = 'pending' returning user_id`,
      [id, me.id],
    )) as { user_id: string }[];
    if (!rows.length) throw notFound("No pending invite.");
    return json({ ok: true, status: "accepted" });
  }
  const rows = (await sqlx().query(
    `delete from event_admins where event_id = $1 and user_id = $2 and status = 'pending' returning user_id`,
    [id, me.id],
  )) as { user_id: string }[];
  if (!rows.length) throw notFound("No pending invite.");
  return json({ ok: true, status: "declined" });
});

/** DELETE /api/events/:id/admins/:userId — only the original host removes an admin. */
export const DELETE = route(async (_req: Request, ctx: Ctx<"id" | "userId">) => {
  const id = await idParam(ctx.params);
  const userId = await idParam(ctx.params, "userId", "Nobody here with that id.");
  const me = await requirePerson();
  const gate = await eventGate(id, me.id);
  if (!gate) throw notFound();
  if (!allows("removeAdmin", gate.seat)) throw forbidden("Only the host can remove an admin.");
  const rows = (await sqlx().query(
    `delete from event_admins where event_id = $1 and user_id = $2 returning user_id`,
    [id, userId],
  )) as { user_id: string }[];
  if (!rows.length) throw notFound("That person is not an admin.");
  return json({ ok: true });
});
