import crypto from "node:crypto";
import { branch } from "@/lib/branch";
import { need } from "@/lib/env";
import { loginCodeEmail } from "@/lib/email/login-code";
import { HttpError, json, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Neon Auth's `send.otp` webhook: when it is enabled on a branch, Neon stops sending its own (Neon-branded) code
// email and calls this instead; we send the Hypernet one through Resend. NOT enabled yet — it needs a sender domain
// verified in Resend (EMAIL_FROM). How to switch it on: docs/infra.md, "Login emails".
//
// Every request is verified (Ed25519 detached JWS, Neon's JWKS for this branch) before anything is sent.

type Jwk = crypto.JsonWebKey & { kid?: string };
let jwksCache: { at: number; keys: Jwk[] } | null = null;

async function jwks(force = false): Promise<Jwk[]> {
  if (!force && jwksCache && Date.now() - jwksCache.at < 10 * 60_000) return jwksCache.keys;
  const res = await fetch(`${branch().authBaseUrl}/.well-known/jwks.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`JWKS ${res.status}`);
  const keys = ((await res.json()) as { keys: Jwk[] }).keys;
  jwksCache = { at: Date.now(), keys };
  return keys;
}

async function verify(raw: string, headers: Headers): Promise<Record<string, unknown>> {
  const signature = headers.get("x-neon-signature"), kid = headers.get("x-neon-signature-kid"), timestamp = headers.get("x-neon-timestamp");
  if (!signature || !kid || !timestamp) throw new HttpError(401, "unsigned", "Missing Neon webhook headers.");
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60_000) throw new HttpError(401, "stale", "Webhook timestamp too old.");
  let jwk = (await jwks()).find((k) => k.kid === kid);
  if (!jwk) jwk = (await jwks(true)).find((k) => k.kid === kid);
  if (!jwk) throw new HttpError(401, "unknown_key", "Unknown signing key.");
  const [headerB64, empty, sigB64] = signature.split(".");
  if (empty !== "" || !headerB64 || !sigB64) throw new HttpError(401, "bad_signature", "Expected a detached JWS.");
  const payloadB64 = Buffer.from(raw, "utf8").toString("base64url");
  const signingInput = `${headerB64}.${Buffer.from(`${timestamp}.${payloadB64}`, "utf8").toString("base64url")}`;
  const ok = crypto.verify(null, Buffer.from(signingInput), crypto.createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(sigB64, "base64url"));
  if (!ok) throw new HttpError(401, "bad_signature", "Invalid webhook signature.");
  return JSON.parse(raw);
}

/** POST /api/hooks/neon-auth — Neon Auth events (send.otp). */
export const POST = route(async (req: Request) => {
  const raw = await req.text();
  const payload = await verify(raw, req.headers);
  if (payload.event_type !== "send.otp") return json({ ok: true, ignored: payload.event_type });
  const user = payload.user as { email?: string } | undefined;
  const data = payload.event_data as { otp_code?: string; otp_type?: string; expires_at?: string } | undefined;
  if (!user?.email || !data?.otp_code) throw new HttpError(400, "invalid", "No email or code in the event.");
  const minutes = data.expires_at ? Math.max(1, Math.round((Date.parse(data.expires_at) - Date.now()) / 60_000)) : 5;
  const mail = loginCodeEmail(data.otp_code, { minutes, kind: data.otp_type });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${need("RESEND_API_KEY")}`, "Content-Type": "application/json",
               "Idempotency-Key": String(payload.event_id ?? "") || crypto.randomUUID() },
    body: JSON.stringify({ from: need("EMAIL_FROM"), to: [user.email], subject: mail.subject, html: mail.html, text: mail.text }),
  });
  if (!res.ok) {
    // 403 from Resend = the EMAIL_FROM domain is not verified there. Say so plainly in the log; Neon then shows
    // the person an error (no code arrives), so this must never be switched on before the domain is verified.
    const detail = await res.text().catch(() => "");
    console.error(`Resend refused the login email (${res.status})${res.status === 403 ? " — is the EMAIL_FROM domain verified in Resend?" : ""}: ${detail.slice(0, 300)}`);
    throw new HttpError(502, "email_failed", res.status === 403 ? "Email sender not verified." : "Email provider error.");
  }
  return json({ ok: true });
});
