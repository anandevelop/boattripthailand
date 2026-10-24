/**
 * One-off (2026-10-24): clean English blog content left over from the WordPress import
 * (an AI-translation note on the EN page of #1018, Thai sentences inside EN text, Thai/empty EN SEO fields).
 * Fixes are listed in data/fixes/2026-10-24-en-content.json (already applied to data/posts.json).
 * Applies them to the live database:
 *   - body: only where the broken text is still there (admin edits are kept)
 *   - SEO title/description/excerpt/keyword (EN): only where the EN value is empty or still contains Thai
 * Safe to re-run.   node --env-file=.env --import tsx scripts/fix-en-content.ts
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as s from '../src/db/schema';
import { stableStringify } from '../src/lib/crypto';

type Fix = { body: [number, string, string | null][]; seo: Record<string, Partial<Record<'seoT' | 'seoD' | 'excerpt' | 'kw', string>>> };
const fix: Fix = JSON.parse(readFileSync('data/fixes/2026-10-24-en-content.json', 'utf8'));
const TH = /[฀-๿]/, broken = (v?: string | null) => !v?.trim() || TH.test(v);
const sha256 = (x: string) => createHash('sha256').update(x).digest('hex');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: s });
  const ids = [...new Set([...fix.body.map(b => b[0]), ...Object.keys(fix.seo).map(Number)])];
  let nBody = 0, nSeo = 0; const touched: number[] = [];
  await db.transaction(async t => {
    for (const id of ids) {
      const [p] = await t.select().from(s.posts).where(eq(s.posts.id, id));
      if (!p) { console.log(`#${id} ไม่พบในฐานข้อมูล — ข้าม`); continue; }
      const en = [...(p.blocks.en ?? [])] as { html?: string }[];
      let changed = false;
      for (const [bid, old, nw] of fix.body) {
        if (bid !== id) continue;
        const k = en.findIndex(b => typeof b.html === 'string' && b.html.includes(old));
        if (k < 0) continue;
        if (nw === null) en.splice(k, 1); else en[k] = { ...en[k], html: en[k].html!.replace(old, nw) };
        nBody++; changed = true;
      }
      const f = fix.seo[String(id)] ?? {};
      const title = { ...p.seoTitle }, desc_ = { ...p.seoDesc }, exc = { ...p.excerpt };
      const [kwTh = '', kwEn = ''] = (p.keywords ?? '').split(', ');
      let kw = kwEn;
      if (f.seoT && broken(title.en)) { title.en = f.seoT; nSeo++; changed = true; }
      if (f.seoD && broken(desc_.en)) { desc_.en = f.seoD; nSeo++; changed = true; }
      if (f.excerpt && broken(exc.en)) { exc.en = f.excerpt; nSeo++; changed = true; }
      if (f.kw && broken(kwEn)) { kw = f.kw; nSeo++; changed = true; }
      if (!changed) continue;
      await t.update(s.posts).set({ blocks: { th: p.blocks.th, en: en as typeof p.blocks.en }, seoTitle: title, seoDesc: desc_, excerpt: exc, keywords: [kwTh, kw].join(', '), updatedAt: new Date() }).where(eq(s.posts.id, id));
      touched.push(id);
    }
    if (!touched.length) { console.log('ไม่มีอะไรต้องแก้ (อาจแก้ไปแล้ว)'); return; }
    await t.execute(sql`select pg_advisory_xact_lock(424242)`);
    const [last] = await t.select({ hash: s.auditLogs.hash }).from(s.auditLogs).orderBy(desc(s.auditLogs.id)).limit(1);
    const row = { ts: new Date(), userId: null, role: 'cli', action: 'update', entity: 'article', ref: touched.join(','), label: `แก้เนื้อหาภาษาอังกฤษที่ติดมาจาก WordPress ${touched.length} บทความ จาก command line`,
      changes: [{ f: 'เนื้อหา EN', from: 'มีข้อความไทย/ข้อความหลุด', to: `แก้ ${nBody} จุด` }, { f: 'SEO EN', from: 'ว่าง/เป็นภาษาไทย', to: `แก้ ${nSeo} ช่อง` }], note: null, prevHash: last?.hash ?? '0'.repeat(64) };
    await t.insert(s.auditLogs).values({ ...row, hash: sha256(stableStringify([row.ts.toISOString(), row.userId, row.role, row.action, row.entity, row.ref, row.label, row.changes, row.note, row.prevHash])) });
    console.log(`✓ แก้ ${touched.length} บทความ · เนื้อหา ${nBody} จุด · SEO ${nSeo} ช่อง (หน้าเว็บอัปเดตภายใน 5 นาที)`);
  });
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
