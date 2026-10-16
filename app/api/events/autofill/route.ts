import { requirePerson } from "@/lib/auth";
import { eventByLink } from "@/lib/events";
import { json, readJson, route } from "@/lib/http";
import { cleanUrl, readEventLink } from "@/lib/link-event";
import { linkRead } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/autofill {url} → {draft} — what the page at `url` says about its event, for the form to fill in
 * (nothing is saved). If that link is already an event here, {existing} is it, so the form offers that one instead:
 * one link is one event. Logged-in people only, so this is no open proxy.
 */
export const POST = route(async (req: Request) => {
  const me = await requirePerson();
  const { url } = linkRead.parse(await readJson(req));
  const clean = cleanUrl(url);
  const existing = await eventByLink(clean, me.id);
  if (existing) return json({ existing, draft: null });
  const draft = await readEventLink(clean);
  // the page may know itself by another address (its canonical link): check that one too
  const again = draft.sourceUrl !== clean ? await eventByLink(draft.sourceUrl, me.id) : null;
  return json({ existing: again, draft });
});
