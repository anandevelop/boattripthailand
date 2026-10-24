// Store the Gemini API key in .env without it appearing on screen or in shell history.
//   node scripts/set-gemini-key.mjs      → paste the key, press Enter
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const envPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '.env');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = s => { if (s.includes('วาง')) rl.output.write(s); else rl.output.write('*'); };   // hide what is typed
rl.question('วาง Gemini API key แล้วกด Enter: ', key => {
  rl.close(); console.log('');
  key = key.trim();
  if (!/^[A-Za-z0-9_-]{30,}$/.test(key)) { console.error('รูปแบบ key ไม่ถูกต้อง (ควรขึ้นต้นด้วย AIza…)'); process.exit(1); }
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const set = (k, v) => { env = new RegExp(`^${k}=.*$`, 'm').test(env) ? env.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`) : env.replace(/\n*$/, '\n') + `${k}=${v}\n`; };
  if (!/^GEMINI_API_KEY=/m.test(env)) env = env.replace(/\n*$/, '\n') + '\n# Auto-translate (Gemini API free tier — project without billing)\n';
  set('GEMINI_API_KEY', key);
  if (!/^GEMINI_MODEL=/m.test(env)) set('GEMINI_MODEL', 'gemini-3.5-flash-lite');
  fs.writeFileSync(envPath, env, { mode: 0o600 });
  console.log(`✓ ใส่ Gemini API key (…${key.slice(-4)}) ใน .env แล้ว · รีสตาร์ตระบบเพื่อใช้งาน`);
});
