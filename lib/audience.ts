import { sqlx } from "./db";
import { HttpError } from "./http";
import { audienceFromPrivacy, type Audience, type Privacy } from "./validation";

/** `can_see_event($n::uuid, alias)` or an invite row for that viewer.
 *  0013 puts the same exists clause inside the function. OR is idempotent.
 *  The wrapper names event_invites, which 0010 creates. */
export function canSeeEventSql(viewerParam: string, alias = "e"): string {
  if (!/^\$([1-9][0-9]*)$/.test(viewerParam) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(alias)) {
    throw new Error("canSeeEventSql: viewer must be $n and alias a bare name");
  }
  return (
    "can_see_event(" + viewerParam + "::uuid, " + alias + ")" +
    " or exists (select 1 from event_invites where event_id = " + alias + ".id and invitee_id = " + viewerParam + "::uuid)"
  );
}

type AudienceEvent = { audience?: { include?: string[] } | null; privacy?: string | null } | null | undefined;

/** Public when include contains everyone, excludes allowed. With no audience, the legacy privacy value. A missing privacy counts as everyone. */
export function isPublicAudience(event: AudienceEvent): boolean {
  if (!event) return false;
  if (event.audience && typeof event.audience === "object") {
    const include = event.audience.include;
    return Array.isArray(include) && include.indexOf("everyone") >= 0;
  }
  return (event.privacy || "everyone") === "everyone";
}

/** Audience from the request. `audience` wins when both are sent. List tokens must be lists `hostId` owns.
 *  group:<uuid> is accepted here and is not looked up. It matches nobody until is_group_member is replaced. */
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
