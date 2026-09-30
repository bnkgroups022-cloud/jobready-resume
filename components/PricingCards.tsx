'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startCheckout } from '@/lib/client';
import { FREE_FEATURES, PRO_FEATURES, type ProductKey } from '@/lib/pricing';

export default function PricingCards() {
  const router = useRouter();
  const [busy, setBusy] = useState<ProductKey | null>(null);
  const [err, setErr] = useState('');

  async function buy(p: ProductKey) {
    setErr('');
    setBusy(p);
    const r = await startCheckout(p);
    setBusy(null);
    if (r.ok) router.push('/dashboard?paid=1');
    else if (r.error) setErr(r.error);
  }

  return (
    <div>
      {err && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Free" price="₹0" sub="Start here" features={FREE_FEATURES}>
          <Link href="/builder" className="btn-outline w-full">Create Free Resume</Link>
        </Card>
        <Card title="Pay per Resume" price="₹9" sub="per resume" features={['1 extra resume credit', 'PDF, Word & Print', 'Basic templates', 'For 1–2 job applications']}>
          <button className="btn-outline w-full" disabled={!!busy} onClick={() => buy('resume_credit')}>{busy === 'resume_credit' ? 'Opening…' : 'Buy 1 Resume — ₹9'}</button>
        </Card>
        <Card title="Pro Monthly" price="₹49" sub="per month" features={PRO_FEATURES}>
          <button className="btn-outline w-full" disabled={!!busy} onClick={() => buy('pro_monthly')}>{busy === 'pro_monthly' ? 'Opening…' : 'Get Pro Monthly'}</button>
        </Card>
        <Card title="Pro Yearly" price="₹399" sub="per year · ₹33.25/month" features={['Everything in Pro Monthly', 'Save ₹189 vs monthly', 'Best for job seekers all year']} highlight>
          <button className="btn-primary w-full" disabled={!!busy} onClick={() => buy('pro_yearly')}>{busy === 'pro_yearly' ? 'Opening…' : 'Get Pro Yearly'}</button>
        </Card>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        Pro plans are one-time UPI/card payments — no auto-debit. “Unlimited” means unlimited resumes for personal use, with fair-use limits to stop bots.
      </p>
    </div>
  );
}

function Card({ title, price, sub, features, children, highlight }: { title: string; price: string; sub: string; features: string[]; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`card relative flex flex-col p-5 ${highlight ? 'border-brand-500 ring-2 ring-brand-500' : ''}`}>
      {highlight && <span className="badge absolute -top-3 left-5 bg-brand-600 text-white">BEST VALUE</span>}
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold">{price}</span>
        <span className="text-sm text-slate-500">{sub}</span>
      </div>
      <ul className="my-4 flex-1 space-y-2 text-sm text-slate-700">
        {features.map((f) => (
          <li key={f} className="flex gap-2"><span className="text-green-600">✓</span>{f}</li>
        ))}
      </ul>
      {children}
    </div>
  );
}
