/**
 * Makes the site's images lighter without changing any URL.  Run after adding images to public/:
 *   node scripts/optimize-images.mjs            (public/boats + public/img, and UPLOAD_DIR if set / ./uploads)
 * - originals wider than 1600px are scaled down in place (same format); PNGs are palette-compressed in place
 * - every image gets a lighter twin next to it: <file>.avif, and <file>.webp for PNG/JPG.
 *   src/middleware.ts (public/) and src/app/uploads (uploads) send the twin to browsers that accept it.
 *   An empty twin means "no gain, serve the original" and stops the image from being processed again.
 * Already processed images (twin present) are skipped, so it is safe to run any time. Restart the app after.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const MAX = 1600, root = process.cwd();
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const isTwin = f => /\.(png|jpe?g|webp)\.(webp|avif)$/i.test(f);
const enc = (s, kind) => kind === 'webp' ? s.webp({ quality: 78, effort: 5, smartSubsample: true }) : kind === 'png' ? s.png({ palette: true, quality: 80, effort: 10, compressionLevel: 9 }) : s.jpeg({ quality: 80, mozjpeg: true });

async function publicImage(f, st) {
  const buf = fs.readFileSync(f), m = await sharp(buf).metadata(), ext = path.extname(f).slice(1).toLowerCase(), kind = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext;
  let orig = buf;
  if (m.width > MAX || kind === 'png') {
    const o = await enc(sharp(buf).rotate().resize({ width: MAX, withoutEnlargement: true }), kind).toBuffer();
    if (o.length < buf.length * .92) { fs.writeFileSync(f, o); orig = o; }
  }
  const base = () => sharp(orig).rotate().resize({ width: MAX, withoutEnlargement: true });
  let best = orig.length;
  if (kind !== 'webp') { const w = await base().webp({ quality: 78, effort: 5, smartSubsample: true }).toBuffer(); if (w.length < orig.length * .9) { fs.writeFileSync(f + '.webp', w); best = w.length; } }
  const a = await base().avif({ quality: 52, effort: 4 }).toBuffer();
  fs.writeFileSync(f + '.avif', a.length < best * .95 ? a : Buffer.alloc(0)); if (a.length < best * .95) best = a.length;
  st.before += buf.length; st.after += best;
}
async function uploadImage(f, st) {   // uploads are WebP already; only the AVIF twin (written only when smaller)
  const buf = fs.readFileSync(f), a = await sharp(buf).avif({ quality: 52, effort: 4 }).toBuffer();
  if (a.length < buf.length * .9) fs.writeFileSync(f + '.avif', a);
  st.before += buf.length; st.after += Math.min(a.length, buf.length);
}

const st = { n: 0, before: 0, after: 0 };
for (const dir of ['public/boats', 'public/img']) for (const f of walk(path.join(root, dir))) {
  if (!/\.(webp|png|jpe?g)$/i.test(f) || isTwin(f) || fs.existsSync(f + '.avif')) continue;
  try { await publicImage(f, st); st.n++; } catch (e) { console.warn('skip', f, e.message); }
}
const up = path.resolve(process.env.UPLOAD_DIR || path.join(root, 'uploads'));
for (const f of walk(up)) {
  if (!f.endsWith('.webp') || fs.existsSync(f + '.avif')) continue;
  try { await uploadImage(f, st); st.n++; } catch (e) { console.warn('skip', f, e.message); }
}
console.log(`${st.n} images · ${(st.before / 1048576).toFixed(1)} MB → ${(st.after / 1048576).toFixed(1)} MB for browsers that take AVIF/WebP`);
