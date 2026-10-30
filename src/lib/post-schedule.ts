import 'server-only';
import { and, eq, inArray, isNotNull, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { posts, redirects } from '@/db/schema';
import { audit } from './audit';
import { ensureTrash } from './post-trash';
import { clearSiteCache } from './site-render';

/**
 * ตั้งเวลาเผยแพร่บทความ: runs every minute (src/lib/system.ts → JOBS 'publish').
 * Articles whose publish_at has come are made live: published = true, date = publish_at, publish_at cleared.
 * Articles in the trash are skipped (restoring one keeps its schedule).
 */
export async function publishDue() {
  await ensureTrash();
  const due = await db.select({ id: posts.id, title: posts.title, slugTh: posts.slugTh, slugEn: posts.slugEn, at: posts.publishAt }).from(posts)
    .where(and(eq(posts.published, false), isNotNull(posts.publishAt), lte(posts.publishAt, new Date()), sql`trash is null`));
  let n = 0;
  for (const p of due) {
    const [row] = await db.update(posts).set({ published: true, date: p.at!, publishAt: null, updatedAt: new Date() })
      .where(and(eq(posts.id, p.id), eq(posts.published, false), isNotNull(posts.publishAt))).returning({ id: posts.id });
    if (!row) continue;   // changed meanwhile (e.g. someone unscheduled it)
    n++;
    // a live article owns its URLs (same as publishing by hand)
    const own = [p.slugTh && `/blog/${p.slugTh}`, p.slugEn && `/en/blog/${p.slugEn}`].filter((x): x is string => !!x);
    if (own.length) await db.delete(redirects).where(inArray(redirects.from, own));
    await audit(null, { action: 'publish', entity: 'article', ref: String(p.id), label: p.title.th || p.title.en || `#${p.id}`,
      changes: [{ f: 'สถานะ', from: 'ตั้งเวลา', to: 'เผยแพร่ (ถึงเวลาที่ตั้งไว้)' }], ip: null, userAgent: null });
  }
  if (n) clearSiteCache();
  return n ? `เผยแพร่ ${n} บทความตามเวลาที่ตั้งไว้` : 'ไม่มีบทความถึงเวลา';
}
