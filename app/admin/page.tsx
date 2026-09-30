import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const { data: s, error } = await supabaseAdmin().rpc('admin_stats');
  if (error || !s) return <p className="text-red-700">Could not load stats: {error?.message}. Did you run schema.sql?</p>;
  const daily: { day: string; c: number }[] = s.daily || [];
  const max = Math.max(1, ...daily.map((d) => d.c));
  const cards = [
    ['Total users', s.users, `+${s.users_7d} in 7 days`],
    ['Total resumes', s.resumes, `${s.resumes_today} today · ${s.resumes_7d} in 7 days`],
    ['Active Pro', s.active_pro, 'Monthly + Yearly'],
    ['Revenue', `₹${(s.revenue_paise / 100).toLocaleString('en-IN')}`, `₹${(s.revenue_30d_paise / 100).toLocaleString('en-IN')} in 30 days · ${s.paid_count} payments`],
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([t, v, sub]) => (
          <div key={t} className="card p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">{t}</p>
            <p className="mt-1 text-2xl font-extrabold">{v}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h2 className="font-semibold">Resumes — last 14 days</h2>
        <div className="mt-4 flex h-40 items-end gap-1">
          {daily.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.c}`}>
              <span className="text-[10px] text-slate-500">{d.c || ''}</span>
              <div className="w-full rounded-t bg-brand-500" style={{ height: `${(d.c / max) * 120}px`, minHeight: d.c ? 3 : 1 }} />
              <span className="text-[9px] text-slate-400">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <h2 className="font-semibold">Top jobs</h2>
          <div className="mt-2 divide-y text-sm">
            {(s.top_jobs || []).map((j: any) => <div key={j.job_role} className="flex justify-between py-1.5"><span>{j.job_role}</span><b>{j.c}</b></div>)}
            {(!s.top_jobs || s.top_jobs.length === 0) && <p className="text-slate-500">No resumes yet.</p>}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Resumes by type</h2>
          <div className="mt-2 divide-y text-sm">
            {Object.entries(s.by_source || {}).map(([k, v]) => <div key={k} className="flex justify-between py-1.5"><span className="capitalize">{k}</span><b>{String(v)}</b></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
