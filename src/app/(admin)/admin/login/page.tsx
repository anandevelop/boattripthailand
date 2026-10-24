import { redirect } from 'next/navigation';
import { ActionForm, Submit } from '@/components/admin/Forms';
import { LoginFrame } from '@/components/admin/LoginFrame';
import { currentUser } from '@/lib/auth';
import { loginAction } from '../actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ timeout?: string }> }) {
  if (await currentUser()) redirect('/admin');
  const sp = await searchParams;
  return (
    <LoginFrame>
      <h1 className="text-[22px] font-medium">เข้าสู่ระบบ</h1><p className="text-muted mt-1">ใช้อีเมลทีมงาน @boattripthailand.com</p>
      {sp.timeout && <p className="mt-4 rounded-xl bg-sand px-3 py-2 text-[12px] text-muted">ออกจากระบบอัตโนมัติเพราะไม่มีการใช้งาน 30 นาที</p>}
      <ActionForm action={loginAction} className="mt-6 grid gap-3">
        <label><span className="lbl">อีเมล</span><input className="inp" name="email" type="email" autoComplete="username" required autoFocus /></label>
        <label><span className="lbl">รหัสผ่าน</span><input className="inp" name="password" type="password" autoComplete="current-password" required /></label>
        <Submit className="btn btn-p !h-11 mt-1">เข้าสู่ระบบ</Submit>
      </ActionForm>
      <p className="text-[12px] text-muted mt-6">ลืมรหัสผ่าน ติดต่อ Super Admin ให้ตั้งรหัสชั่วคราวให้ที่หน้า “ทีม”</p>
    </LoginFrame>
  );
}
