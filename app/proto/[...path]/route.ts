import { readFile } from "node:fs/promises";
import path from "node:path";

// The prototype (index.html + _shared/*.js + data/*.json at the repo root) served as-is, read on every request,
// so edits show on reload. next.config.ts rewrites / → /proto/index.html, /_shared/* and /data/* to here.
// Temporary: once the UI moves into the app, `git mv index.html _shared data public/` replaces this file.
const ALLOWED = [/^index\.html$/, /^_shared\/[a-z0-9-]+\.js$/, /^data\/[a-z0-9-]+\.json$/];
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const rel = (await ctx.params).path.join("/");
  if (!ALLOWED.some((re) => re.test(rel))) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), rel));
    return new Response(body, {
      headers: { "Content-Type": TYPES[path.extname(rel)], "Cache-Control": "no-cache" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
