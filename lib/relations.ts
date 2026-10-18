import { currentPerson } from "@/lib/auth";
import { sqlx } from "@/lib/db";
import { notFound } from "@/lib/ids";

export type PersonName = { id: string; displayName: string; handle: string };

export type Relations = {
  followers: PersonName[];
  following: PersonName[];
  friends: PersonName[] | null;
};

/** A logged-out read of a person, horizon, or event is the same 404 as a missing id. */
export async function personOrNotFound() {
  const { person } = await currentPerson();
  if (!person) throw notFound();
  return person;
}

/**
 * Follower and following names for any logged-in viewer.
 * Friend names only when the viewer is the subject. Anyone else gets friends: null.
 * A friend list is the close graph. Counts on the person row already say how big it is.
 */
export async function relationsFor(viewer: string, id: string): Promise<Relations | null> {
  const known = (await sqlx().query(`select 1 from people where id = $1`, [id])) as unknown[];
  if (!known.length) return null;
  const rows = (await sqlx().query(
    `select kind, id, display_name, handle from (
       select 'followers' as kind, p.id, p.display_name, p.handle, f.created_at
         from person_follows f join people p on p.id = f.follower_id
        where f.followee_id = $1
       union all
       select 'following', p.id, p.display_name, p.handle, f.created_at
         from person_follows f join people p on p.id = f.followee_id
        where f.follower_id = $1
     ) s order by created_at desc`,
    [id],
  )) as { kind: string; id: string; display_name: string; handle: string }[];
  const name = (r: { id: string; display_name: string; handle: string }): PersonName => ({ id: r.id, displayName: r.display_name, handle: r.handle });
  const followers = rows.filter((r) => r.kind === "followers").map(name);
  const following = rows.filter((r) => r.kind === "following").map(name);
  if (viewer !== id) return { followers, following, friends: null };
  const friends = (await sqlx().query(
    `select p.id, p.display_name, p.handle
       from friendships f
       join people p on p.id = case when f.a = $1 then f.b else f.a end
      where f.status = 'accepted' and (f.a = $1 or f.b = $1)
      order by p.display_name`,
    [viewer],
  )) as { id: string; display_name: string; handle: string }[];
  return { followers, following, friends: friends.map(name) };
}
