import type { User } from '@/db/schema';

export const PERMS = {
  leads: 'ลีด & ลูกค้า (เฉพาะของตัวเอง)',
  leads_all: 'เห็นลีดของทุกคน',
  boats: 'เรือ ราคา ฤดูกาล',
  content: 'เนื้อหา บทความ คลังสื่อ',
  seo: 'SEO & วิเคราะห์',
  marketing: 'ใช้ประโยชน์จากลีด',
  export: 'Export ข้อมูล',
  settings: 'ตั้งค่าเว็บไซต์',
  team: 'จัดการทีม & สิทธิ์ผู้ใช้',
  audit: 'ดูบันทึกกิจกรรม',
} as const;
export type Perm = keyof typeof PERMS;
export const ALL_PERMS = Object.keys(PERMS) as Perm[];

export const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', SALES: 'Sales', BOT: 'Bot' } as const;
export const ROLE_PERMS: Record<User['role'], Perm[]> = {
  SUPER_ADMIN: ALL_PERMS,
  ADMIN: ALL_PERMS.filter(p => p !== 'team' && p !== 'audit'),
  SALES: ['leads'],
  BOT: ALL_PERMS.filter(p => p !== 'team'),
};
/** a Bot can never be given these, whatever its custom permissions say: it never manages the team or permissions */
export const BOT_NEVER: Perm[] = ['team'];

/** Roles that must use two-factor authentication — every person: sales see customers' names, phones and WhatsApp too.
 *  Not BOT (an automated agent cannot read an authenticator app): keep its password long and its tokens few. */
export const MFA_ROLES: User['role'][] = ['SUPER_ADMIN', 'ADMIN', 'SALES'];

export function permsOf(u: Pick<User, 'role' | 'perms'>): Perm[] {
  const custom = (u.perms ?? []).filter((p): p is Perm => p in PERMS);
  const p = u.perms && u.perms.length ? custom : ROLE_PERMS[u.role];
  return u.role === 'BOT' ? p.filter(x => !BOT_NEVER.includes(x)) : p;
}
export const can = (u: Pick<User, 'role' | 'perms'> | null | undefined, p: Perm) => !!u && permsOf(u).includes(p);
