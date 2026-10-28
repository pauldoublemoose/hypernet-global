import { json, route } from "@/lib/http";
import { idParam, notFound, type Ctx } from "@/lib/ids";
import { personOrNotFound, relationsFor } from "@/lib/relations";

export const dynamic = "force-dynamic";

/**
 * GET /api/people/:id/relations — follower and following names for a logged-in viewer.
 * Friend names only when this is you. A null viewer and an unknown person are the same 404.
 */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const id = await idParam(ctx.params, "id", "Nobody here with that id.");
  const me = await personOrNotFound();
  const relations = await relationsFor(me.id, id);
  if (!relations) throw notFound("Nobody here with that id.");
  return json(relations);
});
