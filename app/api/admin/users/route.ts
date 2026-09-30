import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { json } from '@/lib/request';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return json({ error: 'Not allowed' }, 403);
  const b = await req.json().catch(() => null);
  const userId = String(b?.userId || '');
  if (!userId) return json({ error: 'Missing user' }, 400);
  const db = supabaseAdmin();

  if (b.action === 'add_credits') {
    const n = Math.max(1, Math.min(100, Number(b.value) || 1));
    const { data: c } = await db.from('resume_credits').select('paid_resume_credits').eq('user_id', userId).maybeSingle();
    const { error } = await db.from('resume_credits').upsert({ user_id: userId, paid_resume_credits: (c?.paid_resume_credits || 0) + n, updated_at: new Date().toISOString() });
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  if (b.action === 'grant_pro') {
    const days = Math.max(1, Math.min(3650, Number(b.value) || 30));
    const { data: s } = await db.from('subscriptions').select('expiry_date, status').eq('user_id', userId).maybeSingle();
    const base = s && s.status === 'active' && new Date(s.expiry_date) > new Date() ? new Date(s.expiry_date) : new Date();
    const expiry = new Date(base.getTime() + days * 86400000).toISOString();
    const { error } = await db.from('subscriptions').upsert(
      { user_id: userId, plan: days >= 300 ? 'pro_yearly' : 'pro_monthly', status: 'active', expiry_date: expiry, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  if (b.action === 'cancel_pro') {
    const { error } = await db.from('subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('user_id', userId);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  if (b.action === 'reset_free') {
    const { error } = await db.from('resume_credits').update({ free_resume_used: false }).eq('user_id', userId);
    await db.from('device_claims').delete().eq('user_id', userId);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  if (b.action === 'block' || b.action === 'unblock') {
    const { error } = await db.from('profiles').update({ is_blocked: b.action === 'block' }).eq('id', userId);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  return json({ error: 'Unknown action' }, 400);
}
