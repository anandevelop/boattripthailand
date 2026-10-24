/** Split login screen from the approved admin design: maroon brand panel + form panel */
const POINTS: [string, string][] = [
  ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'สิทธิ์ตามบทบาท บังคับใช้ทุกหน้าและทุก API'],
  ['M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z', 'Sales เห็นเฉพาะลีดและลูกค้าของตัวเอง'],
  ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2', 'บันทึกทุกการแก้ไข ใคร แก้อะไร เมื่อไร'],
  ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01', 'Super Admin และ Admin ต้องยืนยัน 2 ขั้นตอน (2FA)'],
];
export function Ico({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={d} /></svg>;
}
export function LoginFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_440px]">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-maroon text-white relative overflow-hidden">
        <div className="flex items-center gap-3"><img src="/brand/logo.png" alt="" className="w-10 h-10 object-contain bg-white rounded-xl p-1" /><p className="tracking-[.25em] text-[12px]">BOAT TRIP · ADMIN</p></div>
        <div className="max-w-md"><p className="text-[28px] leading-tight">ระบบหลังบ้าน<br />Boat Trip Thailand</p>
          <ul className="mt-6 space-y-3 text-[13px] text-white/80">{POINTS.map(([d, l]) => <li key={l} className="flex gap-3 items-center"><Ico d={d} className="w-4 h-4 shrink-0" />{l}</li>)}</ul></div>
        <p className="text-[11px] text-white/50">ตรวจสิทธิ์ที่เซิร์ฟเวอร์ทุกครั้ง · ไม่ใช้งาน 30 นาทีออกจากระบบอัตโนมัติ</p>
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-10 bg-white min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8"><img src="/brand/logo.png" alt="" className="w-9 h-9 object-contain" /><div className="leading-none"><p className="text-[13px] font-medium tracking-wide">BOAT TRIP</p><p className="text-[9px] tracking-[.3em] text-muted mt-1">ADMIN</p></div></div>
          {children}
        </div>
      </div>
    </div>
  );
}
