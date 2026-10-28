import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * LINE Messaging API keys set from /admin → ตั้งค่า → LINE & แจ้งเตือน.
 * Stored AES-256-GCM encrypted in settings('line.config'); never sent back to the browser.
 * .env (LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN) still wins when set.
 * lineSaved() is synchronous (line.ts needs it in sync helpers) and reads a cache filled at start-up and on save.
 */
export const LINE_KEY = 'line.config';
type Sealed = { enc: string; tail: string };
export type LineCfg = { secret: Sealed | null; token: Sealed | null; at?: string; by?: string };

const key = () => createHash('sha256').update('btt-line|' + (process.env.SETTINGS_KEY || process.env.POSTGRES_PASSWORD || process.env.DATABASE_URL || 'btt')).digest();
const seal = (plain: string): Sealed => { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', key(), iv), enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]); return { enc: [iv, c.getAuthTag(), enc].map(b => b.toString('base64')).join('.'), tail: plain.slice(-4) }; };
function open(s: Sealed | null) {
  if (!s) return '';
  try { const [iv, tag, enc] = s.enc.split('.').map(x => Buffer.from(x, 'base64')); const d = createDecipheriv('aes-256-gcm', key(), iv); d.setAuthTag(tag); return Buffer.concat([d.update(enc), d.final()]).toString('utf8'); }
  catch { return ''; }   // key changed (SETTINGS_KEY / POSTGRES_PASSWORD) → treat as not set
}

const G = globalThis as unknown as { __lineCfg?: { at: number; cfg: LineCfg; plain: { secret: string; token: string } } };
export async function loadLineCfg(force = false) {
  if (!force && G.__lineCfg && Date.now() - G.__lineCfg.at < 5 * 60_000) return G.__lineCfg.cfg;
  try {
    const [r] = await db.select().from(settings).where(eq(settings.key, LINE_KEY));
    const cfg = ((r?.value as LineCfg) ?? { secret: null, token: null });
    G.__lineCfg = { at: Date.now(), cfg, plain: { secret: open(cfg.secret), token: open(cfg.token) } };
  } catch (e) { console.error('[line-config]', e); if (!G.__lineCfg) G.__lineCfg = { at: Date.now(), cfg: { secret: null, token: null }, plain: { secret: '', token: '' } }; }
  return G.__lineCfg.cfg;
}
/** keys saved in the admin (decrypted, cached); refreshed in the background every 5 min */
export function lineSaved() {
  if (!G.__lineCfg || Date.now() - G.__lineCfg.at > 5 * 60_000) void loadLineCfg();
  return G.__lineCfg?.plain ?? { secret: '', token: '' };
}

export class LineCfgError extends Error {}
/** secret / token: string = replace, null = remove, undefined = keep */
export async function saveLineCfg(v: { secret?: unknown; token?: unknown }, by: string) {
  const before = await loadLineCfg(true);
  const next: LineCfg = { secret: before.secret, token: before.token, at: new Date().toISOString(), by };
  if (v.secret === null) next.secret = null;
  else if (typeof v.secret === 'string' && v.secret.trim()) {
    const s = v.secret.trim();
    if (!/^[0-9a-f]{32}$/i.test(s)) throw new LineCfgError('Channel secret ต้องเป็นตัวอักษร 0-9 a-f ยาว 32 ตัว (LINE Developers › Basic settings)');
    next.secret = seal(s);
  }
  if (v.token === null) next.token = null;
  else if (typeof v.token === 'string' && v.token.trim()) {
    const t = v.token.trim();
    if (t.length < 100 || /\s/.test(t)) throw new LineCfgError('Channel access token ไม่ถูกต้อง · ใช้แบบ long-lived จากแท็บ Messaging API');
    next.token = seal(t);
  }
  await db.insert(settings).values({ key: LINE_KEY, value: next }).onConflictDoUpdate({ target: settings.key, set: { value: next } });
  await loadLineCfg(true);
  return { before, after: next };
}
