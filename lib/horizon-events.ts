/** The saver's list fills the places of events they can see, in the order they sent.
 *  An event they cannot see stays in its place. A new event goes on the end.
 *  `hidden` is the subset of `current` the saver cannot see. */
export function mergeHorizonEventIds(current: readonly string[], hidden: ReadonlySet<string>, submitted: readonly string[]): string[] {
  const seen = new Set<string>();
  const visible: string[] = [];
  for (const id of submitted) {
    if (hidden.has(id) || seen.has(id)) continue;
    seen.add(id);
    visible.push(id);
  }
  const out: string[] = [];
  let next = 0;
  for (const id of current) {
    if (hidden.has(id)) out.push(id);
    else if (next < visible.length) out.push(visible[next++]);
  }
  while (next < visible.length) out.push(visible[next++]);
  return out;
}
