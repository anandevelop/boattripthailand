// Production copies of the site's CSS and JS (npm run build → build:assets), served by src/lib/site-render.ts when present:
//  · public/site/site.min.css — mockup + tw + glass + fleet .css in the shell's order, minified: one render-blocking request instead of four
//  · public/site/app.min.js, fleet.min.js — minified. Top-level names stay as they are (onclick="…" and the other scripts use them).
// The server render still runs the readable app.js / fleet.js; the browser gets the small ones.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

// esbuild comes with the dev tools (tsx, drizzle-kit). Without it: no .min files, and the site serves the readable ones.
let transformSync;
try { ({ transformSync } = await import('esbuild')); transformSync('a', { loader: 'js' }); }
catch (e) { console.warn('build-assets: esbuild not usable here, serving the unminified files ·', String(e.message || e).split('\n')[0]); for (const f of ['site.min.css', 'app.min.js', 'fleet.min.js']) rmSync('public/site/' + f, { force: true }); process.exit(0); }

const dir = 'public/site/', kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
const css = ['mockup.css', 'tw.css', 'glass.css', 'fleet.css'].map(f => `/* ${f} */\n` + readFileSync(dir + f, 'utf8')).join('\n');
const outCss = transformSync(css, { loader: 'css', minify: true, charset: 'utf8', target: ['chrome90', 'safari14', 'firefox90'] }).code;
writeFileSync(dir + 'site.min.css', outCss);
console.log(`site.min.css  ${kb(css)} → ${kb(outCss)}`);
for (const f of ['app', 'fleet']) {
  const src = readFileSync(dir + f + '.js', 'utf8');
  // no format: a classic script — esbuild keeps top-level names and only shortens the ones inside functions
  const out = transformSync(src, { loader: 'js', minify: true, charset: 'utf8', target: 'es2020', legalComments: 'none' }).code;
  writeFileSync(dir + f + '.min.js', out);
  console.log(`${f}.min.js  ${kb(src)} → ${kb(out)}`);
}
