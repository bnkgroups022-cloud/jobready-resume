import { supabaseAdmin } from '@/lib/supabase/server';
import AdminUserRow from '@/components/AdminUserRow';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const db = supabaseAdmin();
  let q = db.from('profiles').select('id, name, email, mobile, is_blocked, created_at').order('created_at', { ascending: false }).limit(100);
  const term = (sp.q || '').trim().replace(/[,%()]/g, '');
  if (term) q = q.or(`email.ilike.%${term}%,mobile.ilike.%${term}%,name.ilike.%${term}%`);
  const { data: users } = await q;
  const ids = (users || []).map((u) => u.id);
  const [{ data: creds }, { data: subs }, { data: counts }] = ids.length
    ? await Promise.all([
        db.from('resume_credits').select('*').in('user_id', ids),
        db.from('subscriptions').select('*').in('user_id', ids),
        db.from('resumes').select('user_id').in('user_id', ids),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];
  const cById = Object.fromEntries((creds || []).map((c) => [c.user_id, c]));
  const sById = Object.fromEntries((subs || []).map((s) => [s.user_id, s]));
  const nById: Record<string, number> = {};
  (counts || []).forEach((r: any) => { nById[r.user_id] = (nById[r.user_id] || 0) + 1; });

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Users</h1>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={sp.q || ''} className="input" placeholder="Search email, name or mobile" />
        <button className="btn-primary">Search</button>
      </form>
      <div className="space-y-3">
        {(users || []).map((u) => {
          const s = sById[u.id];
          const pro = s && s.status === 'active' && new Date(s.expiry_date) > new Date();
          return (
            <AdminUserRow
              key={u.id}
              user={u}
              info={{
                freeUsed: !!cById[u.id]?.free_resume_used,
                credits: cById[u.id]?.paid_resume_credits || 0,
                pro: pro ? `${s.plan} till ${new Date(s.expiry_date).toLocaleDateString('en-IN')}` : '',
                resumes: nById[u.id] || 0,
              }}
            />
          );
        })}
        {(!users || users.length === 0) && <p className="text-sm text-slate-500">No users found.</p>}
      </div>
    </div>
  );
}
