/**
 * One-off fix (2026-10-24): post #1015 mixed two different articles from the WordPress import
 *   - its TH side = "อ่าวมาหยา…"            → belongs to #1016 (EN "Maya Bay…", TH was empty)
 *   - its EN side = "Catamaran vs Speedboat" → belongs to #1073 (TH "เช่าเรือคาตามารัน vs สปีดโบ๊ท", EN was empty)
 * This moves each side to its correct post and unpublishes the leftover #1015.
 * URLs do not change (the slugs move with the content). Uses the current DB values, so admin edits are kept.
 * Safe to re-run: it stops if the data no longer looks like the problem.
 *   node --env-file=.env --import tsx scripts/fix-post-pairs.ts
 */
import { createHash } from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as s from '../src/db/schema';
import { stableStringify } from '../src/lib/crypto';

const sha256 = (x: string) => createHash('sha256').update(x).digest('hex');
const kw = (k: string | null) => { const [th = '', en = ''] = (k ?? '').split(', '); return { th, en }; };

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: s });
  await db.transaction(async t => {
    const get = async (id: number) => (await t.select().from(s.posts).where(eq(s.posts.id, id)))[0];
    const [mixed, cat, maya] = [await get(1015), await get(1073), await get(1016)];
    if (!mixed || !cat || !maya) throw new Error('ไม่พบบทความ 1015 / 1073 / 1016');
    if (!mixed.title.th.includes('มาหยา') || !/catamaran/i.test(mixed.title.en) || cat.title.en || maya.title.th) {
      console.log('ข้อมูลไม่ตรงกับปัญหาเดิม (อาจแก้ไปแล้ว) — ไม่ได้เปลี่ยนอะไร'); return;
    }
    // free the slugs first (unique), then move each side
    await t.update(s.posts).set({ slugTh: null, slugEn: null, published: false, updatedAt: new Date() }).where(eq(s.posts.id, 1015));
    const k1 = kw(mixed.keywords), kc = kw(cat.keywords), km = kw(maya.keywords);
    await t.update(s.posts).set({
      slugEn: mixed.slugEn, title: { ...cat.title, en: mixed.title.en }, excerpt: { ...cat.excerpt, en: mixed.excerpt.en },
      seoTitle: { ...cat.seoTitle, en: mixed.seoTitle.en }, seoDesc: { ...cat.seoDesc, en: mixed.seoDesc.en },
      keywords: [kc.th, k1.en].join(', '), blocks: { th: cat.blocks.th, en: mixed.blocks.en }, updatedAt: new Date(),
    }).where(eq(s.posts.id, 1073));
    await t.update(s.posts).set({
      slugTh: mixed.slugTh, title: { ...maya.title, th: mixed.title.th }, excerpt: { ...maya.excerpt, th: mixed.excerpt.th },
      seoTitle: { ...maya.seoTitle, th: mixed.seoTitle.th }, seoDesc: { ...maya.seoDesc, th: mixed.seoDesc.th },
      keywords: [k1.th, km.en].join(', '), blocks: { th: mixed.blocks.th, en: maya.blocks.en }, updatedAt: new Date(),
    }).where(eq(s.posts.id, 1016));
    // audit (CLI actor), same hash chain as src/lib/audit.ts
    await t.execute(sql`select pg_advisory_xact_lock(424242)`);
    const [last] = await t.select({ hash: s.auditLogs.hash }).from(s.auditLogs).orderBy(desc(s.auditLogs.id)).limit(1);
    const row = { ts: new Date(), userId: null, role: 'cli', action: 'update', entity: 'article', ref: '1015', label: 'จับคู่ภาษาบทความใหม่ จาก command line',
      changes: [
        { f: 'EN "Catamaran vs Speedboat"', from: '#1015', to: '#1073' },
        { f: 'TH "อ่าวมาหยา"', from: '#1015', to: '#1016' },
        { f: 'สถานะ #1015', from: 'เผยแพร่', to: 'ร่าง (ว่าง)' },
      ], note: null, prevHash: last?.hash ?? '0'.repeat(64) };
    await t.insert(s.auditLogs).values({ ...row, hash: sha256(stableStringify([row.ts.toISOString(), row.userId, row.role, row.action, row.entity, row.ref, row.label, row.changes, row.note, row.prevHash])) });
    console.log('✓ #1073 มีภาษาอังกฤษแล้ว · #1016 มีภาษาไทยแล้ว · #1015 ถูกซ่อน (หน้าเว็บอัปเดตภายใน 5 นาที)');
  });
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
