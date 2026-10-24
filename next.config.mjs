const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const config = {
  poweredByHeader: false,
  // middleware handles trailing slashes so old WordPress URLs redirect in one hop
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  serverExternalPackages: ['pg', 'bcryptjs'],
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/boats/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, immutable' }] },
    ];
  },
};
export default config;
