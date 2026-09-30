import 'server-only';
import type { UserStatus } from './types';
import { supabaseAdmin, isAdminEmail } from './supabase/server';

export async function getStatus(user: { id: string; email?: string | null } | null): Promise<UserStatus> {
  if (!user) return { loggedIn: false, isPro: false, freeUsed: false, credits: 0, isAdmin: false };
  const db = supabaseAdmin();
  const [{ data: prof }, { data: cred }, { data: sub }] = await Promise.all([
    db.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    db.from('resume_credits').select('free_resume_used, paid_resume_credits').eq('user_id', user.id).maybeSingle(),
    db.from('subscriptions').select('plan, status, expiry_date').eq('user_id', user.id).maybeSingle(),
  ]);
  const isPro = !!sub && sub.status === 'active' && new Date(sub.expiry_date) > new Date();
  return {
    loggedIn: true,
    email: user.email || undefined,
    name: prof?.name ?? null,
    isPro,
    plan: isPro ? sub!.plan : null,
    expiry: isPro ? sub!.expiry_date : null,
    freeUsed: !!cred?.free_resume_used,
    credits: cred?.paid_resume_credits ?? 0,
    isAdmin: isAdminEmail(user.email),
  };
}
