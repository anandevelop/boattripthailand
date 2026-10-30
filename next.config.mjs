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
      // site photos rarely change: a month in the browser, refreshed in the background after that
      { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=604800' }] },
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=604800' }] },
      // site scripts/styles carry ?v= but CSS edits do not change it: an hour, then refreshed in the background
      { source: '/site/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=604800' }] },
      { source: '/site/vendor/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/site/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }, { key: 'Access-Control-Allow-Origin', value: '*' }] },
    ];
  },
};
export default config;
