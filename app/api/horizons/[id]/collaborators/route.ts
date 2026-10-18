import { requirePerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { horizonAccess, horizonAfterEdit, horizonFor } from "@/lib/horizons";
import { HttpError, json, readJson, route } from "@/lib/http";
import { forbidden, idParam, notFound, type Ctx } from "@/lib/ids";
import { horizonCollaborator } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/horizons/:id/collaborators {personId}. The owner adds someone who may edit. */
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
  await sqlx().query(
    `insert into horizon_collaborators (horizon_id, person_id, added_by)
     values ($1, $2, $3)
     on conflict (horizon_id, person_id) do nothing`,
    [id, personId, me.id],
  );
  return json({ horizon: await horizonFor(id, me.id) });
});

/** DELETE /api/horizons/:id/collaborators?personId=. The owner removes someone. With no personId, a collaborator leaves. */
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
  await sqlx().query(`delete from horizon_collaborators where horizon_id = $1 and person_id = $2`, [id, target]);
  return json({ horizon: await horizonAfterEdit(id, me.id) });
});
