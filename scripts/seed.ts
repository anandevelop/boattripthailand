/**
 * Import content exported from the mockup / old WordPress site.
 * Safe to re-run: boats, calendars, posts and redirects are upserted.
 *   npm run db:seed
 */
import { readFileSync, existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as s from '../src/db/schema';

const FEATURED = ['leopard-90-ft', 'splo-74-ft', 'vtech-68-ft', 'the-origin-90-ft', 'cognac-75-ft', 'siam-princess-70-ft', 'lobster-78-ft', 'leopard-40-ft', 'coco-40-ft', 'dean-44-ft', 'r5-47-ft', 'nanea-40-ft'];
const prettyMarina = (m: string) => (m || '').toLowerCase().replace(/(^|[\s(\/-])([a-zà-ÿ])/g, (_x, a, b) => a + b.toUpperCase()).replace(/\bRpm\b/, 'RPM').replace(/Puhket/, 'Phuket').replace('One°15', 'ONE°15');
const json = (f: string) => JSON.parse(readFileSync(f, 'utf8'));

/** mockup SPA links (#/blog/x, #/fleet) → real URLs */
function fixLinks(html: string, lang: 'th' | 'en') {
  const p = lang === 'en' ? '/en' : '';
  return html.replace(/href="#\/blog\/([^"]+)"/g, (_m, slug) => `href="${p}/blog/${slug}"`).replace(/href="#\/fleet[^"]*"/g, `href="${p}/yacht-charter"`).replace(/href="#\/"/g, `href="${p || '/'}"`).replace(/href="#\/boat\/([^"]+)"/g, (_m, slug) => `href="${p}/yacht-charter/${slug}"`);
}
function fixBlocks(blocks: any[], lang: 'th' | 'en'): any[] {
  return (blocks || []).map(b => {
    const o = { ...b };
    if (typeof o.html === 'string') o.html = fixLinks(o.html, lang);
    if (Array.isArray(o.items)) o.items = o.items.map((i: any) => ({ q: i.q, a: fixLinks(i.a || '', lang) }));
    return o;
  });
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: s });

  const sz = json('data/seasons.json');
  for (const c of sz.calendars) {
    const v = { id: c.id, name: c.name, kind: c.kind === 'season' ? 'season' : 'allyear', ranges: c.ranges || {}, special: c.special || [], add: c.add || 0 };
    await db.insert(s.seasonCalendars).values(v).onConflictDoUpdate({ target: s.seasonCalendars.id, set: v });
  }
  console.log(`✓ ${sz.calendars.length} season calendars`);

  const { boats } = json('data/boats.json');
  let i = 0;
  for (const b of boats) {
    const imgs = ['hero', 'a', 'b'].filter(k => existsSync(`public/boats/${b.slug}-${k}.webp`)).map(k => `/boats/${b.slug}-${k}.webp`);
    const v = {
      slug: b.slug, name: b.title, subtitle: b.subtitle || null, type: b.type, ft: b.ft ? Number(b.ft) : null, pax: b.pax ? Number(b.pax) : null, marina: prettyMarina(b.marina) || null,
      featured: FEATURED.includes(b.slug), active: true, sortOrder: i, fromPrice: b.from_ ? Number(b.from_) : null,
      calendarId: sz.boats[b.slug] || 'all',
      data: { colmap: sz.colmap[b.slug] ?? null, tables: b.tables || [], includes: b.includes || [], not_included: b.not_included || [], complimentary: b.complimentary || [], time_slots: b.time_slots || [], notes: b.notes || [], info: b.info || [] },
      images: imgs,
    };
    await db.insert(s.boats).values(v).onConflictDoUpdate({ target: s.boats.slug, set: { ...v, updatedAt: new Date() } });
    i++;
  }
  console.log(`✓ ${boats.length} boats`);

  const posts = json('data/posts.json');
  for (const p of posts) {
    const v = { id: Number(p.id), slugTh: p.slug.th || null, slugEn: p.slug.en || null, category: p.cat, date: new Date(p.date), cover: p.cover || null, title: p.title, excerpt: p.excerpt, seoTitle: p.seoT, seoDesc: p.seoD, keywords: [p.kw?.th, p.kw?.en].filter(Boolean).join(', ') || null, blocks: { th: fixBlocks(p.blocks.th, 'th'), en: fixBlocks(p.blocks.en, 'en') }, published: true };
    await db.insert(s.posts).values(v).onConflictDoUpdate({ target: s.posts.id, set: { ...v, updatedAt: new Date() } });
  }
  console.log(`✓ ${posts.length} posts`);

  const redirects = json('data/redirects.json');
  for (const r of redirects) {
    const from = decodeURIComponent(r.from).replace(/\/$/, '') || '/';
    await db.insert(s.redirects).values({ from, to: r.to, code: r.code || 301 }).onConflictDoNothing();
  }
  console.log(`✓ ${redirects.length} redirects`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
