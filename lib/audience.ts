import { sqlx } from "./db";
import { HttpError } from "./http";
import { audienceFromPrivacy, type Audience, type Privacy } from "./validation";

/** Who may see an event. 0014 is the same rule inside can_see_event.
 *  The host, an accepted admin, and an accepted co-creator always see it.
 *  An exclude hides everyone else, including someone with an invite.
 *  Otherwise an include match or an event_invites row is enough.
 *  The extra clauses repeat 0014 so a database that still has 0008's function
 *  does not let an invite past an exclude. A deleted event stays hidden. */
export function canSeeEventSql(viewerParam: string, alias = "e"): string {
  if (!/^\$([1-9][0-9]*)$/.test(viewerParam) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(alias)) {
    throw new Error("canSeeEventSql: viewer must be $n and alias a bare name");
  }
  const v = viewerParam + "::uuid";
  const id = alias + ".id";
  return (
    "(can_see_event(" + v + ", " + alias + ") or (" +
    alias + ".deleted_at is null and " + v + " is not null and (" +
    "exists (select 1 from event_admins where event_id = " + id + " and user_id = " + v + " and status = 'accepted')" +
    " or exists (select 1 from rsvps where event_id = " + id + " and person_id = " + v + " and role = 'cocreator' and cocreator_pending = false)" +
    " or (not exists (select 1 from jsonb_array_elements_text(" + alias + ".audience->'exclude') tok where in_audience(" + v + ", " + alias + ".host_id, tok))" +
    " and exists (select 1 from event_invites where event_id = " + id + " and invitee_id = " + v + "))" +
    ")))"
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
