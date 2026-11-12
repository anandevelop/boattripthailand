import 'server-only';
import { eq } from 'drizzle-orm';
import { parseHTML } from 'linkedom';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * /admin → เนื้อหาเว็บไซต์ → หน้าเพจ: edited text of นโยบายความเป็นส่วนตัว and ข้อกำหนดและเงื่อนไข.
 * Stored in settings 'site.legal'; the site reads it as window.__LEGAL__ (site-render bundle). A language that was
 * never edited keeps the built-in text in public/site/app.js (legalDocs). Section HTML is cleaned to a small allowlist.
 */
export const LEGAL_KEY = 'site.legal';
export const LEGAL_DOCS = ['privacy', 'terms'] as const;
type Doc = typeof LEGAL_DOCS[number];
type Sec = { id: string; h: string; html: string };
type LangDoc = { intro: string; secs: Sec[] };
export type LegalDoc = { th?: LangDoc; en?: LangDoc; updated: string; at: string; by: string };
export type Legal = Partial<Record<Doc, LegalDoc>>;

export async function legalContent(): Promise<Legal> {
  const [r] = await db.select().from(settings).where(eq(settings.key, LEGAL_KEY));
  return (r?.value as Legal) ?? {};
}

const TAGS = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'UL', 'OL', 'LI', 'H3', 'H4', 'DL', 'DT', 'DD', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'DIV', 'SPAN']);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'SVG', 'MATH', 'TEMPLATE', 'LINK', 'META']);
const CLASSES = new Set(['legal-table', 'legal-dl']);
/** allowlist: the tags above, href (http/https/mailto/tel/# or a site path) on links, a few known classes */
export function cleanLegalHtml(html: string) {
  const { document } = parseHTML(`<!doctype html><html><body><div id="r">${html.slice(0, 60_000)}</div></body></html>`);
  const root = document.getElementById('r')!;
  const walk = (el: Element) => {
    for (const c of [...el.children]) {
      if (DROP.has(c.tagName)) { c.remove(); continue; }
      walk(c);
      if (!TAGS.has(c.tagName)) { c.replaceWith(...[...c.childNodes]); continue; }
      for (const a of [...c.attributes]) {
        const n = a.name.toLowerCase(), v = a.value.trim();
        const keep = (c.tagName === 'A' && n === 'href' && /^(https?:|mailto:|tel:|#|\/(?!\/))/i.test(v)) || (c.tagName === 'A' && n === 'target' && v === '_blank')
          || (n === 'class' && v.split(/\s+/).every(x => CLASSES.has(x)));
        if (!keep) c.removeAttribute(a.name);
      }
      if (c.tagName === 'A' && c.getAttribute('target')) c.setAttribute('rel', 'noopener');
    }
  };
  walk(root);
  return root.innerHTML.trim();
}
const txt = (v: unknown, n: number) => (typeof v === 'string' ? v : '').replace(/[<>]/g, '').trim().slice(0, n);
function cleanLang(v: unknown): LangDoc | undefined {
  const o = (v ?? null) as { intro?: unknown; secs?: unknown } | null;
  if (!o || !Array.isArray(o.secs)) return undefined;
  const secs = o.secs.slice(0, 40).map((s, i) => { const x = (s ?? {}) as Record<string, unknown>;
    return { id: (typeof x.id === 'string' && /^[a-z0-9-]{1,40}$/.test(x.id) ? x.id : 's' + (i + 1)), h: txt(x.h, 200), html: cleanLegalHtml(typeof x.html === 'string' ? x.html : '') }; })
    .filter(s => s.h || s.html);
  // unique ids (they are the table-of-contents anchors)
  const seen = new Set<string>(); for (const s of secs) { while (seen.has(s.id)) s.id += '-2'; seen.add(s.id); }
  return secs.length ? { intro: txt(o.intro, 2000), secs } : undefined;
}

/** save one document (both languages as sent); null = back to the built-in text */
export async function saveLegal(doc: string, v: unknown, by: string) {
  if (!(LEGAL_DOCS as readonly string[]).includes(doc)) throw new Error('ไม่พบเอกสาร');
  const all = await legalContent(), before = all[doc as Doc] ?? null;
  if (v === null) delete all[doc as Doc];
  else {
    const o = (v ?? {}) as Record<string, unknown>, th = cleanLang(o.th), en = cleanLang(o.en);
    if (!th && !en) throw new Error('ต้องมีอย่างน้อย 1 หัวข้อ');
    const updated = typeof o.updated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.updated) ? o.updated : new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    all[doc as Doc] = { ...(th ? { th } : {}), ...(en ? { en } : {}), updated, at: new Date().toISOString(), by };
  }
  await db.insert(settings).values({ key: LEGAL_KEY, value: all }).onConflictDoUpdate({ target: settings.key, set: { value: all } });
  return { before, after: all[doc as Doc] ?? null, all };
}
