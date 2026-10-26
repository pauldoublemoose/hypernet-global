import { requirePerson } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { resolveMapLink } from "@/lib/map-redirect";
import { mapResolve } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/maps/resolve {url} → {url} — where a short map link redirects, so the page can read the place.
 * Logged-in people only, so this is no open proxy. The link the person pasted is kept; this only returns
 * the address it opened.
 */
export const POST = route(async (req: Request) => {
  await requirePerson();
  const { url } = mapResolve.parse(await readJson(req));
  return json({ url: await resolveMapLink(url) });
});
