/** /admin/login screens: brand red with Liquid Glass (styles in public/admin-app/login.css) */
export const I = {
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  history: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'm12 19-7-7 7-7M19 12H5',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  alert: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  check: 'M20 6 9 17l-5-5',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
};
export function Ico({ d, className = 'i' }: { d: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className === 'i' ? 'i' : 'i ' + className} aria-hidden="true"><path d={d} /></svg>;
}

export function Steps({ step, setup }: { step: 1 | 2; setup?: boolean }) {
  return (
    <div className="lg-steps" aria-label={`ขั้นตอนที่ ${step} จาก 2`}>
      <span className={'s ' + (step === 1 ? 'on' : 'done')}><span className="dot">{step === 1 ? '1' : '✓'}</span>รหัสผ่าน</span>
      <span className="bar" />
      <span className={'s ' + (step === 2 ? 'on' : '')}><span className="dot">2</span>{setup ? 'ตั้งค่า 2FA' : 'ยืนยันตัวตน'}</span>
    </div>
  );
}

const WAVES = ['M0 640 C 240 580 420 700 720 640 S 1200 560 1440 620', 'M0 700 C 260 650 460 760 760 700 S 1220 630 1440 690', 'M0 760 C 280 720 500 820 800 760 S 1240 700 1440 760'];

export function LoginFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="lg">
      <span className="lg-blob lg-b1" /><span className="lg-blob lg-b2" /><span className="lg-blob lg-b3" /><span className="lg-blob lg-b4" />
      <svg className="lg-waves" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">{WAVES.map(d => <path key={d} d={d} />)}</svg>
      <span className="lg-grain" />
      <div className="lg-wrap">
        <section className="lg-brand">
          <div className="lg-logo"><span className="lg-mark"><img src="/brand/logo.png" alt="" /></span><div><p className="lg-t1">BOAT TRIP</p><p className="lg-t2">ADMIN</p></div></div>
          <div className="lg-hero">
            <h1>ระบบหลังบ้าน<br /><em>Boat Trip Thailand</em></h1>
            <p>ลีด ลูกค้า เรือ ราคา และเว็บไซต์ ในที่เดียว · เข้าได้เฉพาะทีมงาน</p>
            <div className="lg-chips">
              <span className="lg-chip"><Ico d={I.phone} />ยืนยัน 2 ขั้นตอนทุกบัญชี</span>
              <span className="lg-chip"><Ico d={I.shield} />สิทธิ์ตามบทบาท ตรวจที่เซิร์ฟเวอร์</span>
              <span className="lg-chip"><Ico d={I.history} />บันทึกทุกการแก้ไข</span>
            </div>
          </div>
          <div className="lg-foot"><span>© {new Date().getFullYear()} Boat Trip (Thailand) Co., Ltd.</span><span>ออกจากระบบอัตโนมัติเมื่อไม่ใช้งาน 30 นาที</span></div>
        </section>
        <section className="lg-card">{children}</section>
      </div>
    </main>
  );
}
