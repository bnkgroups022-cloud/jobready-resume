'use client';
import { useState } from 'react';
import { startCheckout } from '@/lib/client';
import type { ProductKey } from '@/lib/pricing';

type Props = {
  reason: string;
  proOnly?: boolean;
  onClose: () => void;
  onPaid: (product: ProductKey) => void;
};

export default function Paywall({ reason, proOnly, onClose, onPaid }: Props) {
  const [busy, setBusy] = useState<ProductKey | null>(null);
  const [err, setErr] = useState('');

  async function buy(p: ProductKey) {
    setErr('');
    setBusy(p);
    const r = await startCheckout(p);
    setBusy(null);
    if (r.ok) onPaid(p);
    else if (r.error) setErr(r.error);
  }

  const opts: { p: ProductKey; title: string; price: string; sub: string; best?: boolean }[] = [
    ...(proOnly ? [] : [{ p: 'resume_credit' as ProductKey, title: 'Create 1 Resume', price: '₹9', sub: 'One-time · this resume only' }]),
    { p: 'pro_monthly', title: 'Pro Monthly', price: '₹49', sub: 'Unlimited resumes · 30 days' },
    { p: 'pro_yearly', title: 'Pro Yearly', price: '₹399', sub: 'Unlimited · 365 days · ₹33.25/month', best: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">{proOnly ? 'Unlock Pro' : 'Free limit completed'}</h2>
          <button className="btn-ghost -mr-2 -mt-1 px-2" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="mt-1 text-sm text-slate-600">{reason}</p>
        <div className="mt-4 space-y-3">
          {opts.map((o, i) => (
            <div key={o.p}>
              {i > 0 && <p className="my-1 text-center text-xs font-semibold text-slate-400">OR</p>}
              <button
                disabled={!!busy}
                onClick={() => buy(o.p)}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition hover:border-brand-500 ${o.best ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {o.title} {o.best && <span className="badge bg-brand-600 text-white">Best Value</span>}
                  </div>
                  <div className="text-xs text-slate-600">{o.sub}</div>
                </div>
                <div className="text-lg font-extrabold">{busy === o.p ? '…' : o.price}</div>
              </button>
            </div>
          ))}
        </div>
        {err && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <p className="mt-4 text-center text-xs text-slate-500">Secure payment by Razorpay · UPI, Cards, Netbanking · No auto-debit</p>
      </div>
    </div>
  );
}
