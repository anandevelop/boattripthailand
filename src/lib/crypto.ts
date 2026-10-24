import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const sha256Lower = (s: string) => sha256(s.trim().toLowerCase());
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const randomDigits = (n = 6) => Array.from(randomBytes(n), b => String(b % 10)).join('');
export function hmacBase64(secret: string, body: string) { return createHmac('sha256', secret).update(body).digest('base64'); }
export function safeEqual(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
/** readable temporary password */
export function tempPassword() { const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from(randomBytes(14), b => c[b % c.length]).join(''); }
/** JSON with recursively sorted keys — Postgres jsonb reorders keys, so hashes must not depend on order */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k])).join(',') + '}';
  return JSON.stringify(v ?? null);
}
