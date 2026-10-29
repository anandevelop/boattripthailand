import { redirect } from 'next/navigation';
import { I, Ico, LoginFrame, Steps } from '@/components/admin/LoginFrame';
import { PasswordForm } from '@/components/admin/LoginForms';
import { currentUser } from '@/lib/auth';
import { loginAction } from '../actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ timeout?: string }> }) {
  if (await currentUser()) redirect('/admin');
  const sp = await searchParams;
  return (
    <LoginFrame>
      <Steps step={1} />
      <h1>ยินดีต้อนรับกลับ</h1>
      <p className="lg-sub">เข้าสู่ระบบด้วยอีเมลทีมงาน</p>
      {sp.timeout && <p className="lg-note">ออกจากระบบอัตโนมัติเพราะไม่มีการใช้งาน 30 นาที · เข้าสู่ระบบอีกครั้งได้เลย</p>}
      <PasswordForm action={loginAction} />
      <div className="lg-meta" id="forgot"><Ico d={I.lock} /><span>ผิดเกิน 5 ครั้ง บัญชีล็อก 15 นาที · ลืมรหัสผ่าน ให้ Super Admin ตั้งรหัสชั่วคราวให้ที่ ทีมงาน &amp; สิทธิ์</span></div>
    </LoginFrame>
  );
}
