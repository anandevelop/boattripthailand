'use client';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

type State = { error?: string; ok?: string; secret?: string } | undefined;
type Action = (s: State, fd: FormData) => Promise<State>;

export function Submit({ children, className = 'btn-p' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? '…' : children}</button>;
}

/** Form bound to a server action that returns { error | ok | secret } */
export function ActionForm({ action, children, className, resetOnOk }: { action: Action; children: React.ReactNode; className?: string; resetOnOk?: boolean }) {
  const [state, run] = useActionState(action, undefined);
  return (
    <form action={run} className={className} key={resetOnOk && state?.ok ? state.ok + (state.secret ?? '') : undefined}>
      {children}
      {state?.error && <p role="alert" className="text-[12px] text-[#b42318] bg-[#fdecea] rounded-xl px-3 py-2">{state.error}</p>}
      {state?.ok && <p role="status" className="text-[13px] text-[#1e7a46] bg-[#eaf6ef] rounded-xl px-3 py-2">{state.ok}</p>}
      {state?.secret && <SecretBox value={state.secret} />}
    </form>
  );
}

function SecretBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl ring-1 ring-[#efe2cc] bg-[#fbf6ef] p-3 text-[13px]">
      <p className="text-muted">รหัสผ่านชั่วคราว (แสดงครั้งเดียว · ส่งให้เจ้าของบัญชีทางช่องทางส่วนตัว)</p>
      <div className="flex items-center gap-2 mt-1.5"><code className="font-mono text-[15px] bg-white rounded-lg px-2 py-1 ring-1 ring-sand-200 select-all">{value}</code><button type="button" className="btn-o !h-8 !px-3" onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); }}>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</button></div>
    </div>
  );
}

export function ConfirmButton({ children, message, className = 'btn-o' }: { children: React.ReactNode; message: string; className?: string }) {
  return <button className={className} onClick={e => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}
