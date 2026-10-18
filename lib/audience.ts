import { sqlx } from "./db";
import { HttpError } from "./http";
import { audienceFromPrivacy, type Audience, type Privacy } from "./validation";

/** Audience from the request. `audience` wins when both are sent. List tokens must be lists `hostId` owns. */
export async function resolveAudience(
  hostId: string,
  input: { audience?: Audience; privacy?: Privacy },
): Promise<Audience> {
  const aud = input.audience ?? audienceFromPrivacy(input.privacy ?? "everyone");
  const ids = [...new Set([...aud.include, ...aud.exclude].filter((t) => t.startsWith("list:")).map((t) => t.slice(5)))];
  if (!ids.length) return aud;
  const rows = (await sqlx().query(
    `select id::text as id from contact_lists where owner_id = $1 and id = any($2::uuid[])`,
    [hostId, ids],
  )) as { id: string }[];
  if (rows.length !== ids.length) throw new HttpError(400, "invalid", "A list in the audience is not one of yours.");
  return aud;
}
