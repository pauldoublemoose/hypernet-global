import { currentPerson } from "@/lib/auth";
import { db, pgCode, pgConstraint, schema } from "@/lib/db";
import { HttpError, json, readJson, route } from "@/lib/http";
import { join } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/me — who is logged in.
 *   logged out:            { user: null, person: null }
 *   logged in, not joined: { user: {id, email, name}, person: null }
 *   joined:                { user, person: {id, handle, displayName, …} }
 */
export const GET = route(async () => json(await currentPerson()));

/** POST /api/me {handle, displayName, bio?} — join: create the Hypernet profile for the logged-in email. */
export const POST = route(async (req: Request) => {
  const { user, person } = await currentPerson();
  if (!user) throw new HttpError(401, "login_required", "Log in first.");
  if (person) throw new HttpError(409, "already_joined", "This login already has a profile.");
  const body = join.parse(await readJson(req));
  try {
    const [created] = await db()
      .insert(schema.people)
      .values({
        authUserId: user.id,
        email: user.email,
        handle: body.handle,
        displayName: body.displayName,
        bio: body.bio ?? null,
      })
      .returning();
    return json({ user, person: created }, 201);
  } catch (err) {
    if (pgCode(err) === "23505") {
      const c = pgConstraint(err) ?? "";
      if (c.includes("handle")) throw new HttpError(409, "handle_taken", "That handle is taken.");
      throw new HttpError(409, "already_joined", "This login already has a profile.");
    }
    throw err;
  }
});
