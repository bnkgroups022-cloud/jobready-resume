'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PricingCards from './PricingCards';

type Row = { id: string; job_role: string; template: string; source: string; created_at: string };

export default function DashboardClient({ isPro, resumes }: { isPro: boolean; resumes: Row[] }) {
  const router = useRouter();
  const [list, setList] = useState(resumes);
  async function del(id: string) {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    const r = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
    if (r.ok) { setList(list.filter((x) => x.id !== id)); router.refresh(); }
  }
  return (
    <>
      <h2 className="mt-8 text-lg font-bold">My resumes ({list.length})</h2>
      {list.length === 0 ? (
        <div className="card mt-3 p-8 text-center">
          <p className="text-slate-600">You have not created any resume yet.</p>
          <Link href="/builder" className="btn-primary mt-4">Create your FREE resume</Link>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {list.map((r) => (
            <div key={r.id} className="card flex items-center justify-between gap-3 p-4">
              <Link href={`/resume/${r.id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.job_role}</p>
                <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString('en-IN')} · {r.template} · {r.source}</p>
              </Link>
              <div className="flex shrink-0 gap-1">
                <Link href={`/resume/${r.id}`} className="btn-outline px-3 py-2">Open</Link>
                <button onClick={() => del(r.id)} className="btn-ghost px-2 text-red-600" aria-label="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isPro && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Need more resumes?</h2>
          <PricingCards />
        </div>
      )}
    </>
  );
}
