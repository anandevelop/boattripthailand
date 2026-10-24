// Put a Google service-account key into .env (as base64) without printing it, then delete the downloaded file.
//   node scripts/set-google-key.mjs                 (uses the newest boattripthailand-*.json in ~/Downloads)
//   node scripts/set-google-key.mjs /path/key.json
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let file = process.argv[2];
if (!file) {
  const dl = path.join(os.homedir(), 'Downloads');
  const c = fs.readdirSync(dl).filter(f => /^boattripthailand-.*\.json$/.test(f)).map(f => path.join(dl, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  file = c[0];
}
if (!file || !fs.existsSync(file)) { console.error('ไม่พบไฟล์กุญแจ — ระบุ path: node scripts/set-google-key.mjs /path/key.json'); process.exit(1); }
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
if (j.type !== 'service_account' || !j.private_key || !j.client_email) { console.error('ไฟล์นี้ไม่ใช่กุญแจ service account'); process.exit(1); }
const line = 'GOOGLE_SERVICE_ACCOUNT_JSON=' + Buffer.from(JSON.stringify(j)).toString('base64');
const envPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '.env');
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
env = /^GOOGLE_SERVICE_ACCOUNT_JSON=.*$/m.test(env) ? env.replace(/^GOOGLE_SERVICE_ACCOUNT_JSON=.*$/m, line) : env.replace(/\n*$/, '\n') + '\n# Google Analytics 4 + Search Console (read-only service account)\n' + line + '\n';
fs.writeFileSync(envPath, env, { mode: 0o600 });
fs.rmSync(file);
console.log(`✓ ใส่กุญแจของ ${j.client_email} ใน .env แล้ว และลบไฟล์ ${path.basename(file)} ออกจากเครื่อง`);
