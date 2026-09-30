import PricingCards from '@/components/PricingCards';

export const metadata = { title: 'Pricing' };

export default function Pricing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-center text-3xl font-extrabold">Plans & Pricing</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">1st resume FREE → then ₹9 per resume, or go Pro.</p>
      <PricingCards />
    </div>
  );
}
