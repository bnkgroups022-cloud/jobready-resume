import { missingEnv, SUPABASE_ENV } from '@/lib/env';
import SetupNotice from '@/components/SetupNotice';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser, supabaseAdmin } from '@/lib/supabase/server';
import { getStatus } from '@/lib/status';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Resumes' };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const missingCfg = missingEnv(SUPABASE_ENV);
  if (missingCfg.length) return <SetupNotice missing={missingCfg} />;
  const sp = await searchParams;
  const user = await getUser();
  if (!user) redirect('/login?next=/dashboard');
  const status = await getStatus(user);
  const db = supabaseAdmin();
  const [{ data: resumes }, { data: payments }] = await Promise.all([
    db.from('resumes').select('id, job_role, template, source, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    db.from('payments').select('id, amount, product, status, created_at, razorpay_payment_id').eq('user_id', user.id).eq('status', 'paid').order('created_at', { ascending: false }).limit(20),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {sp.paid === '1' && <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">✅ Payment successful. Your plan/credit is active.</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hi{status.name ? `, ${status.name}` : ''} 👋</h1>
          <p className="text-sm text-slate-600">{status.email}</p>
        </div>
        <Link href="/builder" className="btn-primary px-6 py-3">+ Create New Resume</Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Plan</p>
          <p className="mt-1 text-xl font-bold">{status.isPro ? (status.plan === 'pro_yearly' ? 'Pro Yearly 👑' : 'Pro Monthly ⭐') : 'Free'}</p>
          {status.isPro && status.expiry && <p className="text-xs text-slate-500">Valid till {new Date(status.expiry).toLocaleDateString('en-IN')}</p>}
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Free resume</p>
          <p className="mt-1 text-xl font-bold">{status.freeUsed ? 'Used' : '1 available'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Paid credits</p>
          <p className="mt-1 text-xl font-bold">{status.isPro ? 'Unlimited' : status.credits}</p>
        </div>
      </div>

      <DashboardClient isPro={status.isPro} resumes={resumes || []} />

      {payments && payments.length > 0 && (
        <div className="card mt-6 p-4">
          <h2 className="font-semibold">Payment history</h2>
          <div className="mt-2 divide-y text-sm">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between py-2">
                <span>{p.product === 'resume_credit' ? '1 Resume Credit' : p.product === 'pro_monthly' ? 'Pro Monthly' : 'Pro Yearly'} <span className="text-xs text-slate-400">{p.razorpay_payment_id}</span></span>
                <span>₹{p.amount / 100} · {new Date(p.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form action="/auth/signout" method="post" className="mt-8 text-center">
        <button className="btn-ghost text-slate-500">Logout</button>
      </form>
    </div>
  );
}
