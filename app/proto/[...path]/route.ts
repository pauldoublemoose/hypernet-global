import { readFile } from "node:fs/promises";
import path from "node:path";
import { branchName } from "@/lib/branch";

// The prototype (index.html + _shared/*.js + data/*.json at the repo root) served as-is, read on every request,
// so edits show on reload. next.config.ts rewrites / → /proto/index.html, /_shared/* and /data/* to here.
// Temporary: once the UI moves into the app, `git mv index.html _shared data public/` replaces this file.
//
// One thing is added on the way out: a line telling the page it is served by the backend (window.HN_BACKEND).
// _shared/hypernet-api.js reads it: with it the page runs on the database; without it (a static server, the
// regression suite's file routing) it runs on the bundled fixtures, exactly as before. ?offline=1 forces fixtures.
const ALLOWED = [/^index\.html$/, /^review-markers\.js$/, /^_shared\/[a-z0-9-]+\.js$/, /^data\/[a-z0-9-]+\.json$/];
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const rel = (await ctx.params).path.join("/");
  if (!ALLOWED.some((re) => re.test(rel))) return new Response("Not found", { status: 404 });
  let body: string;
  try {
    body = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), rel), "utf8");
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (rel === "index.html") {
    const marker = `<script>window.HN_BACKEND=${JSON.stringify({ branch: branchName() })};</script>\n`;
    const html = body;
    const at = html.indexOf("<script src=\"_shared/");
    body = at >= 0 ? html.slice(0, at) + marker + html.slice(at) : html.replace("</head>", marker + "</head>");
  }
  return new Response(body, {
    headers: { "Content-Type": TYPES[path.extname(rel)], "Cache-Control": "no-cache" },
  });
}
