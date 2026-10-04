import { currentPerson, requirePerson } from "@/lib/auth";
import { pgCode, pgConstraint, sqlx } from "@/lib/db";
import { PERSON_JSON } from "@/lib/bootstrap";
import { HttpError, json, readJson, route } from "@/lib/http";
import { join, profilePatch } from "@/lib/validation";

export const dynamic = "force-dynamic";

const ME_JSON = PERSON_JSON.replace("json_build_object(", "json_build_object('email', p.email, ");

/**
 * GET /api/me — who is logged in.
 *   logged out:            { user: null, person: null }
 *   logged in, not joined: { user: {id, email, name}, person: null }
 *   joined:                { user, person }
 */
export const GET = route(async () => json(await currentPerson()));

function taken(err: unknown): never {
  if (pgCode(err) === "23505") {
    if ((pgConstraint(err) ?? "").includes("handle")) throw new HttpError(409, "handle_taken", "That handle is taken.");
    throw new HttpError(409, "already_joined", "This login already has a profile.");
  }
  if (pgCode(err) === "23514") throw new HttpError(400, "invalid", "A value is not allowed (check the colours and the picture).");
  throw err;
}

/** POST /api/me {handle, displayName, bio?, skills?, cities?, look?} — join: the profile for the logged-in email. */
export const POST = route(async (req: Request) => {
  const { user, person } = await currentPerson();
  if (!user) throw new HttpError(401, "login_required", "Log in first.");
  if (person) throw new HttpError(409, "already_joined", "This login already has a profile.");
  const b = join.parse(await readJson(req));
  try {
    const rows = (await sqlx().query(
      `insert into people as p (auth_user_id, email, handle, display_name, bio, skills, cities, look)
         values ($1, $2, $3, $4, $5, $6::text[], $7::text[], $8::jsonb) returning ${ME_JSON} v`,
      [user.id, user.email, b.handle, b.displayName, b.bio || null, b.skills, b.cities, b.look ? JSON.stringify(b.look) : null],
    )) as { v: unknown }[];
    return json({ person: rows[0].v }, 201);
  } catch (err) {
    taken(err);
  }
});

/** PATCH /api/me {displayName?, handle?, bio?, skills?, cities?, look?} — Edit profile, Customize your profile. */
export const PATCH = route(async (req: Request) => {
  const me = await requirePerson();
  const b = profilePatch.parse(await readJson(req));
  const has = (k: string) => k in b;
  try {
    const rows = (await sqlx().query(
      `update people as p set
         handle = case when $2 then $3 else handle end,
         display_name = case when $4 then $5 else display_name end,
         bio = case when $6 then $7 else bio end,
         skills = case when $8 then $9::text[] else skills end,
         cities = case when $10 then $11::text[] else cities end,
         look = case when $12 then $13::jsonb else look end,
         updated_at = now()
       where id = $1 returning ${ME_JSON} v`,
      [me.id, has("handle"), b.handle ?? null, has("displayName"), b.displayName ?? null, has("bio"), b.bio || null,
       has("skills"), b.skills ?? [], has("cities"), b.cities ?? [], has("look"), b.look ? JSON.stringify(b.look) : null],
    )) as { v: unknown }[];
    return json({ person: rows[0].v });
  } catch (err) {
    taken(err);
  }
});
