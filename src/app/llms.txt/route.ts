import { SITE } from '@/lib/i18n';
import { seoConfig } from '@/lib/seo';
import { siteData } from '@/lib/site-render';

export const dynamic = 'force-dynamic';

/** /llms.txt — a plain summary of the business, boats and prices for AI assistants (switch in /admin → SEO) */
export async function GET() {
  const { robots } = await seoConfig();
  if (!robots.llms) return new Response('Not found', { status: 404 });
  const d = await siteData(), set = (d as unknown as { __SET__: Record<string, string> }).__SET__ ?? {};
  const fleet = d.FLEET as { slug: string; title: string; type: string; pax: number | null; from_: number | null; marina: string }[];
  const thb = (n: number | null) => (n ? `฿${n.toLocaleString('en-US')}` : 'price on request');
  const body = `# Boat Trip Thailand

> Private yacht, catamaran, speedboat and long-tail boat charters in Phuket (plus Krabi, Phang Nga and Pattaya), booked direct with a TAT-licensed operator (licence ${set.tat || '34/03754'}). Prices are per boat (whole charter) and include captain, crew and insurance.

Contact: ${set.phone || '+66 61 172 5854'} · ${set.email || 'boattripthailand@gmail.com'} · LINE ${set.line || '@boattripthailand'}

## Main pages
- [All boats](${SITE}/yacht-charter): compare ${fleet.length} boats by size, guests and price
- [Destinations](${SITE}/destinations): Phi Phi, Phang Nga Bay, Racha, Khai islands and more
- [Guides](${SITE}/blog): charter tips, routes and seasons
- [About us](${SITE}/about-us)
- English versions live under ${SITE}/en

## Boats
${fleet.map(b => `- [${b.title}](${SITE}/yacht-charter/${b.slug}): ${b.type}${b.pax ? `, up to ${b.pax} guests` : ''}, from ${thb(b.from_)}${b.marina ? `, departs ${b.marina}` : ''}`).join('\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
