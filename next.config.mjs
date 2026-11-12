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
  // www → the main domain for files the middleware does not run on (pages: src/middleware.ts, in one hop with old URLs)
  async redirects() {
    const www = [{ type: 'host', value: 'www\\.(?<domain>.+)' }];
    return [
      { source: '/:file(robots\\.txt|sitemap\\.xml|llms\\.txt|favicon\\.ico|icon\\.png|site-data\\.js|site-home\\.js)', has: www, destination: 'https://:domain/:file', statusCode: 301 },
      { source: '/:dir(boats|img|r|site|uploads|brand|feeds|api)/:path*', has: www, destination: 'https://:domain/:dir/:path*', statusCode: 301 },
      // old WordPress / Yoast sitemaps (sitemap_index.xml, post-sitemap.xml, wp-sitemap-*.xml …) still listed in Google / Bing → the one sitemap, one hop
      { source: '/:old(sitemap_index\\.xml|wp-sitemap[a-z0-9-]*\\.xml|[a-z0-9_-]+-sitemap[0-9]*\\.xml)', has: www, destination: 'https://:domain/sitemap.xml', statusCode: 301 },
      { source: '/:old(sitemap_index\\.xml|wp-sitemap[a-z0-9-]*\\.xml|[a-z0-9_-]+-sitemap[0-9]*\\.xml)', destination: '/sitemap.xml', statusCode: 301 },
    ];
  },
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
