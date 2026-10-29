import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { I, Ico, LoginFrame, Steps } from '@/components/admin/LoginFrame';
import { CopyKey, OtpForm } from '@/components/admin/LoginForms';
import { ensureTotpSecret, pendingMfaUser, totpUri } from '@/lib/auth';
import { logoutAction, mfaAction } from '../../actions';

export default async function TwoFactor() {
  const u = await pendingMfaUser();
  if (!u) redirect('/admin/login');
  const setup = !u.totpEnabled ? await ensureTotpSecret(u) : null;
  const qr = setup ? await QRCode.toDataURL(totpUri(u.email, setup), { margin: 1, width: 264 }) : null;
  return (
    <LoginFrame>
      <Steps step={2} setup={!!setup} />
      {setup ? <>
        <h1>ตั้งค่ายืนยัน 2 ขั้นตอน</h1>
        <p className="lg-sub">ครั้งแรกครั้งเดียว · ทุกบัญชีต้องใช้ เพราะหลังบ้านมีข้อมูลลูกค้า</p>
        <div className="lg-qr"><img src={qr!} alt="QR code สำหรับแอป Authenticator" width={132} height={132} />
          <ol><li>ติดตั้งแอป Authenticator</li><li>กด “+” แล้วสแกน QR นี้</li><li>ใส่รหัส 6 หลักที่แอปแสดงด้านล่าง</li></ol></div>
        <div className="lg-apps"><span>Google Authenticator</span><span>Microsoft Authenticator</span><span>1Password</span></div>
        <CopyKey value={setup} />
      </> : <>
        <h1>ใส่รหัสจากแอป</h1>
        <p className="lg-sub">เปิดแอป Authenticator แล้วใส่รหัส 6 หลักของ Boat Trip Thailand</p>
      </>}
      <form action={logoutAction} className="lg-who"><span className="lg-ava">{(u.name || u.email).trim().charAt(0).toUpperCase()}</span><span className="lg-em">{u.name} · {u.email}</span><button>ไม่ใช่คุณ?</button></form>
      <OtpForm action={mfaAction} hint={setup ? 'ใส่ครบ 6 หลักแล้วเปิดใช้ 2FA และเข้าระบบให้เลย' : 'ใส่ครบ 6 หลักแล้วเข้าระบบให้เลย ไม่ต้องกดยืนยัน'} />
      <div className="lg-row2"><form action={logoutAction}><button className="lg-ghost"><Ico d={I.back} />กลับ</button></form><span>เปลี่ยนมือถือ? ให้ Super Admin รีเซ็ต 2FA</span></div>
    </LoginFrame>
  );
}
