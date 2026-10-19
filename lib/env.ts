// Every secret is read here, lazily, at request time — never at import time.
// That is what lets `next build` run with no secrets at all: a missing key
// only fails the request that needs it, with a message that names the key.
//
// Where each key comes from: .env.example and docs/infra.md.

export class ConfigError extends Error {
  constructor(public readonly key: string) {
    super(`${key} is not set. Add it to .env.local (see .env.example), then restart.`);
    this.name = "ConfigError";
  }
}

/** A required value. Throws ConfigError (→ 503) when it is missing or empty. */
export function need(key: string): string {
  const v = process.env[key];
  if (v === undefined || v.trim() === "") throw new ConfigError(key);
  return v.trim();
}

/** An optional value with a default (for non-secret settings). */
export function opt(key: string, fallback: string): string {
  const v = process.env[key];
  return v === undefined || v.trim() === "" ? fallback : v.trim();
}
