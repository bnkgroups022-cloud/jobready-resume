'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  user: { id: string; name: string | null; email: string | null; mobile: string | null; is_blocked: boolean; created_at: string };
  info: { freeUsed: boolean; credits: number; pro: string; resumes: number };
};

export default function AdminUserRow({ user, info }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action: string, value?: number) {
    setBusy(true);
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId: user.id, value }) });
    setBusy(false);
    if (!r.ok) alert((await r.json()).error || 'Failed');
    router.refresh();
  }
  return (
    <div className="card p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{user.name || '—'} {user.is_blocked && <span className="badge bg-red-100 text-red-700">BLOCKED</span>}</p>
          <p className="text-sm text-slate-600">{user.email} · {user.mobile || 'no mobile'}</p>
          <p className="text-xs text-slate-500">Joined {new Date(user.created_at).toLocaleDateString('en-IN')} · {info.resumes} resumes · Free {info.freeUsed ? 'used' : 'available'} · Credits {info.credits} {info.pro && `· PRO ${info.pro}`}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <button disabled={busy} className="btn-outline px-3 py-1.5" onClick={() => act('add_credits', 1)}>+1 Credit</button>
        <button disabled={busy} className="btn-outline px-3 py-1.5" onClick={() => act('grant_pro', 30)}>+30 days Pro</button>
        <button disabled={busy} className="btn-outline px-3 py-1.5" onClick={() => act('grant_pro', 365)}>+1 year Pro</button>
        {info.pro && <button disabled={busy} className="btn-outline px-3 py-1.5" onClick={() => act('cancel_pro')}>Cancel Pro</button>}
        {info.freeUsed && <button disabled={busy} className="btn-outline px-3 py-1.5" onClick={() => act('reset_free')}>Reset free</button>}
        <button disabled={busy} className={`btn-outline px-3 py-1.5 ${user.is_blocked ? '' : 'text-red-600'}`} onClick={() => act(user.is_blocked ? 'unblock' : 'block')}>{user.is_blocked ? 'Unblock' : 'Block'}</button>
      </div>
    </div>
  );
}
