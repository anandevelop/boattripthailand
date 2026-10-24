import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { ActionForm, Submit } from '@/components/admin/Forms';
import { Ico, LoginFrame } from '@/components/admin/LoginFrame';
import { ensureTotpSecret, pendingMfaUser, totpUri } from '@/lib/auth';
import { mfaAction } from '../../actions';

export default async function TwoFactor() {
  const u = await pendingMfaUser();
  if (!u) redirect('/admin/login');
  const setup = !u.totpEnabled ? await ensureTotpSecret(u) : null;
  const qr = setup ? await QRCode.toDataURL(totpUri(u.email, setup), { margin: 1, width: 200 }) : null;
  return (
    <LoginFrame>
      <Link href="/admin/login" className="btn btn-g !px-2 -ml-2 mb-4"><Ico d="m12 19-7-7 7-7M19 12H5" />กลับ</Link>
      <div className="w-12 h-12 rounded-2xl bg-maroon-50 grid place-items-center text-maroon"><Ico d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01" className="w-6 h-6" /></div>
      <h1 className="text-[22px] font-medium mt-4">{setup ? 'ตั้งค่ายืนยันตัวตน 2 ขั้นตอน' : 'ยืนยันตัวตน 2 ขั้นตอน'}</h1>
      {setup ? <>
        <p className="text-muted mt-1">บทบาท {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} ต้องใช้ 2FA · สแกน QR ด้วย Google Authenticator / Microsoft Authenticator / 1Password แล้วใส่รหัส 6 หลัก</p>
        <img src={qr!} alt="QR code สำหรับแอป Authenticator" className="mx-auto mt-4 rounded-xl ring-1 ring-line" width={200} height={200} />
        <p className="text-[11px] text-muted text-center mt-2 break-all">หรือพิมพ์รหัส: <code className="select-all">{setup}</code></p>
      </> : <p className="text-muted mt-1">ใส่รหัส 6 หลักจากแอป Authenticator ของ {u.name}</p>}
      <ActionForm action={mfaAction} className="mt-6 grid gap-3">
        <input className="inp !h-12 text-center text-[22px] tracking-[.5em] tnum" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus placeholder="••••••" />
        <Submit className="btn btn-p !h-11">ยืนยัน</Submit>
      </ActionForm>
    </LoginFrame>
  );
}
