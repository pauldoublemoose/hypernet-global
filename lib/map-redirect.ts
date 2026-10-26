import { HttpError } from "./http";
import { assertPublic } from "./link-event";
import { mapApi } from "./map-link-load";

export type MapResolveOpts = {
  fetch?: typeof fetch;
  /** Replaces the public-address check. Tests pass one so they never look up DNS. */
  check?: (url: URL) => Promise<void>;
};

/**
 * Follow a short map link and return the https URL it lands on, for the client to parse.
 * The hop rules live in _shared/map-link.js. This adds the logged-in route's errors:
 * a public-address check, https only, and a timeout. The body is not read.
 */
export async function resolveMapLink(raw: string, opts: MapResolveOpts = {}): Promise<string> {
  const maps = mapApi();
  try {
    return await maps.followMapRedirects(raw, {
      fetch: opts.fetch ?? fetch,
      check: opts.check ?? assertPublic,
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const e = err as { status?: number; code?: string; message?: string };
    if (e && typeof e.status === "number" && e.code) throw new HttpError(e.status, e.code, e.message);
    throw new HttpError(422, "unreachable", "The map link didn't answer in time.");
  }
}
