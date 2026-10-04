import { auth } from "@/lib/auth";
import { route } from "@/lib/http";

// Every /api/auth/* call (send code, sign in with code, get session, sign out) is proxied to the Neon Auth server
// of this deployment's branch. The library sets the session cookies on our own domain.
type Ctx = { params: Promise<{ path: string[] }> };

export const dynamic = "force-dynamic";

export const GET = route((req: Request, ctx: Ctx) => auth().handler().GET(req, ctx));
export const POST = route((req: Request, ctx: Ctx) => auth().handler().POST(req, ctx));
