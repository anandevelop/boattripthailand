'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { I, Ico } from './LoginFrame';

type State = { error?: string; ok?: string } | undefined;
type Action = (s: State, fd: FormData) => Promise<State>;

/* ---------- step 1: e-mail + password ---------- */
function Go() {
  const { pending } = useFormStatus();
  return <button className="lg-btn" disabled={pending}>{pending ? <><span className="lg-spin" style={{ borderColor: 'rgb(255 255 255 / .35)', borderTopColor: '#fff' }} />กำลังตรวจสอบ…</> : <>เข้าสู่ระบบ<Ico d={I.arrow} /></>}</button>;
}
export function PasswordForm({ action }: { action: Action }) {
  const [state, run] = useActionState(action, undefined);
  const [show, setShow] = useState(false), [caps, setCaps] = useState(false);
  const keys = (e: React.KeyboardEvent) => setCaps(e.getModifierState?.('CapsLock') ?? false);
  return (
    <form action={run}>
      <label className="lg-fld"><span>อีเมล</span>
        <span className="lg-inp"><Ico d={I.mail} /><input name="email" type="email" autoComplete="username" placeholder="name@boattripthailand.com" required autoFocus /></span></label>
      <label className="lg-fld"><span>รหัสผ่าน <a href="#forgot" onClick={e => { e.preventDefault(); document.getElementById('forgot')?.scrollIntoView({ behavior: 'smooth' }); }}>ลืมรหัสผ่าน?</a></span>
        <span className="lg-inp"><Ico d={I.lock} /><input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required onKeyDown={keys} onKeyUp={keys} />
          <button type="button" className="lg-eye" onClick={() => setShow(!show)} aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}><Ico d={show ? I.eyeOff : I.eye} /></button></span>
        {caps && <span className="lg-hint"><Ico d={I.warn} />Caps Lock เปิดอยู่</span>}</label>
      {state?.error && <div className="lg-alert" role="alert"><Ico d={I.alert} /><span>{state.error}</span></div>}
      <Go />
    </form>
  );
}

/* ---------- step 2: six boxes, checked as soon as the 6th digit is in ---------- */
export function OtpForm({ action, hint }: { action: Action; hint: string }) {
  const [state, run, pending] = useActionState(action, undefined);
  const [d, setD] = useState<string[]>(['', '', '', '', '', '']);
  const [shake, setShake] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]), form = useRef<HTMLFormElement>(null), sent = useRef('');
  const ok = !!state?.ok, code = d.join('');

  // wrong code → shake, clear, focus the first box; right code → green, then into the admin
  useEffect(() => {
    if (state?.error) { setD(['', '', '', '', '', '']); sent.current = ''; setShake(s => s + 1); setTimeout(() => refs.current[0]?.focus(), 30); }
    if (state?.ok) { const t = setTimeout(() => { location.href = '/admin'; }, 700); return () => clearTimeout(t); }
  }, [state]);
  useEffect(() => { if (code.length === 6 && !pending && !ok && sent.current !== code) { sent.current = code; form.current?.requestSubmit(); } }, [code, pending, ok]);

  const put = (i: number, v: string) => setD(p => { const n = [...p]; n[i] = v; return n; });
  const onInput = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '');
    if (v.length > 1) return fill(v);                 // autofill / typed fast into one box
    put(i, v); if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const fill = (v: string) => { const s = v.replace(/\D/g, '').slice(0, 6).split(''); setD(p => p.map((x, j) => s[j] ?? (j < s.length ? '' : x))); refs.current[Math.min(s.length, 5)]?.focus(); };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !d[i] && i > 0) { e.preventDefault(); put(i - 1, ''); refs.current[i - 1]?.focus(); }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const cls = 'lg-otp' + (ok ? ' done' : pending ? ' busy' : state?.error && !code ? ' err' : '');
  return (
    <form action={run} ref={form}>
      <input type="hidden" name="code" value={code} />
      <div className={cls} key={shake} role="group" aria-label="รหัส 6 หลัก">
        {d.map((v, i) => (
          <input key={i} ref={el => { refs.current[i] = el; }} value={v} inputMode="numeric" pattern="[0-9]*" maxLength={i === 0 ? 6 : 1} autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`หลักที่ ${i + 1}`} autoFocus={i === 0} disabled={pending || ok} className={v ? 'f' : ''}
            onChange={e => onInput(i, e.target.value)} onKeyDown={e => onKey(i, e)} onFocus={e => e.target.select()}
            onPaste={e => { e.preventDefault(); fill(e.clipboardData.getData('text')); }} />
        ))}
      </div>
      <Timer />
      <div className={'lg-auto' + (ok ? ' ok' : pending ? ' busy' : state?.error && !code ? ' bad' : '')} role="status" aria-live="polite">
        {ok ? <><Ico d={I.check} />ยืนยันแล้ว · กำลังเข้าสู่หลังบ้าน…</>
          : pending ? <><span className="lg-spin" />กำลังตรวจรหัส…</>
          : state?.error && !code ? <><Ico d={I.alert} />{state.error}</>
          : <><Ico d={I.bolt} />{hint}</>}
      </div>
    </form>
  );
}

/** the authenticator code changes every 30 s */
function Timer() {
  const [s, setS] = useState<number | null>(null);
  useEffect(() => { const t = () => setS(30 - Math.floor(Date.now() / 1000) % 30); t(); const id = setInterval(t, 1000); return () => clearInterval(id); }, []);
  return (
    <div className="lg-timer">
      <svg className="lg-ring" viewBox="0 0 24 24" aria-hidden="true"><circle className="bgc" cx="12" cy="12" r="9" /><circle className="fg" cx="12" cy="12" r="9" strokeDasharray="56.5" strokeDashoffset={s == null ? 0 : 56.5 * (1 - s / 30)} /></svg>
      <span>รหัสในแอปเปลี่ยนใน <b>{s ?? '–'}</b> วินาที · วางรหัสทั้งชุดได้</span>
    </div>
  );
}

export function CopyKey({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return <div className="lg-key"><span>{value.replace(/(.{4})/g, '$1 ').trim()}</span><button type="button" onClick={() => { navigator.clipboard?.writeText(value); setDone(true); }}>{done ? 'คัดลอกแล้ว' : 'คัดลอก'}</button></div>;
}
