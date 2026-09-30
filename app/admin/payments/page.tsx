import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NAMES: Record<string, string> = { resume_credit: '₹9 Credit', pro_monthly: 'Pro Monthly', pro_yearly: 'Pro Yearly' };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const db = supabaseAdmin();
  let q = db.from('payments').select('*').order('created_at', { ascending: false }).limit(300);
  if (sp.status) q = q.eq('status', sp.status);
  const { data: rows } = await q;
  const ids = Array.from(new Set((rows || []).map((r) => r.user_id)));
  const { data: users } = ids.length ? await db.from('profiles').select('id, email, name').in('id', ids) : { data: [] as any[] };
  const byId = Object.fromEntries((users || []).map((u) => [u.id, u]));

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Payments</h1>
      <div className="mb-4 flex gap-2 text-sm">
        {['', 'paid', 'created', 'failed'].map((s) => (
          <Link key={s} href={s ? `/admin/payments?status=${s}` : '/admin/payments'} className={`chip ${sp.status === s || (!sp.status && !s) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white'}`}>{s || 'All'}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="p-3">Date</th><th className="p-3">User</th><th className="p-3">Product</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Razorpay ID</th></tr>
          </thead>
          <tbody className="divide-y">
            {(rows || []).map((r) => (
              <tr key={r.id}>
                <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString('en-IN')}</td>
                <td className="p-3">{byId[r.user_id]?.email || r.user_id.slice(0, 8)}</td>
                <td className="p-3">{NAMES[r.product] || r.product}</td>
                <td className="p-3">₹{r.amount / 100}</td>
                <td className="p-3"><span className={`badge ${r.status === 'paid' ? 'bg-green-100 text-green-800' : r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td>
                <td className="p-3 text-xs text-slate-500">{r.razorpay_payment_id || r.razorpay_order_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!rows || rows.length === 0) && <p className="p-4 text-sm text-slate-500">No payments yet.</p>}
      </div>
      <p className="mt-3 text-xs text-slate-500">“created” = user opened payment but did not complete it.</p>
    </div>
  );
}
