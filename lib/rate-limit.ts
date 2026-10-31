// Sliding-window per-IP limiter for paid endpoints. Generous by design:
// a human judge clicking around never trips it, a hammering bot does.
export function isRateLimited(
  store: Map<string, number[]>,
  ip: string,
  now: number,
  maxRuns: number,
  windowMs: number
): boolean {
  const arr = (store.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  store.set(ip, arr);
  if (store.size > 2000) {
    const first = store.keys().next().value;
    if (first !== undefined) store.delete(first);
  }
  return arr.length > maxRuns;
}
