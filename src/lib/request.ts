import { headers } from 'next/headers';

export async function clientInfo() {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || null;
  return { ip, userAgent: h.get('user-agent') || null };
}
/** the visitor's IP from a Request's headers (Caddy sends exactly one X-Forwarded-For entry: the real visitor) */
export const clientIp = (h: Headers) => (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || null;
