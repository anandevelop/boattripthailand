export type Lang = 'th' | 'en';
/** public URL for a path in a language (Thai has no prefix) */
export const href = (lang: Lang, path = '/') => (lang === 'en' ? '/en' + (path === '/' ? '' : path) : path) || '/';
export const SITE = (process.env.APP_URL || 'https://boattripthailand.com').replace(/\/$/, '');
export const abs = (lang: Lang, path = '/') => SITE + href(lang, path);
