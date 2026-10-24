/** Simple in-memory sliding window (single container). Swap for Redis if you scale out. */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now(), arr = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return arr.length <= limit;
}
