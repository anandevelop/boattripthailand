import 'server-only';
import { resolve4, resolve6, resolveMx } from 'node:dns/promises';

/* Public form guards (POST /api/leads, GET /api/leads/email-check).
   public/site/app.js has the same LINK pattern so people see the error before sending. */

/** a link: http(s)://, www., <a …>, [url], short links */
export const LINK = /https?:\/\/|www\.|<\s*a[\s>]|\[\/?(?:url|link)\b|\b(?:bit\.ly|t\.me|tinyurl\.com|goo\.gl|wa\.me|lin\.ee)\b/i;
/** a bare domain (word.tld): 3+ characters before the dot and a lowercase TLD, so names like "K.Win", "Mr.Win", "Dr.Su" and "party.Today" are not links */
export const DOMAIN = /\b[A-Za-z0-9][A-Za-z0-9-]{2,62}\.(?:com|net|org|info|biz|ru|cn|xyz|top|site|online|shop|store|club|io|ly|link|click|live|app|dev|tk|ml|ga|cf|gq|pw|cc|ws|su|vip|win|bid|loan|work|today|space|website|tech|pro|asia)\b/;
/** email addresses are fine in a message ("email me at anna@hotmail.com") */
const EMAILS = /[^\s@]+@[^\s@]+/g;
/** `bare: false` for the phone / LINE ID field, where an ID like "boat.pro" is normal */
export const hasLink = (s?: string | null, bare = true) => !!s && (LINK.test(s) || (bare && DOMAIN.test(s.replace(EMAILS, ' '))));

/** throwaway inboxes — enough to stop the usual ones, not a full list */
const DISPOSABLE = new Set(('mailinator.com 10minutemail.com 10minutemail.net guerrillamail.com guerrillamail.net guerrillamailblock.com sharklasers.com grr.la yopmail.com yopmail.net ' +
  'temp-mail.org tempmail.com tempmail.net tempmailo.com tempail.com tmpmail.org tmpmail.net getnada.com nada.email maildrop.cc dispostable.com fakeinbox.com throwawaymail.com ' +
  'mintemail.com emailondeck.com moakt.com mohmal.com burnermail.io trashmail.com trashmail.de mailnesia.com mytemp.email spamgourmet.com mailcatch.com discard.email ' +
  'emailfake.com fakemail.net mail.tm mailpoof.com inboxkitten.com 1secmail.com 1secmail.org 1secmail.net').split(' '));

export type EmailCheck = { ok: boolean; reason?: 'format' | 'disposable' | 'domain' };
const FORMAT = /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const cache = new Map<string, { at: number; ok: boolean }>();
const withTimeout = <T,>(p: Promise<T>, ms = 3000) => {
  let t: NodeJS.Timeout;
  return Promise.race([p, new Promise<never>((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms); })]).finally(() => clearTimeout(t));
};

/** Real-looking address on a domain that receives mail (has MX records).
 *  It can't prove the inbox itself exists — only a confirmation email can. DNS errors let the address through. */
export async function checkEmail(raw: string): Promise<EmailCheck> {
  const email = raw.trim().toLowerCase();
  if (email.length > 160 || !FORMAT.test(email) || email.includes('..')) return { ok: false, reason: 'format' };
  const domain = email.split('@')[1];
  if (DISPOSABLE.has(domain)) return { ok: false, reason: 'disposable' };
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < 60 * 60_000) return hit.ok ? { ok: true } : { ok: false, reason: 'domain' };
  let ok = true;
  try {
    const mx = await withTimeout(resolveMx(domain));
    // RFC 7505 "null MX" (exchange '.') = the domain says it takes no mail
    ok = mx.some(r => r.exchange && r.exchange !== '.');
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'ENOTFOUND') ok = false;                           // no such domain
    else if (code === 'ENODATA') {                                  // no MX: mail goes to the domain's own address (RFC 5321 §5.1)
      const found = await Promise.all([resolve4, resolve6].map(f => withTimeout(f(domain)).then(a => a.length > 0, (x: { code?: string }) => x.code === 'ENOTFOUND' || x.code === 'ENODATA' ? false : null)));
      if (found.includes(null)) return { ok: true };
      ok = found.includes(true);
    }
    else return { ok: true };                                       // DNS trouble on our side: don't lose a real lead
  }
  if (cache.size > 2000) cache.clear();
  cache.set(domain, { at: Date.now(), ok });
  return ok ? { ok: true } : { ok: false, reason: 'domain' };
}
