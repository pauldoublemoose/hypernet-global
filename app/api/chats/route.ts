import { requirePerson } from "@/lib/auth";
import { loadChats } from "@/lib/bootstrap";
import { json, route } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/chats — your conversations (one per person), with their messages and when you last read each. */
export const GET = route(async () => {
  const me = await requirePerson();
  return json({ chats: await loadChats(me.id) });
});
