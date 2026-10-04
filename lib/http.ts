import { ZodError } from "zod";
import { ConfigError } from "./env";

/** An error that becomes a JSON response with this status. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function json(body: unknown, init?: number | ResponseInit): Response {
  const ri = typeof init === "number" ? { status: init } : init;
  return Response.json(body, {
    ...ri,
    headers: { "Cache-Control": "no-store", ...ri?.headers },
  });
}

/**
 * Wraps a route handler so every failure is a small, predictable JSON body:
 *   400 invalid      — the request body or query did not validate (zod issues included)
 *   4xx <code>       — an HttpError thrown on purpose (401 login, 404 not found, …)
 *   503 not_configured — a secret is missing on this machine / deployment
 *   500 internal     — anything else (details only in the server log)
 */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.code, message: err.message }, err.status);
      if (err instanceof ZodError) return json({ error: "invalid", issues: err.issues }, 400);
      if (err instanceof ConfigError) {
        console.error(err.message);
        return json({ error: "not_configured", missing: err.key }, 503);
      }
      console.error(err);
      return json({ error: "internal" }, 500);
    }
  };
}

/** Reads a JSON body; a body that is not JSON is a 400, not a 500. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be JSON.");
  }
}
