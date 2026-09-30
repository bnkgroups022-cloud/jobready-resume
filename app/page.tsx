import Link from 'next/link';
import PricingCards from '@/components/PricingCards';

const steps = [
  ['1', 'Select your job', 'Telecaller, Computer Operator, Teacher, Accountant and 50+ more.'],
  ['2', 'Enter qualification', 'We check basic eligibility and pick the right resume format for you.'],
  ['3', 'Fill details & skills', 'Smart suggestions for skills and career objective — no writing stress.'],
  ['4', 'Download', 'Get your resume as PDF, Word or print it directly.'],
];

const jobs = ['Telecaller', 'Computer Operator', 'Data Entry Operator', 'Sales Executive', 'Teacher', 'Accountant', 'Tally Operator', 'Receptionist', 'BPO Executive', 'Electrician', 'Graphic Designer', 'Delivery Executive', 'Front Office Executive', 'IT Support'];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-transparent">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge bg-green-100 text-green-800">First resume FREE</span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Job-ready resume in 5 minutes — <span className="text-brand-600">made for your job</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-600 sm:text-lg">
              Select a job, enter your qualification, and get the right resume format automatically. Download as PDF, Word or Print.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/builder" className="btn-primary px-6 py-3.5 text-base">Create My Resume — Free</Link>
              <Link href="/pricing" className="btn-outline px-6 py-3.5 text-base">See Plans</Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">No design skills needed · Works on mobile · Hindi-medium friendly formats</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, t, d]) => (
            <div key={n} className="card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{n}</div>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="card grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <span className="badge bg-amber-100 text-amber-800">NEW</span>
            <h2 className="mt-2 text-2xl font-bold">“Am I Ready for This Job?”</h2>
            <p className="mt-2 text-slate-600">
              After your resume is ready, see how your qualification and skills match the job — and which skills to learn next. Honest matching, no fake promises.
            </p>
            <Link href="/builder" className="btn-primary mt-5">Check my readiness</Link>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold">Job: Computer Operator</p>
            <ul className="mt-2 space-y-1.5">
              <li>✅ Qualification: 12th Pass</li>
              <li>✅ Computer Skills: MS Office</li>
              <li>⚠️ Typing: Not provided</li>
              <li>ℹ️ Experience: Fresher</li>
            </ul>
            <p className="mt-3 font-semibold text-green-700">Resume Match: Basic eligibility met</p>
            <p className="mt-2 text-slate-600">Suggested to learn: MS Excel · Typing · Basic Internet</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold">Resumes for 50+ jobs</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {jobs.map((j) => <span key={j} className="chip border-slate-200 bg-white">{j}</span>)}
          <span className="chip border-brand-200 bg-brand-50 text-brand-700">+ many more</span>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold">Simple pricing</h2>
        <p className="mb-6 mt-1 text-center text-slate-600">First resume free. Pay only if you need more.</p>
        <PricingCards />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold">FAQ</h2>
        <div className="mt-5 space-y-3">
          {[
            ['Is the first resume really free?', 'Yes. Your first resume is free with PDF, Word and Print download. One free resume per person/device.'],
            ['What if I need a resume for another job?', 'Pay ₹9 for one more resume, or take Pro (₹49/month or ₹399/year) for unlimited resumes for personal use.'],
            ['Will this guarantee me a job?', 'No tool can guarantee a job. We help you make a clean, job-specific resume and show which skills to improve.'],
            ['Is Pro auto-renewed?', 'No. Pro is a one-time payment. When it ends, you can renew if you want.'],
            ['Can I edit my resume later?', 'Pro members can edit any saved resume anytime.'],
          ].map(([q, a]) => (
            <details key={q} className="card p-4">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
