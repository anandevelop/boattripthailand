import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ · Boat Trip Thailand', robots: { index: false, follow: false }, icons: { icon: '/icon.png' } };

/** Same look as the admin (public/admin-app/*.css), not the public site styles */
export default function LoginRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/admin-app/admin.css" />
        <link rel="stylesheet" href="/admin-app/tw.css" />
        <link rel="stylesheet" href="/admin-app/glass.css" />
      </head>
      <body className="bg-[#faf7f5]">{children}</body>
    </html>
  );
}
