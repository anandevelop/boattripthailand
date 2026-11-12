import { sql } from 'drizzle-orm';
import { db } from '@/db';

/**
 * วิเคราะห์เว็บไซต์ → แหล่งที่มา & คลิก. Hourly totals only (Thailand hour "2026-11-12T14"), no visitor id, no cookie:
 *  - traffic_src   visits (first page of a browser session) and page views per channel / source
 *  - traffic_click clicks on contact buttons (phone, WhatsApp, LINE, email…) per page and the visitor's channel / source
 *  - traffic_bot   AI agents and crawlers that open pages themselves (counted from the user agent in the middleware)
 * Tables are created on first use and keep 200 days (90-day view + the 90 days before it).
 * No 'server-only' import: the middleware loads this file.
 */
let ready: Promise<unknown> | null = null;
const ensure = () => ready ??= db.execute(sql.raw(`
  create table if not exists traffic_src (hour text not null, channel text not null, source text not null, visits integer not null default 0, views integer not null default 0, primary key (hour, channel, source));
  create table if not exists traffic_click (hour text not null, button text not null, path text not null, channel text not null, source text not null, n integer not null default 0, primary key (hour, button, path, channel, source));
  create table if not exists traffic_bot (hour text not null, agent text not null, kind text not null, path text not null, n integer not null default 0, primary key (hour, agent, path));`)).catch(e => { ready = null; throw e; });

export const thHour = (n = 0) => new Date(Date.now() + 7 * 3600_000 - n * 3600_000).toISOString().slice(0, 13);
const prune = async () => { if (Math.random() < .005) { const old = thHour(24 * 200); for (const t of ['traffic_src', 'traffic_click', 'traffic_bot']) await db.execute(sql`delete from ${sql.identifier(t)} where hour < ${old}`); } };

/* ---------- channel + readable source name ---------- */
export type Channel = 'ai' | 'search' | 'social' | 'ads' | 'web' | 'direct';
const AI: [RegExp, string][] = [[/chatgpt|openai/, 'ChatGPT'], [/perplexity/, 'Perplexity'], [/claude|anthropic/, 'Claude'], [/gemini|bard/, 'Gemini'], [/copilot/, 'Copilot'],
  [/deepseek/, 'DeepSeek'], [/grok|x\.ai/, 'Grok'], [/meta\.ai/, 'Meta AI'], [/you\.com/, 'You.com'], [/phind/, 'Phind'], [/mistral|chat\.mistral/, 'Mistral']];
const NAMED: Record<string, [Channel, string]> = { google: ['search', 'Google'], bing: ['search', 'Bing'], facebook: ['social', 'Facebook'], instagram: ['social', 'Instagram'], line: ['social', 'LINE'],
  tiktok: ['social', 'TikTok'], youtube: ['social', 'YouTube'], 'google-ads': ['ads', 'Google Ads'], 'facebook-ads': ['ads', 'Facebook / IG Ads'], email: ['web', 'อีเมล'], direct: ['direct', 'เข้าตรง / ไม่ทราบ'] };
const SEARCH: [RegExp, string][] = [[/duckduckgo/, 'DuckDuckGo'], [/yahoo/, 'Yahoo'], [/yandex/, 'Yandex'], [/baidu/, 'Baidu'], [/naver/, 'Naver'], [/ecosia/, 'Ecosia'], [/brave/, 'Brave Search']];
/** `s` = the source key the site sends (pvSource in public/site/app.js), `r` = utm_source or referrer host */
export function classify(s: string, r: string): { channel: Channel; source: string } {
  const host = /^[a-z0-9][a-z0-9.-]{0,79}$/.test(r) ? r : '';
  const ai = AI.find(([re]) => re.test(host));
  if (s === 'ai' || ai) return { channel: 'ai', source: ai ? ai[1] : host || 'AI อื่น ๆ' };
  if (NAMED[s]) { const [channel, source] = NAMED[s]; return { channel, source }; }
  const se = SEARCH.find(([re]) => re.test(host));
  if (se) return { channel: 'search', source: se[1] };
  return { channel: 'web', source: host || 'อื่น ๆ' };
}

export async function srcHit(s: string, r: string, first: boolean) {
  await ensure();
  const { channel, source } = classify(s, r);
  await db.execute(sql`insert into traffic_src (hour, channel, source, visits, views) values (${thHour()}, ${channel}, ${source}, ${first ? 1 : 0}, 1)
    on conflict (hour, channel, source) do update set visits = traffic_src.visits + ${first ? 1 : 0}, views = traffic_src.views + 1`);
  await prune();
}
export const BUTTONS = ['phone', 'whatsapp', 'line', 'email', 'messenger'] as const;
export async function clickHit(button: string, path: string, s: string, r: string) {
  if (!(BUTTONS as readonly string[]).includes(button)) return;
  await ensure();
  const { channel, source } = classify(s, r);
  await db.execute(sql`insert into traffic_click (hour, button, path, channel, source, n) values (${thHour()}, ${button}, ${path}, ${channel}, ${source}, 1)
    on conflict (hour, button, path, channel, source) do update set n = traffic_click.n + 1`);
}

/* ---------- AI agents / crawlers (user agent) ---------- */
/** [pattern, name, kind]: 'user' = opens the page for a person who is asking the AI right now, 'crawler' = collects pages for training / an index */
const BOTS: [RegExp, string, 'user' | 'crawler'][] = [
  [/ChatGPT-User/i, 'ChatGPT-User', 'user'], [/Claude-User/i, 'Claude-User', 'user'], [/Perplexity-User/i, 'Perplexity-User', 'user'], [/MistralAI-User/i, 'MistralAI-User', 'user'],
  [/Meta-ExternalFetcher/i, 'Meta-ExternalFetcher', 'user'], [/DuckAssistBot/i, 'DuckAssistBot', 'user'], [/Google-Agent|Gemini-Deep-Research/i, 'Google-Agent', 'user'],
  [/GPTBot/i, 'GPTBot', 'crawler'], [/OAI-SearchBot/i, 'OAI-SearchBot', 'crawler'], [/ClaudeBot/i, 'ClaudeBot', 'crawler'], [/Claude-SearchBot/i, 'Claude-SearchBot', 'crawler'],
  [/anthropic-ai/i, 'anthropic-ai', 'crawler'], [/PerplexityBot/i, 'PerplexityBot', 'crawler'], [/Bytespider/i, 'Bytespider', 'crawler'], [/GoogleOther/i, 'Google-Other', 'crawler'],
  [/Google-Extended/i, 'Google-Extended', 'crawler'], [/Meta-ExternalAgent/i, 'Meta-ExternalAgent', 'crawler'], [/Amazonbot/i, 'Amazonbot', 'crawler'], [/Applebot-Extended/i, 'Applebot-Extended', 'crawler'],
  [/CCBot/i, 'CCBot', 'crawler'], [/cohere-ai/i, 'cohere-ai', 'crawler'], [/Diffbot/i, 'Diffbot', 'crawler'], [/YouBot/i, 'YouBot', 'crawler'], [/PetalBot/i, 'PetalBot', 'crawler'], [/TikTokSpider/i, 'TikTokSpider', 'crawler'],
];
export const aiBot = (ua: string) => { const b = BOTS.find(([re]) => re.test(ua)); return b ? { agent: b[1], kind: b[2] } : null; };
export async function botHit(ua: string, path: string) {
  const b = aiBot(ua); if (!b) return;
  await ensure();
  await db.execute(sql`insert into traffic_bot (hour, agent, kind, path, n) values (${thHour()}, ${b.agent}, ${b.kind}, ${path.slice(0, 200)}, 1)
    on conflict (hour, agent, path) do update set n = traffic_bot.n + 1`);
}

/* ---------- report for the admin tab ---------- */
type Row = Record<string, unknown>;
const rows = async (q: ReturnType<typeof sql>) => { const r = await db.execute(q); return ((r as unknown as { rows?: Row[] }).rows ?? (r as unknown as Row[])); };
const num = (v: unknown) => Number(v ?? 0);

/** days = 1 → the last 24 hours, one point per hour; otherwise one point per Thailand day */
export async function sourcesData(days: number) {
  await ensure();
  const hours = days * 24, from = thHour(hours - 1), prevFrom = thHour(hours * 2 - 1);
  const hourly = days === 1, bucket = hourly ? sql`hour` : sql`substr(hour, 1, 10)`;
  const [series, prev, channels, sources, clicksBy, buttons, clickPages, bots, botPages] = await Promise.all([
    rows(sql`select ${bucket} as t, sum(visits)::int as visits, sum(case when channel = 'ai' then visits else 0 end)::int as ai from traffic_src where hour >= ${from} group by 1`),
    rows(sql`select coalesce(sum(visits), 0)::int as visits, coalesce(sum(case when channel = 'ai' then visits else 0 end), 0)::int as ai from traffic_src where hour >= ${prevFrom} and hour < ${from}`),
    rows(sql`select channel, sum(visits)::int as visits, sum(views)::int as views from traffic_src where hour >= ${from} group by channel`),
    rows(sql`select channel, source, sum(visits)::int as visits, sum(views)::int as views from traffic_src where hour >= ${from} group by channel, source order by 3 desc limit 50`),
    rows(sql`select channel, source, sum(n)::int as n from traffic_click where hour >= ${from} group by channel, source`),
    rows(sql`select button, sum(n)::int as n, sum(case when channel = 'ai' then n else 0 end)::int as ai from traffic_click where hour >= ${from} group by button order by 2 desc`),
    rows(sql`select path, sum(n)::int as n from traffic_click where hour >= ${from} group by path order by 2 desc limit 10`),
    rows(sql`select agent, min(kind) as kind, sum(n)::int as n, count(distinct path)::int as pages from traffic_bot where hour >= ${from} group by agent order by min(kind) = 'crawler', 3 desc`),
    rows(sql`select path, sum(n)::int as n from traffic_bot where hour >= ${from} and kind = 'user' group by path order by 2 desc limit 10`),
  ]);
  // points oldest first, empty hours / days included
  const keys = hourly ? Array.from({ length: 24 }, (_, i) => thHour(23 - i)) : Array.from({ length: days }, (_, i) => thHour(24 * (days - 1 - i)).slice(0, 10));
  const m = new Map(series.map(r => [String(r.t), r]));
  const clickMap = new Map(clicksBy.map(r => [r.channel + '\u0000' + r.source, num(r.n)]));
  const chClicks = (c: string) => clicksBy.filter(r => r.channel === c).reduce((a, r) => a + num(r.n), 0);
  return {
    days, hourly,
    series: keys.map(t => ({ t, visits: num(m.get(t)?.visits), ai: num(m.get(t)?.ai) })),
    prev: { visits: num(prev[0]?.visits), ai: num(prev[0]?.ai) },
    channels: (['ai', 'search', 'social', 'ads', 'web', 'direct'] as const).map(c => { const r = channels.find(x => x.channel === c); return { channel: c, visits: num(r?.visits), views: num(r?.views), clicks: chClicks(c) }; }),
    sources: sources.map(r => ({ channel: String(r.channel), source: String(r.source), visits: num(r.visits), views: num(r.views), clicks: clickMap.get(r.channel + '\u0000' + r.source) ?? 0 })),
    buttons: buttons.map(r => ({ button: String(r.button), n: num(r.n), ai: num(r.ai) })),
    clickPages: clickPages.map(r => ({ path: String(r.path), n: num(r.n) })),
    bots: bots.map(r => ({ agent: String(r.agent), kind: String(r.kind), n: num(r.n), pages: num(r.pages) })),
    botPages: botPages.map(r => ({ path: String(r.path), n: num(r.n) })),
  };
}
