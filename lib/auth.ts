import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { branch } from "./branch";
import { need } from "./env";
import { HttpError } from "./http";

// Neon Auth (managed Better Auth). Login is an emailed one-time code; the first successful code creates the
// login. The browser only ever talks to our /api/auth/* (a proxy to the branch's auth server); the session lives
// in an http-only cookie signed with AUTH_SECRET.
//
// Created on first use, not at import: `next build` must work with no secrets.
let _auth: NeonAuth | undefined;

export function auth(): NeonAuth {
  if (!_auth) {
    _auth = createNeonAuth({
      baseUrl: branch().authBaseUrl,
      cookies: { secret: need("AUTH_SECRET") },
    });
  }
  return _auth;
}

export type SessionUser = { id: string; email: string; name: string };

/** The logged-in login (email), or null. */
export async function sessionUser(): Promise<SessionUser | null> {
  const { data } = await auth().getSession();
  const u = data?.user;
  return u ? { id: u.id, email: u.email, name: u.name } : null;
}

export type Person = typeof schema.people.$inferSelect;

/** The login and its Hypernet profile (null until they join with POST /api/me). */
export async function currentPerson(): Promise<{ user: SessionUser | null; person: Person | null }> {
  const user = await sessionUser();
  if (!user) return { user: null, person: null };
  const [person] = await db().select().from(schema.people).where(eq(schema.people.authUserId, user.id)).limit(1);
  return { user, person: person ?? null };
}

/** For writes: 401 when logged out, 403 when logged in but not joined yet. */
export async function requirePerson(): Promise<Person> {
  const { user, person } = await currentPerson();
  if (!user) throw new HttpError(401, "login_required", "Log in first.");
  if (!person) throw new HttpError(403, "join_required", "Create your profile first (POST /api/me).");
  return person;
}
