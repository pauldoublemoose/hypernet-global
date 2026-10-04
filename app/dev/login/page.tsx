"use client";

// A bare test page for the email-code login and the events API: /dev/login.
// It exists so the backend can be tried before the prototype is wired to it (phase 2). Delete it then.
import { createAuthClient } from "@neondatabase/auth/next";
import { useState, type CSSProperties, type FormEvent } from "react";

const authClient = createAuthClient();

export default function DevLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [out, setOut] = useState("");

  const show = (label: string, value: unknown) =>
    setOut((o) => `${label}\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n\n${o}`);

  const call = async (label: string, url: string, init?: RequestInit) => {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
    show(`${label} → ${res.status}`, await res.json().catch(() => "(no JSON)"));
  };

  async function sendCode(ev: FormEvent) {
    ev.preventDefault();
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    if (error) return show("send code failed", error);
    setSent(true);
    show("code sent", `Check ${email} for a 6-digit code.`);
  }

  async function signIn(ev: FormEvent) {
    ev.preventDefault();
    const { error } = await authClient.signIn.emailOtp({ email, otp: code.trim() });
    if (error) return show("sign in failed", error);
    await call("GET /api/me", "/api/me");
  }

  async function join() {
    const handle = (email.split("@")[0] || "me").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30) || "me";
    await call("POST /api/me", "/api/me", { method: "POST", body: JSON.stringify({ handle, displayName: handle }) });
  }

  async function createEvent() {
    const startsOn = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    await call("POST /api/events", "/api/events", {
      method: "POST",
      body: JSON.stringify({ title: "Test gathering", startsOn, privacy: "friends", city: "Brno" }),
    });
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 20 }}>Hypernet backend — test page</h1>
      <p style={{ color: "#555" }}>Log in with an emailed code, then try the API. Not part of the product.</p>

      <form onSubmit={sendCode} style={row}>
        <input type="email" required placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} style={input} />
        <button type="submit">Send code</button>
      </form>

      {sent && (
        <form onSubmit={signIn} style={row}>
          <input inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code}
            onChange={(e) => setCode(e.target.value)} style={input} />
          <button type="submit">Log in</button>
        </form>
      )}

      <div style={{ ...row, flexWrap: "wrap" }}>
        <button onClick={() => call("GET /api/health", "/api/health")}>Health</button>
        <button onClick={() => call("GET /api/me", "/api/me")}>Me</button>
        <button onClick={join}>Join (create profile)</button>
        <button onClick={createEvent}>Create test event</button>
        <button onClick={() => call("GET /api/events", "/api/events")}>List events</button>
        <button onClick={async () => { await authClient.signOut(); show("signed out", ""); }}>Sign out</button>
      </div>

      <pre style={{ background: "#fff", padding: 12, whiteSpace: "pre-wrap", fontSize: 12, minHeight: 120 }}>{out}</pre>
    </main>
  );
}

const row: CSSProperties = { display: "flex", gap: 8, margin: "12px 0" };
const input: CSSProperties = { flex: 1, padding: 8, fontSize: 16 };

