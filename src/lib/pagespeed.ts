import 'server-only';
import { SITE } from './i18n';

/**
 * /admin → SEO → Core Web Vitals: Google PageSpeed Insights for the home page.
 * Field data (real Chrome users, CrUX) when Google has enough traffic for the site, otherwise lab data (Lighthouse).
 * Works without a key (low shared quota); set PAGESPEED_API_KEY for a higher quota. Cached 24 h.
 */
type Metric = { v: number; cat: 'ok' | 'mid' | 'low' };
const rate = (v: number, good: number, poor: number): Metric => ({ v, cat: v <= good ? 'ok' : v <= poor ? 'mid' : 'low' });
const cache = new Map<string, { at: number; v: unknown }>();

export async function pageSpeed(strategy: 'mobile' | 'desktop' = 'mobile', refresh = false) {
  // PageSpeed cannot reach localhost, so a dev setup measures the live domain
  const url = (/localhost|127\.0\.0\.1/.test(SITE) ? 'https://new.boattripthailand.com' : SITE) + '/';
  const c = cache.get(strategy);
  if (c && !refresh && Date.now() - c.at < 24 * 3600_000) return c.v;
  const q = new URLSearchParams({ url, strategy, category: 'performance' });
  if (process.env.PAGESPEED_API_KEY) q.set('key', process.env.PAGESPEED_API_KEY);
  try {
    const r = await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + q, { signal: AbortSignal.timeout(90_000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { url, strategy, error: j?.error?.message || `PageSpeed ${r.status}` };
    const m = j.loadingExperience?.metrics ?? {}, a = j.lighthouseResult?.audits ?? {};
    const fp = (k: string) => m[k]?.percentile as number | undefined;
    const field = fp('LARGEST_CONTENTFUL_PAINT_MS') !== undefined ? {
      lcp: rate(fp('LARGEST_CONTENTFUL_PAINT_MS')!, 2500, 4000),
      inp: fp('INTERACTION_TO_NEXT_PAINT') !== undefined ? rate(fp('INTERACTION_TO_NEXT_PAINT')!, 200, 500) : null,
      cls: fp('CUMULATIVE_LAYOUT_SHIFT_SCORE') !== undefined ? rate(fp('CUMULATIVE_LAYOUT_SHIFT_SCORE')! / 100, 0.1, 0.25) : null,
    } : null;
    const lab = {
      lcp: rate(a['largest-contentful-paint']?.numericValue ?? 0, 2500, 4000),
      tbt: rate(a['total-blocking-time']?.numericValue ?? 0, 200, 600),
      cls: rate(a['cumulative-layout-shift']?.numericValue ?? 0, 0.1, 0.25),
    };
    const v = { url, strategy, at: new Date().toISOString(), score: Math.round((j.lighthouseResult?.categories?.performance?.score ?? 0) * 100), field, lab };
    cache.set(strategy, { at: Date.now(), v });
    return v;
  } catch (e) { return { url, strategy, error: e instanceof Error ? e.message : String(e) }; }
}
