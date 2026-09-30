'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { getBrowserSiteUrl } from '@/lib/site';

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [f, setF] = useState({ name: '', mobile: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(
    params.get('error') === 'link' ? { t: 'err', m: 'That link has expired or was already used. Please login or request a new link.' } : null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const origin = getBrowserSiteUrl();
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (error) throw error;
        window.location.href = next;
      } else if (mode === 'signup') {
        if (!f.name.trim()) throw new Error('Please enter your name.');
        if (!/^[6-9]\d{9}$/.test(f.mobile.trim())) throw new Error('Please enter a valid 10-digit mobile number.');
        if (f.password.length < 6) throw new Error('Password must be at least 6 characters.');
        const { data, error } = await sb.auth.signUp({
          email: f.email.trim(),
          password: f.password,
          options: {
            data: { name: f.name.trim(), mobile: f.mobile.trim() },
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) window.location.href = next;
        else setMsg({ t: 'ok', m: 'Account created! We sent a confirmation link to your email. Open it, then come back and login.' });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: `${origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setMsg({ t: 'ok', m: 'Password reset link sent. Please check your email.' });
      }
    } catch (err: any) {
      const m = String(err?.message || 'Something went wrong');
      setMsg({ t: 'err', m: m.includes('Invalid login') ? 'Wrong email or password.' : m.includes('Email not confirmed') ? 'Please confirm your email first (check inbox/spam).' : m });
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{mode === 'login' ? 'Login' : mode === 'signup' ? 'Create free account' : 'Reset password'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === 'signup' ? 'Your resume will be saved in your account.' : mode === 'login' ? 'Login to save and download your resume.' : 'We will email you a reset link.'}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'signup' && (
            <>
              <div><label className="label">Full name</label><input className="input" value={f.name} onChange={set('name')} autoComplete="name" required /></div>
              <div><label className="label">Mobile number</label><input className="input" value={f.mobile} onChange={set('mobile')} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" required /></div>
            </>
          )}
          <div><label className="label">Email</label><input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></div>
          {mode !== 'forgot' && (
            <div><label className="label">Password</label><input className="input" type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></div>
          )}
          {msg && <p className={`rounded-xl p-3 text-sm ${msg.t === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.m}</p>}
          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          {mode !== 'signup' && <button className="text-brand-600" onClick={() => { setMode('signup'); setMsg(null); }}>New here? Create free account</button>}
          {mode !== 'login' && <button className="text-brand-600" onClick={() => { setMode('login'); setMsg(null); }}>Already have an account? Login</button>}
          {mode === 'login' && <button className="text-slate-500" onClick={() => { setMode('forgot'); setMsg(null); }}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}

function safeNext(v: string | null) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/dashboard';
}
