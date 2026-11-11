import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Bot / spam guards for the public booking forms (POST /api/leads), on top of lib/spam.ts (links, email MX):
 *  1. a signed, one-time form token from GET /api/leads/token — needs JavaScript, must be ≥ 3 s old (bots post at once),
 *     expires after 24 h and can be used once (no replaying one token)
 *  2. spam content: casino / crypto / SEO-offer words, mostly foreign script, a name full of digits, long repeated runs
 *  3. Cloudflare Turnstile — only when TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY are set (free, no billing)
 * Rate limits, origin check and duplicates are in app/api/leads/route.ts.
 */
const KEY = createHash('sha256').update('btt-lead-token|' + (process.env.LEAD_TOKEN_SECRET || process.env.POSTGRES_PASSWORD || process.env.DATABASE_URL || 'btt')).digest();
const sign = (s: string) => createHmac('sha256', KEY).update(s).digest('base64url').slice(0, 32);
export const TOKEN_MIN_MS = 3000, TOKEN_MAX_MS = 24 * 3600e3;

export function issueToken() {
  const body = `${Date.now().toString(36)}.${randomBytes(9).toString('base64url')}`;
  return `${body}.${sign(body)}`;
}

const used = new Map<string, number>();
export type TokenCheck = 'ok' | 'missing' | 'bad' | 'fast' | 'old' | 'used';
export function checkToken(k: unknown): TokenCheck {
  if (typeof k !== 'string' || !k) return 'missing';
  const m = k.match(/^([0-9a-z]{6,12})\.([\w-]{8,20})\.([\w-]{32})$/);
  if (!m) return 'bad';
  const a = Buffer.from(sign(`${m[1]}.${m[2]}`)), b = Buffer.from(m[3]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 'bad';
  const age = Date.now() - parseInt(m[1], 36);
  if (age < TOKEN_MIN_MS) return 'fast';
  if (age > TOKEN_MAX_MS) return 'old';
  if (used.has(m[2])) return 'used';
  used.set(m[2], Date.now());
  if (used.size > 20000) for (const [n, t] of used) if (Date.now() - t > TOKEN_MAX_MS) used.delete(n);
  return 'ok';
}

/* ---------- spam content ---------- */
// whole words / phrases only; Thai gambling & loan spam too. A real charter request never needs these.
const WORDS = new RegExp([
  'casino', 'gambling', 'betting', 'slot\\s*online', 'poker', 'viagra', 'cialis', 'porn', 'escort', 'xxx', 'sex\\s*(?:chat|cam|dating)',
  'crypto(?:currency)?', 'bitcoin', 'btc', 'usdt', 'forex', 'binary\\s*option', 'nft', 'airdrop', 'investment\\s*opportunit',
  'seo\\s*(?:service|expert|agency|package|audit)', 'backlinks?', 'guest\\s*post', 'domain\\s*authority', 'first\\s*page\\s*(?:of|on)\\s*google', 'rank(?:ing)?\\s*(?:your|on)\\s*google',
  'web\\s*(?:design|development)\\s*(?:service|agency|company)', 'increase\\s*(?:your\\s*)?(?:traffic|sales|leads)', 'lead\\s*generation', 'virtual\\s*assistant', 'outsourc',
  'loan', 'payday', 'credit\\s*repair', 'unsubscribe', 'click\\s*here',
  'บาคาร่า', 'สล็อต', 'คาสิโน', 'เว็บพนัน', 'แทงบอล', 'หวยออนไลน์', 'เครดิตฟรี', 'ฝากถอน', 'เว็บตรง', 'ยูฟ่า', 'สินเชื่อด่วน', 'กู้เงินด่วน', 'รับทำ\\s*seo', 'ปั่นยอด', 'ปั้มไลค์',
].map(w => /^[a-z]/.test(w) ? `\\b${w}` : w).join('|'), 'i');
const FOREIGN = /[Ѐ-ӿ؀-ۿ぀-ヿ一-鿿가-힯]/g;   // Cyrillic, Arabic, Japanese, Chinese, Korean
const LETTERS = /[\p{L}]/gu;

/** reasons the text looks like spam — empty = fine. Kept narrow so a real guest is never dropped. */
export function spamReasons(f: { name?: string | null; message?: string | null; program?: string | null }) {
  const out: string[] = [];
  const name = f.name ?? '', msg = (f.message ?? '').replace(/^(?:ติดต่อกลับทาง|Contact via):[^\n]*\n?/, '');
  const all = `${name}\n${msg}`;
  if (WORDS.test(all)) out.push('words');
  for (const [k, s] of [['name', name], ['message', msg]] as const) {
    const letters = (s.match(LETTERS) || []).length, foreign = (s.match(FOREIGN) || []).length;
    if (letters >= 8 && foreign / letters > 0.3) out.push('script:' + k);
  }
  if ((name.match(/\d/g) || []).length >= 5) out.push('name-digits');
  if (/(.)\1{9,}/u.test(all)) out.push('repeat');
  if (name.length > 70 || name.split(/\s+/).length > 8) out.push('name-long');
  return out;
}

/* ---------- Cloudflare Turnstile (optional) ---------- */
export const turnstileOn = () => !!(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
/** true = passed; false = Cloudflare said no; null = could not ask (network) — the caller lets it through, the other guards still apply */
export async function turnstileOk(token: unknown, ip: string): Promise<boolean | null> {
  if (typeof token !== 'string' || !token || token.length > 4096) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, ...(ip && ip !== 'unknown' ? { remoteip: ip } : {}) }),
    });
    const j = await r.json() as { success?: boolean };
    return !!j.success;
  } catch { return null; }
}
