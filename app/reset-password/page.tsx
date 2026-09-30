'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function ResetPassword() {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return setMsg('Password must be at least 6 characters.');
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg(error.message);
    else window.location.href = '/dashboard';
  }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <form onSubmit={save} className="card space-y-3 p-6">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
        {msg && <p className="text-sm text-red-700">{msg}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </div>
  );
}
