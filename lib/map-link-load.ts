import { createRequire } from "node:module";
import path from "node:path";

/** What one provider's parser returns. `name` and the coordinates may each be missing. */
export type MapPin = {
  provider: string;
  name: string | null;
  lat: number | null;
  lng: number | null;
};

export type MapClass = {
  kind: "empty" | "text" | "unsafe" | "short" | "pin";
  url?: string;
  pin?: MapPin;
};

export type MapApi = {
  PROVIDERS: { id: string; hosts: string[] }[];
  parseMapLink: (url: string) => MapPin | null;
  classifyMapInput: (raw: string) => MapClass;
  allowedHop: (host: string) => boolean;
  coordLabel: (pin: { lat: number | null; lng: number | null }) => string;
  followMapRedirects: (
    raw: string,
    opts: { fetch?: typeof fetch; check?: (url: URL) => Promise<void>; signal?: AbortSignal },
  ) => Promise<string>;
};

// The parser lives in _shared so the prototype page and these routes share one copy.
// createRequire keeps tsc from typechecking that browser script.
const require = createRequire(path.join(process.cwd(), "package.json"));

export function mapApi(): MapApi {
  return require("./_shared/map-link.js") as MapApi;
}
