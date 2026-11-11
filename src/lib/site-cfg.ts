import { measurementId } from '@/lib/google';
import { pub } from '@/lib/env';

/** settings every public page is rendered with (site URL, Meta pixel, GA id) */
export const siteCfg = async (): Promise<Record<string, string>> => ({ site: (process.env.APP_URL || 'https://boattripthailand.com').replace(/\/$/, ''), pixel: pub('NEXT_PUBLIC_META_PIXEL_ID') || '', ga: await measurementId() });
