import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { posts, redirects, type Post } from '@/db/schema';
import { audit } from './audit';

/**
 * Trash for articles (/admin → บทความ → ถังขยะ).
 * Deleting an article moves it here first: the row stays, it is unpublished and hidden from the admin list,
 * and its URLs redirect like a real delete (301 to the blog list, or 410). It can be restored with
 * everything put back (published state and the redirects it changed), or deleted for good.
 * After TRASH_DAYS it is deleted for good automatically.
 *
 * The state is one jsonb column, posts.trash (null = not in the trash), added on first use (no migration).
 */
export const TRASH_DAYS = 30;
export type TrashInfo = {
  at: string; by: string | null; name: string; published: boolean; mode: 'blog' | 'gone';
  /** redirects this delete created (`created`) or changed (previous `to`/`code`), to undo on restore */
  redir: { from: string; created?: boolean; to?: string; code?: number }[];
};

let ready: Promise<unknown> | null = null;
export const ensureTrash = () => ready ??= db.execute(sql`alter table posts add column if not exists trash jsonb`).catch(e => { ready = null; throw e; });

/** ids of articles in the trash */
export async function trashedIds(): Promise<Set<number>> {
  await ensureTrash();
  const r = await db.execute(sql`select id from posts where trash is not null`);
  return new Set((r.rows as { id: number }[]).map(x => Number(x.id)));
}
export async function trashOf(id: number): Promise<TrashInfo | null> {
  await ensureTrash();
  const r = await db.execute(sql`select trash from posts where id = ${id}`);
  return ((r.rows[0] as { trash?: TrashInfo } | undefined)?.trash) ?? null;
}

/** Move an article to the trash. Its URLs go to the blog list (301) or answer 410, as a delete would. */
export async function trashPost(cur: Post, mode: 'blog' | 'gone', by: { id: string; name: string }) {
  await ensureTrash();
  const gone = mode === 'gone', code = gone ? 410 : 301;
  const urls = [cur.slugTh && `/blog/${cur.slugTh}`, cur.slugEn && `/en/blog/${cur.slugEn}`].filter((x): x is string => !!x);
  const target = (p: string) => gone ? '' : p.startsWith('/en/') ? '/en/blog' : '/blog';
  const made: { from: string; to: string; code: number }[] = [], undo: TrashInfo['redir'] = [];
  await db.transaction(async tx => {
    for (const p of urls) {
      // old WordPress URLs (and earlier redirects) that pointed at this article
      const old = await tx.select().from(redirects).where(eq(redirects.to, p));
      if (old.length) await tx.update(redirects).set({ to: target(p), code }).where(eq(redirects.to, p));
      for (const r of old) { undo.push({ from: r.from, to: r.to, code: r.code }); made.push({ from: r.from, to: target(p), code }); }
      if (cur.published) {
        const [had] = await tx.select().from(redirects).where(eq(redirects.from, p));
        undo.push(had ? { from: p, to: had.to, code: had.code } : { from: p, created: true });
        await tx.insert(redirects).values({ from: p, to: target(p), code }).onConflictDoUpdate({ target: redirects.from, set: { to: target(p), code } });
        made.push({ from: p, to: target(p), code });
      }
    }
    const info: TrashInfo = { at: new Date().toISOString(), by: by.id, name: by.name, published: cur.published, mode, redir: undo };
    await tx.execute(sql`update posts set published = false, trash = ${JSON.stringify(info)}::jsonb, updated_at = now() where id = ${cur.id}`);
  });
  return made;
}

/** Take an article out of the trash: published state and the redirects it changed are put back */
export async function restorePost(id: number) {
  const info = await trashOf(id);
  if (!info) return null;
  await db.transaction(async tx => {
    for (const r of info.redir) {
      if (r.created) await tx.delete(redirects).where(eq(redirects.from, r.from));
      else await tx.update(redirects).set({ to: r.to ?? '', code: r.code ?? 301 }).where(eq(redirects.from, r.from));
    }
    await tx.execute(sql`update posts set published = ${info.published}, trash = null, updated_at = now() where id = ${id}`);
  });
  const [row] = await db.select().from(posts).where(eq(posts.id, id));
  return { row, info };
}

/** Delete an article in the trash for good (its redirects stay as they are) */
export async function purgePost(id: number) {
  const info = await trashOf(id);
  if (!info) return null;
  const [row] = await db.select().from(posts).where(eq(posts.id, id));
  await db.delete(posts).where(and(eq(posts.id, id), sql`trash is not null`));
  return { row, info };
}

/** Articles in the trash, newest first; those older than TRASH_DAYS are deleted for good first */
export async function listTrash() {
  await ensureTrash();
  const old = await db.execute(sql`select id, title, trash from posts where trash is not null and (trash->>'at')::timestamptz < now() - make_interval(days => ${TRASH_DAYS})`);
  for (const r of old.rows as { id: number; title: { th?: string; en?: string } }[]) {
    await db.delete(posts).where(eq(posts.id, Number(r.id)));
    await audit(null, { action: 'delete', entity: 'article', ref: String(r.id), label: r.title?.th || r.title?.en || `บทความ ${r.id}`, changes: [{ f: 'บทความ', from: `อยู่ในถังขยะเกิน ${TRASH_DAYS} วัน`, to: null }], note: 'ลบถาวรอัตโนมัติ' });
  }
  const r = await db.execute(sql`select id, trash from posts where trash is not null`);
  const meta = new Map((r.rows as { id: number; trash: TrashInfo }[]).map(x => [Number(x.id), x.trash]));
  if (!meta.size) return [];
  const rows = await db.select().from(posts).where(inArray(posts.id, [...meta.keys()]));
  return rows.map(p => ({ p, info: meta.get(p.id)! })).sort((a, b) => b.info.at.localeCompare(a.info.at));
}
