import { z } from "zod";
import { HttpError } from "./http";

/** A uuid from the URL, or the 404 the route would give anyway (so a bad id and a hidden thing look the same). */
export async function idParam(params: Promise<Record<string, string>>, key = "id", what = "This is private or no longer here."): Promise<string> {
  const raw = (await params)[key];
  const ok = z.uuid().safeParse(raw);
  if (!ok.success) throw new HttpError(404, "not_found", what);
  return ok.data;
}

export const notFound = (what = "This is private or no longer here.") => new HttpError(404, "not_found", what);
export const forbidden = (what = "Only its owner can change this.") => new HttpError(403, "forbidden", what);

/** JSON for a jsonb parameter (null stays SQL null). */
export const j = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

export type Ctx<K extends string = "id"> = { params: Promise<Record<K, string>> };
