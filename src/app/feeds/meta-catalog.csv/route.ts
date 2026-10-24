import { boatsWithPrice } from '@/lib/site-data';
import { SITE } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const TYPE_EN: Record<string, string> = { yacht: 'Yacht', catamaran: 'Catamaran', speedboat: 'Speedboat', sailing: 'Sailing boat' };
const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`;

/**
 * Product catalog for Meta dynamic ads (Commerce Manager → Data sources → Scheduled feed).
 * One row per active boat with today's price and a photo; id = boat slug = content_ids sent by the Pixel.
 *   /feeds/meta-catalog.csv          English, THB
 *   /feeds/meta-catalog.csv?lang=th  Thai page links
 */
export async function GET(req: Request) {
  const th = new URL(req.url).searchParams.get('lang') === 'th';
  const rows = await boatsWithPrice();   // same "from" price as the website shows today (season-aware)
  const head = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'additional_image_link', 'brand', 'custom_label_0', 'custom_label_1'];
  const lines = rows.filter(b => b.images.length && b.priceToday).map(b => {
    const type = TYPE_EN[b.type] ?? b.type;
    const desc = [b.subtitle, `Private ${type.toLowerCase()} charter in Phuket`, b.pax ? `up to ${b.pax} guests` : '', b.marina ? `from ${b.marina}` : ''].filter(Boolean).join(' · ');
    return [b.slug, `${b.name} – Private ${type} Charter Phuket`, desc, 'in stock', 'new', `${b.priceToday}.00 THB`,
      `${SITE}${th ? '' : '/en'}/yacht-charter/${b.slug}`, SITE + b.images[0], b.images.slice(1, 10).map(i => SITE + i).join(','), 'Boat Trip Thailand', type, b.pax ? `${b.pax} pax` : ''].map(cell).join(',');
  });
  return new Response([head.join(','), ...lines].join('\n') + '\n', { headers: { 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
