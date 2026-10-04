import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { branchName } from "@/lib/branch";
import { json, route } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/health — is the database reachable, which branch, which migration ran last. No login needed. */
export const GET = route(async () => {
  const started = Date.now();
  const res = await db().execute(
    sql`select current_database() as database,
               (select name from _migrations order by applied_at desc limit 1) as migration`,
  );
  const row = res.rows[0] as { database: string; migration: string | null } | undefined;
  return json({ ok: true, branch: branchName(), ...row, ms: Date.now() - started });
});
