import { currentPerson } from "@/lib/auth";
import { loadBootstrap } from "@/lib/bootstrap";
import { branchName } from "@/lib/branch";
import { json, route } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/bootstrap — what the app needs to draw its first screen, for whoever is looking:
 *   { hypernet: 1, branch, login: {email} | null, me: person | null,
 *     people, follows, events, rsvps, promotions, horizons, hzFollows, callouts, replies, activity, chats }
 * Logged out (or logged in but not joined yet) the shell still loads: people and counts are there,
 * and events, follows, friendships and lists are empty. An event requires a logged-in viewer.
 */
export const GET = route(async () => {
  const { user, person } = await currentPerson();
  const data = await loadBootstrap(person?.id ?? null);
  return json({
    ...data,
    branch: branchName(),
    login: user ? { email: user.email } : null,
    me: person
      ? { id: person.id, email: person.email, handle: person.handle, displayName: person.displayName, bio: person.bio,
          skills: person.skills, cities: person.cities, look: person.look }
      : null,
  });
});
