'use server';
import { redirect } from 'next/navigation';
import { completeMfa, loginWithPassword, logout } from '@/lib/auth';

/* Sign-in only. Everything inside the admin goes through /api/admin/* (src/app/api/admin/[...op]/route.ts). */
type State = { error?: string; ok?: string; secret?: string } | undefined;

export async function loginAction(_: State, fd: FormData): Promise<State> {
  const r = await loginWithPassword(String(fd.get('email') || ''), String(fd.get('password') || ''));
  if (!r.ok) return { error: r.error };
  redirect(r.mfa ? '/admin/login/2fa' : '/admin');
}
/** returns ok instead of redirecting: the 6 boxes turn green first, then the page opens /admin */
export async function mfaAction(_: State, fd: FormData): Promise<State> {
  const r = await completeMfa(String(fd.get('code') || ''));
  if (!r.ok) return { error: r.error };
  return { ok: 'ok' };
}
export async function logoutAction() { await logout(); redirect('/admin/login'); }
