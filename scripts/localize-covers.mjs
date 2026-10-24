// ดาวน์โหลดรูปบทความจาก WordPress เดิม มาเก็บที่ public/img/blog/ แล้วเปลี่ยนลิงก์ให้ชี้ไฟล์ในเครื่อง
// ใช้:  node scripts/localize-covers.mjs            (ดาวน์โหลด + แก้ data/posts.json)
//       node scripts/localize-covers.mjs --db       (+ แก้ลิงก์ในฐานข้อมูลด้วย โดยไม่ทับบทความที่แก้ในหลังบ้าน)
//       node scripts/localize-covers.mjs --dry-run  (ดูอย่างเดียว ไม่เขียนอะไร)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const POSTS = path.join(ROOT, 'data/posts.json');
const OUT_DIR = path.join(ROOT, 'public/img/blog');
const DRY = process.argv.includes('--dry-run');
const DB = process.argv.includes('--db');
const RE = /https?:\/\/(?:www\.)?boattripthailand\.com\/wp-content\/uploads\/([^"\s\\)]+)/g;
const toLocal = rel => '/img/blog/' + rel;

const text = fs.readFileSync(POSTS, 'utf8');
const urls = new Map();
for (const m of text.matchAll(RE)) urls.set(m[0], m[1]);
console.log(`พบรูป ${urls.size} รูปใน data/posts.json`);
if (DRY) { for (const [u, r] of [...urls].slice(0, 5)) console.log(' ', u, '→', toLocal(r)); process.exit(0); }

const ok = new Set(), failed = [];
let i = 0;
async function worker(list) {
  for (const [url, rel] of list) {
    const dest = path.join(OUT_DIR, decodeURIComponent(rel));
    i++;
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { ok.add(url); continue; }
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 BTT-migration' } });
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !type.startsWith('image/')) throw new Error(`HTTP ${res.status} ${type}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      ok.add(url);
      process.stdout.write(`\r  ดาวน์โหลดแล้ว ${ok.size}/${urls.size}`);
    } catch (e) { failed.push([url, String(e.message || e)]); }
  }
}
const all = [...urls];
const chunks = Array.from({ length: 6 }, (_, k) => all.filter((_, j) => j % 6 === k));
await Promise.all(chunks.map(worker));
console.log(`\nสำเร็จ ${ok.size} · ไม่สำเร็จ ${failed.length}`);
for (const [u, e] of failed) console.log('  ✗', u, '-', e);

// เปลี่ยนลิงก์เฉพาะรูปที่ดาวน์โหลดสำเร็จ (รูปที่ล้มเหลวยังชี้ที่เดิม รันซ้ำได้)
const backup = path.join(ROOT, 'data/posts.wp-urls.backup.json');
if (!fs.existsSync(backup)) fs.writeFileSync(backup, text);
const newText = text.replace(RE, (full, rel) => ok.has(full) ? toLocal(rel) : full);
JSON.parse(newText); // ตรวจว่าไฟล์ยังเป็น JSON ถูกต้อง
fs.writeFileSync(POSTS, newText);
console.log('แก้ data/posts.json แล้ว (ไฟล์เดิมสำรองไว้ที่ data/posts.wp-urls.backup.json)');

if (DB) {
  if (!process.env.DATABASE_URL) { console.log('ไม่มี DATABASE_URL — ข้ามการแก้ฐานข้อมูล'); process.exit(failed.length ? 1 : 0); }
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  let n = 0;
  for (const url of ok) {
    const local = toLocal(urls.get(url));
    const r = await client.query(
      `UPDATE posts SET cover = replace(cover, $1, $2), blocks = replace(blocks::text, $1, $2)::jsonb
       WHERE cover LIKE '%' || $1 || '%' OR blocks::text LIKE '%' || $1 || '%'`, [url, local]);
    n += r.rowCount;
  }
  await client.end();
  console.log(`แก้ลิงก์ในฐานข้อมูลแล้ว ${n} แถว (หน้าเว็บอัปเดตภายใน 5 นาที)`);
}
process.exit(failed.length ? 1 : 0);
