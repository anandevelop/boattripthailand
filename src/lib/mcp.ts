import 'server-only';
import { and, desc, eq, gt, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { aiChanges, boats, posts, redirects, seasonCalendars, settings, type User } from '@/db/schema';
import { boatToClient, postToClient } from './admin-boot';
import { audit } from './audit';
import { confirmNeeded, confirmWithCode, internalBase, internalHeaders, pendingFor, requestConfirmation, type ApiUser } from './api-auth';
import { enqueue, jobOf, jobToClient, recentJobs } from './bg-jobs';
import { can, permsOf, ROLE_LABEL } from './perms';
import { clearSiteCache } from './site-render';

/**
 * MCP tools (Model Context Protocol) for AI agents — served by src/app/api/mcp/route.ts.
 * Every write goes through the same /api/admin routes as the admin UI, as the API token's user: same permission checks,
 * same audit log, and the same server-side rule that an AI never deletes without a person's confirmation (lib/api-auth.ts).
 */
type Json = Record<string, unknown>;
type Tool = { name: string; description: string; inputSchema: Json; perm?: Parameters<typeof can>[1]; run: (u: ApiUser, a: Json) => Promise<unknown> };
class ToolError extends Error {}

export const MCP_INSTRUCTIONS = `ระบบหลังบ้าน Boat Trip Thailand (เช่าเรือส่วนตัวภูเก็ต) · ตอบผู้ใช้เป็นภาษาไทย
กฎ:
1. ห้ามลบเอง: การลบทุกอย่าง (และการเปลี่ยน API key / ตั้งค่าอีเมล / กู้คืนข้อมูล) ต้องใช้ request_delete หรือ request_confirmation · ระบบส่งรหัส 6 หลักไปที่ LINE ของเจ้าของ · ให้ขอรหัสจากผู้ใช้ แล้วเรียก confirm_action · ห้ามเดารหัส
2. แทนการลบ ใช้การซ่อนได้: เรือ status "hidden", บทความ status "draft"
3. ห้ามแต่งรีวิว เรตติ้ง หรือราคา · ราคาเรือต้องมาจากโบรชัวร์/ข้อมูลที่ผู้ใช้ให้
4. ภาษาไทยใช้คำว่า "เรือยอร์ช" · บทความ/เรือมี TH และ EN เสมอ
5. ก่อนแก้หลายอย่าง ใช้ dry_run: true ดูสิ่งที่จะเปลี่ยนก่อน · ทุกการแก้ย้อนได้ด้วย undo_change
6. อัปโหลดรูป / นำเข้า PDF ทำงานเบื้องหลัง: ได้ job_id ทันที แล้วดูผลด้วย job_status`;

/* ---------- calls to the admin API, as the token's user ---------- */
async function call(u: ApiUser, method: string, path: string, body?: unknown) {
  if (!path.startsWith('/api/admin/')) throw new ToolError('path ต้องขึ้นต้นด้วย /api/admin/');
  const res = await fetch(internalBase() + path, { method, headers: { 'content-type': 'application/json', ...internalHeaders(u.id, u.tokenName || u.name) }, body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body) });
  const out = await res.json().catch(() => ({})) as Json;
  if (res.status === 409 && out.confirm_required) return { needsConfirmation: true, action: out.action, method, path, hint: 'เรียก request_confirmation ด้วย method/path/body เดิม เพื่อขอรหัสยืนยันจากเจ้าของ' };
  if (!res.ok) throw new ToolError(String(out.error || `HTTP ${res.status}`));
  return out;
}
async function snapshot(u: User, kind: string, ref: string, label: string, before: unknown) {
  const [r] = await db.insert(aiChanges).values({ userId: u.id, kind, ref, label: label.slice(0, 300), before: (before ?? null) as object }).returning({ id: aiChanges.id });
  return r.id;
}
const need = (u: User, p: Parameters<typeof can>[1]) => { if (!can(u, p)) throw new ToolError(`บัญชีนี้ไม่มีสิทธิ์ (${p})`); };
const s = (v: unknown, n = 500) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, n);
/** fields that differ, for dry runs and summaries */
function diff(a: Json, b: Json) {
  return Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null)).map(k => {
    const short = (v: unknown) => { const t = JSON.stringify(v ?? null); return t.length > 300 ? t.slice(0, 300) + '…' : t; };
    return { field: k, from: short(a[k]), to: short(b[k]) };
  });
}

/* ---------- boats ---------- */
const boatPayload = (b: ReturnType<typeof boatToClient>, colmap: unknown) => ({ ...b, name: b.title, colmap: colmap ?? null });
async function boatRow(slug: string) { const [b] = await db.select().from(boats).where(eq(boats.slug, slug)); if (!b) throw new ToolError(`ไม่พบเรือ ${slug}`); return b; }
const BOAT_FIELDS = 'title, subtitle, type (yacht|sail|power|speed|longtail), ft, pax, from_ (ราคาเริ่มต้น บาท), marina, status (live|hidden|draft), featured, cal (id ปฏิทินฤดูกาล), tables [{caption, columns[], rows[][]}], includes[], not_included[], complimentary[], notes[], info [[label, value]], time_slots [[program, time]], i18n (คำแปล/SEO ของเรือ), trip, imgs[] (url รูป ลำดับแรก = ปก)';

/* ---------- posts ---------- */
const POST_FIELDS = 'title {th,en}, slug {th,en}, excerpt {th,en}, seoT {th,en}, seoD {th,en}, kw {th,en}, cat, cover (url), status (draft|published|scheduled), date (YYYY-MM-DD), time (HH:MM, ตั้งเวลา), blocks {th:[…], en:[…]} · บล็อก: {t:"p",html} {t:"h",lv:2,html} {t:"faq",title,items:[{q,a}]} {t:"img",src,alt,cap} {t:"boat",slug} {t:"dprice",dest} {t:"fprice"} {t:"btn",label} {t:"quote",html} {t:"hr"}';

/* ---------- settings the AI may read / write ---------- */
const SETTING_KEYS: Record<string, { key?: string; get: string; put?: string; perm: Parameters<typeof can>[1]; note: string }> = {
  home: { key: 'site.home', get: '', put: '/api/admin/settings/home', perm: 'content', note: 'ข้อความหน้าแรก (PUT body {value, changes})' },
  seo: { key: 'seo.config', get: '', put: '/api/admin/settings/seo', perm: 'seo', note: 'Title/Description ทุกหน้า robots llms.txt (PUT body {value, changes})' },
  activities: { key: 'site.activities', get: '', put: '/api/admin/settings/activities', perm: 'content', note: 'กิจกรรม & ทัวร์ (PUT body {value: [...] ทั้งรายการ, changes})' },
  legal: { key: 'site.legal', get: '', perm: 'content', note: 'นโยบายความเป็นส่วนตัว / ข้อกำหนด (PUT /api/admin/settings/legal/<privacy|terms> body {value})' },
  aisearch: { get: '/api/admin/settings/aisearch', put: '/api/admin/settings/aisearch', perm: 'seo', note: 'AI Search (PUT body {value, note})' },
  keywords: { get: '/api/admin/settings/keywords', perm: 'seo', note: 'คีย์เวิร์ด SEO' },
  piers: { get: '/api/admin/settings/piers', put: '/api/admin/settings/piers', perm: 'boats', note: 'หมุดท่าเรือ (PUT body {c, pin})' },
  sitemap: { get: '/api/admin/seo/sitemap', perm: 'seo', note: 'สถิติ sitemap' },
};

export const TOOLS: Tool[] = [
  {
    name: 'whoami', description: 'บัญชีที่ AI ใช้อยู่ สิทธิ์ และกฎของระบบ', inputSchema: { type: 'object', properties: {} },
    run: async u => ({ name: u.name, role: ROLE_LABEL[u.role], token: u.tokenName, permissions: permsOf(u), rules: MCP_INSTRUCTIONS }),
  },
  /* ----- boats ----- */
  {
    name: 'list_boats', perm: 'boats', description: 'รายการเรือทั้งหมด (slug, ชื่อ, ประเภท, ความยาว, คน, ราคาเริ่มต้น, ท่าเรือ, แสดงบนเว็บไหม, จำนวนรูป)',
    inputSchema: { type: 'object', properties: { q: { type: 'string', description: 'ค้นจากชื่อหรือ slug' }, type: { type: 'string' }, include_hidden: { type: 'boolean' } } },
    run: async (_u, a) => {
      const q = s(a.q, 80);
      const rows = await db.select().from(boats).where(and(q ? or(ilike(boats.name, `%${q}%`), ilike(boats.slug, `%${q}%`)) : undefined, a.type ? eq(boats.type, s(a.type, 20)) : undefined, a.include_hidden ? undefined : eq(boats.active, true))).orderBy(boats.sortOrder);
      return { count: rows.length, boats: rows.map(b => ({ slug: b.slug, name: b.name, type: b.type, ft: b.ft, pax: b.pax, from: b.fromPrice, marina: b.marina, active: b.active, featured: b.featured, images: b.images.length, url: `/yacht-charter/${b.slug}` })) };
    },
  },
  {
    name: 'get_boat', perm: 'boats', description: 'ข้อมูลเรือครบทุกช่อง (ตารางราคา โปรแกรม รวม/ไม่รวม คำแปล รูป) ในรูปแบบเดียวกับที่ update_boat รับ',
    inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
    run: async (_u, a) => boatToClient(await boatRow(s(a.slug, 120))),
  },
  {
    name: 'update_boat', perm: 'boats', description: `แก้ข้อมูลเรือ ส่งเฉพาะช่องที่จะเปลี่ยน (ช่องอื่นคงเดิม) · ช่อง: ${BOAT_FIELDS} · ซ่อนเรือ = status "hidden" · dry_run: true = ดูสิ่งที่จะเปลี่ยนโดยไม่บันทึก · เอารูปออกจากเรือต้องขอยืนยัน`,
    inputSchema: { type: 'object', properties: { slug: { type: 'string' }, changes: { type: 'object' }, dry_run: { type: 'boolean' } }, required: ['slug', 'changes'] },
    run: async (u, a) => {
      const row = await boatRow(s(a.slug, 120)), before = boatToClient(row), ch = (a.changes ?? {}) as Json;
      if (ch.slug && ch.slug !== row.slug) throw new ToolError('เปลี่ยน slug ทำในหลังบ้านเท่านั้น (กระทบ URL)');
      const after = { ...before, ...ch, slug: row.slug } as typeof before;
      const d = diff(before as Json, after as Json);
      if (a.dry_run || !d.length) return { dry_run: !!a.dry_run, changes: d };
      const body = { boat: boatPayload(after, (row.data as { colmap?: unknown }).colmap) };
      const pre = await confirmNeeded('PUT', `/api/admin/boats/${row.slug}`, body);
      if (pre) return { needsConfirmation: true, action: pre, method: 'PUT', path: `/api/admin/boats/${row.slug}`, body, hint: 'เรียก request_confirmation ด้วย method/path/body นี้' };
      const change = await snapshot(u, 'boat', row.slug, `แก้เรือ ${row.name}: ${d.map(x => x.field).join(', ')}`, boatPayload(before, (row.data as { colmap?: unknown }).colmap));
      const r = await call(u, 'PUT', `/api/admin/boats/${row.slug}`, body);
      return { saved: true, change_id: change, changes: d, result: (r as Json).boat ? 'ok' : r };
    },
  },
  {
    name: 'create_boat', perm: 'boats', description: `สร้างเรือใหม่เป็นฉบับร่าง (ยังไม่แสดงบนเว็บ จนกว่าจะ update_boat status "live") · slug a-z 0-9 - · ช่อง: ${BOAT_FIELDS}`,
    inputSchema: { type: 'object', properties: { slug: { type: 'string' }, boat: { type: 'object' } }, required: ['slug', 'boat'] },
    run: async (u, a) => {
      const slug = s(a.slug, 120).toLowerCase();
      if ((await db.select({ s: boats.slug }).from(boats).where(eq(boats.slug, slug))).length) throw new ToolError('มีเรือ slug นี้แล้ว · ใช้ update_boat');
      const b = (a.boat ?? {}) as Json;
      return call(u, 'PUT', `/api/admin/boats/${slug}`, { boat: { ...b, slug, name: b.title ?? b.name, status: 'draft', active: false } });
    },
  },
  {
    name: 'list_seasons', perm: 'boats', description: 'ปฏิทินฤดูกาลราคา (id, ช่วงวันที่, ราคาเพิ่ม) · แก้ด้วย admin_request PUT /api/admin/seasons/<id> body {cal}',
    inputSchema: { type: 'object', properties: {} }, run: async () => ({ calendars: await db.select().from(seasonCalendars) }),
  },
  /* ----- articles ----- */
  {
    name: 'list_posts', perm: 'content', description: 'รายการบทความ (id, ชื่อ TH/EN, slug, สถานะ, วันที่)',
    inputSchema: { type: 'object', properties: { q: { type: 'string' }, limit: { type: 'number' } } },
    run: async (_u, a) => {
      const q = s(a.q, 80);
      const rows = await db.select({ id: posts.id, title: posts.title, slugTh: posts.slugTh, slugEn: posts.slugEn, published: posts.published, publishAt: posts.publishAt, date: posts.date, category: posts.category }).from(posts)
        .where(and(sql`trash is null`, q ? sql`(${posts.title}::text ilike ${'%' + q + '%'} or ${posts.slugTh} ilike ${'%' + q + '%'} or ${posts.slugEn} ilike ${'%' + q + '%'})` : undefined)).orderBy(desc(posts.date)).limit(Math.min(Number(a.limit) || 200, 500));
      return { count: rows.length, posts: rows.map(p => ({ id: p.id, title: p.title, slug: { th: p.slugTh, en: p.slugEn }, status: p.published ? 'published' : p.publishAt ? 'scheduled' : 'draft', date: p.date.toISOString().slice(0, 10), cat: p.category })) };
    },
  },
  {
    name: 'get_post', perm: 'content', description: 'บทความเต็ม (ทุกช่อง + blocks TH/EN) ในรูปแบบเดียวกับที่ save_post รับ',
    inputSchema: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
    run: async (_u, a) => { const [p] = await db.select().from(posts).where(eq(posts.id, Number(a.id))); if (!p) throw new ToolError('ไม่พบบทความ'); return postToClient(p); },
  },
  {
    name: 'save_post', perm: 'content', description: `สร้างบทความใหม่ (ไม่ใส่ id → เป็นฉบับร่าง) หรือแก้บทความเดิม (ส่งเฉพาะช่องที่เปลี่ยน) · ช่อง: ${POST_FIELDS} · ซ่อน = status "draft" · dry_run ได้`,
    inputSchema: { type: 'object', properties: { id: { type: 'number' }, changes: { type: 'object' }, dry_run: { type: 'boolean' } }, required: ['changes'] },
    run: async (u, a) => {
      const ch = (a.changes ?? {}) as Json;
      if (a.id) {
        const [p] = await db.select().from(posts).where(eq(posts.id, Number(a.id))); if (!p) throw new ToolError('ไม่พบบทความ');
        const before = postToClient(p), after = { ...before, ...ch, id: p.id };
        const d = diff(before as Json, after as Json);
        if (a.dry_run || !d.length) return { dry_run: !!a.dry_run, changes: d };
        const change = await snapshot(u, 'post', String(p.id), `แก้บทความ ${p.title.th || p.title.en}: ${d.map(x => x.field).join(', ')}`, before);
        const r = await call(u, 'PUT', `/api/admin/posts/${p.id}`, { post: after, explicit: true });
        return { saved: true, id: p.id, change_id: change, changes: d, result: (r as Json).post ? 'ok' : r };
      }
      const [{ m }] = await db.select({ m: sql<number>`coalesce(max(id),0)::int` }).from(posts);
      const id = m + 1, post = { status: 'draft', cat: 'guide', title: { th: '', en: '' }, slug: { th: '', en: '' }, excerpt: { th: '', en: '' }, seoT: { th: '', en: '' }, seoD: { th: '', en: '' }, kw: { th: '', en: '' }, blocks: { th: [], en: [] }, ...ch, id };
      if (a.dry_run) return { dry_run: true, new_id: id, post };
      const r = await call(u, 'PUT', `/api/admin/posts/${id}`, { post, explicit: true });
      return { created: true, id, status: post.status, result: (r as Json).post ? 'ok' : r };
    },
  },
  /* ----- site content & SEO ----- */
  {
    name: 'get_setting', description: `อ่านการตั้งค่าเว็บ: ${Object.entries(SETTING_KEYS).map(([k, v]) => `${k} = ${v.note}`).join(' · ')}`,
    inputSchema: { type: 'object', properties: { key: { type: 'string', enum: Object.keys(SETTING_KEYS) } }, required: ['key'] },
    run: async (u, a) => {
      const k = SETTING_KEYS[s(a.key, 30)]; if (!k) throw new ToolError('ไม่รู้จัก key นี้');
      need(u, k.perm);
      if (k.get) return call(u, 'GET', k.get);
      const [r] = await db.select().from(settings).where(eq(settings.key, k.key!));
      return { key: a.key, value: r?.value ?? null, note: r ? undefined : 'ยังใช้ค่าเริ่มต้นในโค้ด (ยังไม่เคยบันทึกจากหลังบ้าน)' };
    },
  },
  {
    name: 'list_redirects', perm: 'seo', description: 'redirect ทั้งหมด (from → to, code, จำนวนครั้งที่ถูกใช้) · เพิ่ม/แก้ด้วย admin_request POST /api/admin/redirects/save body {from, to, code}',
    inputSchema: { type: 'object', properties: { q: { type: 'string' } } },
    run: async (_u, a) => { const q = s(a.q, 120); return { redirects: await db.select().from(redirects).where(q ? or(ilike(redirects.from, `%${q}%`), ilike(redirects.to, `%${q}%`)) : undefined).limit(1000) }; },
  },
  {
    name: 'analytics', perm: 'seo', description: 'สถิติเว็บ (ตัวเลขรวม ไม่มีข้อมูลลูกค้า): overview = ยอดเข้าชม/หน้า, sources = แหล่งที่มา & คลิกปุ่มติดต่อ, google = Search Console + GA4',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['overview', 'sources', 'google'] }, days: { type: 'number', enum: [1, 7, 28, 90] } }, required: ['kind'] },
    run: async (u, a) => { const d = [1, 7, 28, 90].includes(Number(a.days)) ? Number(a.days) : 28; return call(u, 'GET', `/api/admin/analytics${a.kind === 'sources' ? '/sources' : a.kind === 'google' ? '/google' : ''}?days=${d}`); },
  },
  {
    name: 'admin_request', description: `เรียก API หลังบ้านโดยตรง (สิทธิ์ตามบัญชีนี้) สำหรับสิ่งที่ไม่มีเครื่องมือเฉพาะ เช่น
PUT /api/admin/settings/home {value, changes} · PUT /api/admin/settings/seo {value, changes} · PUT /api/admin/settings/activities {value, changes} · PUT /api/admin/settings/legal/<privacy|terms> {value} · PUT /api/admin/settings/aisearch {value, note} · PUT /api/admin/settings/piers {c, pin} · PUT /api/admin/seasons/<id> {cal} · POST /api/admin/redirects/save {from, to, code} · POST /api/admin/seo/submit · GET /api/admin/analytics/pagespeed?strategy=mobile · POST /api/admin/system/run {id} · GET /api/admin/system
ไม่มี DELETE: การลบใช้ request_delete / request_confirmation · การแก้ settings จะเก็บสถานะเดิมไว้ให้ undo_change`,
    inputSchema: { type: 'object', properties: { method: { type: 'string', enum: ['GET', 'POST', 'PUT'] }, path: { type: 'string' }, body: { type: 'object' } }, required: ['method', 'path'] },
    run: async (u, a) => {
      const method = s(a.method, 6).toUpperCase(), path = s(a.path, 1000);
      if (!['GET', 'POST', 'PUT'].includes(method)) throw new ToolError('ใช้ได้เฉพาะ GET / POST / PUT · ลบใช้ request_delete');
      // settings: keep the state before, for undo_change
      let change: string | null = null;
      const m = method === 'PUT' && path.match(/^\/api\/admin\/settings\/(home|seo|activities|legal|piers)(\/|$)/);
      if (m && !(await confirmNeeded(method, path, (a.body ?? null) as Json))) {
        const key = { home: 'site.home', seo: 'seo.config', activities: 'site.activities', legal: 'site.legal', piers: 'site.piers' }[m[1]]!;
        const [r] = await db.select().from(settings).where(eq(settings.key, key));
        change = await snapshot(u, 'setting', key, `แก้ ${m[1]} ผ่าน API`, r ? r.value : null);
      }
      const out = await call(u, method, path, a.body);
      return change ? { change_id: change, result: out } : out;
    },
  },
  /* ----- background uploads ----- */
  {
    name: 'upload_image', description: 'อัปโหลดรูปแบบเบื้องหลัง (ได้ job_id ทันที): จากลิงก์ https หรือ base64 · ระบบย่อ แปลง WebP/AVIF เขียน alt ด้วย AI เข้าคลังสื่อ และ (ถ้าระบุ) ใส่ในแกลเลอรีเรือ หรือเป็นรูปปกบทความ · ดูผลด้วย job_status',
    inputSchema: { type: 'object', properties: { url: { type: 'string' }, data: { type: 'string', description: 'base64 หรือ data URL (≤ 20 MB)' }, name: { type: 'string' }, boat: { type: 'string', description: 'slug เรือที่จะใส่รูป' }, as_cover: { type: 'boolean', description: 'ใส่เป็นรูปแรก (ปก) ของเรือ' }, cover: { type: 'number', description: 'id บทความที่จะตั้งเป็นรูปปก' }, dir: { type: 'string', enum: ['boat', 'act', 'blog', 'brand', 'new'] }, alt: { type: 'object', description: '{th, en} ถ้าไม่ใส่ AI เขียนให้' } } },
    run: async (u, a) => {
      if (!a.url && !a.data) throw new ToolError('ใส่ url หรือ data');
      if (a.boat) { need(u, 'boats'); await boatRow(s(a.boat, 120)); }
      if (a.cover) need(u, 'content');
      const j = await enqueue('image', { url: s(a.url, 2000) || undefined, data: typeof a.data === 'string' ? a.data : undefined, name: s(a.name, 120), boat: a.boat ? s(a.boat, 120) : undefined, asCover: !!a.as_cover, cover: a.cover ? Number(a.cover) : undefined, dir: s(a.dir, 10), alt: a.alt }, u.id);
      return { job_id: j.id, status: j.status, note: 'กำลังทำงานเบื้องหลัง · เรียก job_status เพื่อดูผล' };
    },
  },
  {
    name: 'import_brochure', perm: 'boats', description: 'ให้ AI อ่านโบรชัวร์เรือ PDF แบบเบื้องหลัง (ลิงก์ https หรือ base64 ≤ 14 MB) · ผลลัพธ์ใน job_status คือข้อมูลเรือที่อ่านได้ (ยังไม่บันทึก) · ตรวจแล้วค่อย create_boat / update_boat',
    inputSchema: { type: 'object', properties: { url: { type: 'string' }, data: { type: 'string' }, name: { type: 'string' } } },
    run: async (u, a) => { if (!a.url && !a.data) throw new ToolError('ใส่ url หรือ data'); const j = await enqueue('brochure', { url: s(a.url, 2000) || undefined, data: typeof a.data === 'string' ? a.data : undefined, name: s(a.name, 120) }, u.id); return { job_id: j.id, status: j.status }; },
  },
  {
    name: 'job_status', description: 'สถานะงานเบื้องหลัง (ไม่ใส่ id = งานล่าสุดของบัญชีนี้)', inputSchema: { type: 'object', properties: { id: { type: 'string' } } },
    run: async (u, a) => { if (a.id) { const j = await jobOf(s(a.id, 60), u.id); if (!j) throw new ToolError('ไม่พบงาน'); return jobToClient(j); } return { jobs: (await recentJobs(u.id)).reverse().slice(0, 20).map(jobToClient) }; },
  },
  /* ----- confirmations (deletes, risky changes) ----- */
  {
    name: 'request_delete', description: 'ขอลบ (ต้องให้เจ้าของยืนยัน): ระบบส่งรหัส 6 หลักไปที่ LINE เจ้าของ · ให้ขอรหัสจากผู้ใช้แล้วเรียก confirm_action · kind: boat (slug) · post (id, ไปถังขยะ) · media (url รูป) · redirect (from) · season (id)',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['boat', 'post', 'media', 'redirect', 'season'] }, id: { type: 'string' }, reason: { type: 'string' } }, required: ['kind', 'id', 'reason'] },
    run: async (u, a) => {
      const id = s(a.id, 2000), kind = s(a.kind, 20);
      const m: Record<string, [string, string, unknown?]> = {
        boat: ['DELETE', `/api/admin/boats/${encodeURIComponent(id)}`], post: ['DELETE', `/api/admin/posts/${Number(id)}`, { mode: 'blog' }],
        media: ['DELETE', `/api/admin/media?url=${encodeURIComponent(id)}`], redirect: ['POST', '/api/admin/redirects/delete', { from: id }], season: ['DELETE', `/api/admin/seasons/${encodeURIComponent(id)}`],
      };
      const x = m[kind]; if (!x) throw new ToolError('kind ไม่ถูกต้อง');
      return confirmReply(await requestConfirmation(u, x[0], x[1], x[2] ?? null, s(a.reason, 500)));
    },
  },
  {
    name: 'request_confirmation', description: 'ขอยืนยันคำสั่งเสี่ยงที่ระบบตอบ needsConfirmation (ใส่ method/path/body เดิม) · รหัสไปที่ LINE เจ้าของ แล้วใช้ confirm_action',
    inputSchema: { type: 'object', properties: { method: { type: 'string' }, path: { type: 'string' }, body: { type: 'object' }, reason: { type: 'string' } }, required: ['method', 'path', 'reason'] },
    run: async (u, a) => { const path = s(a.path, 1000); if (!path.startsWith('/api/admin/')) throw new ToolError('path ไม่ถูกต้อง'); return confirmReply(await requestConfirmation(u, s(a.method, 6).toUpperCase(), path, a.body ?? null, s(a.reason, 500))); },
  },
  {
    name: 'confirm_action', description: 'ยืนยันคำขอด้วยรหัส 6 หลักที่ "ผู้ใช้" อ่านจาก LINE แล้วบอกมา · ห้ามเดา (ผิด 3 ครั้งคำขอถูกยกเลิก)',
    inputSchema: { type: 'object', properties: { request_id: { type: 'string' }, code: { type: 'string' } }, required: ['request_id', 'code'] },
    run: async (u, a) => confirmWithCode(u, s(a.request_id, 60), s(a.code, 10)),
  },
  {
    name: 'list_requests', description: 'คำขอยืนยันของบัญชีนี้ใน 7 วันล่าสุด และผล', inputSchema: { type: 'object', properties: {} },
    run: async u => ({ requests: await pendingFor(u.id) }),
  },
  /* ----- undo ----- */
  {
    name: 'list_changes', description: 'สิ่งที่ AI แก้ใน 30 วันล่าสุด (ย้อนได้ด้วย undo_change)', inputSchema: { type: 'object', properties: {} },
    run: async u => ({ changes: (await db.select({ id: aiChanges.id, kind: aiChanges.kind, ref: aiChanges.ref, label: aiChanges.label, at: aiChanges.createdAt, undone: aiChanges.undoneAt }).from(aiChanges).where(and(eq(aiChanges.userId, u.id), gt(aiChanges.createdAt, new Date(Date.now() - 30 * 86_400_000)))).orderBy(desc(aiChanges.createdAt)).limit(50)) }),
  },
  {
    name: 'undo_change', description: 'ย้อนการแก้ไขครั้งหนึ่งกลับเป็นสถานะก่อนแก้ (เรือ บทความ การตั้งค่า)', inputSchema: { type: 'object', properties: { change_id: { type: 'string' } }, required: ['change_id'] },
    run: async (u, a) => {
      const [c] = await db.select().from(aiChanges).where(and(eq(aiChanges.id, s(a.change_id, 60)), eq(aiChanges.userId, u.id), isNull(aiChanges.undoneAt)));
      if (!c) throw new ToolError('ไม่พบการแก้ไขนี้ หรือย้อนไปแล้ว');
      if (c.kind === 'boat') { need(u, 'boats'); await call(u, 'PUT', `/api/admin/boats/${c.ref}`, { boat: c.before }); }
      else if (c.kind === 'post') { need(u, 'content'); await call(u, 'PUT', `/api/admin/posts/${c.ref}`, { post: c.before, explicit: true }); }
      else if (c.kind === 'setting') {
        need(u, c.ref.startsWith('seo') ? 'seo' : c.ref === 'site.piers' ? 'boats' : 'content');
        if (c.before == null) await db.delete(settings).where(eq(settings.key, c.ref));
        else await db.insert(settings).values({ key: c.ref, value: c.before }).onConflictDoUpdate({ target: settings.key, set: { value: c.before } });
        clearSiteCache();
        await audit({ id: u.id, role: u.role }, { action: 'update', entity: 'settings', ref: c.ref, label: `ย้อนการแก้ไขของ AI · ${c.label}` });
      } else throw new ToolError('ย้อนไม่ได้');
      await db.update(aiChanges).set({ undoneAt: new Date() }).where(eq(aiChanges.id, c.id));
      return { undone: true, label: c.label };
    },
  },
  {
    name: 'system_status', perm: 'settings', description: 'สถานะเซิร์ฟเวอร์ งานอัตโนมัติ และการสำรองข้อมูล', inputSchema: { type: 'object', properties: {} },
    run: async u => call(u, 'GET', '/api/admin/system'),
  },
];

function confirmReply(r: Awaited<ReturnType<typeof requestConfirmation>>) {
  if (!r.needed) return { needsConfirmation: false, note: 'คำสั่งนี้ไม่ต้องยืนยัน ทำได้เลยด้วยเครื่องมือปกติ' };
  return { request_id: r.id, action: r.label, expiresAt: r.expiresAt,
    next: r.sentToLine ? 'ส่งรหัส 6 หลักไปที่ LINE ของเจ้าของแล้ว · ขอรหัสจากผู้ใช้ แล้วเรียก confirm_action (หรือเจ้าของกดอนุมัติใน /admin → ทีมงาน & สิทธิ์ → คำขอจาก AI)'
      : 'ส่ง LINE ไม่ได้ (ยังไม่ได้เชื่อม LINE ของ Super Admin) · ให้เจ้าของกดอนุมัติใน /admin → ทีมงาน & สิทธิ์ → คำขอจาก AI' };
}

/** tools this user can use (a tool with a permission is hidden from accounts without it) */
export const toolsFor = (u: User) => TOOLS.filter(t => !t.perm || can(u, t.perm));
export async function runTool(u: ApiUser, name: string, args: Json) {
  const t = toolsFor(u).find(x => x.name === name);
  if (!t) return { isError: true, text: `ไม่มีเครื่องมือ ${name} สำหรับบัญชีนี้` };
  try { return { isError: false, data: await t.run(u, args ?? {}) }; }
  catch (e) { if (!(e instanceof ToolError)) console.error('[mcp]', name, e); return { isError: true, text: e instanceof Error ? e.message : String(e) }; }
}
