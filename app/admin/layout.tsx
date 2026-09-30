import { missingEnv, SUPABASE_ENV } from '@/lib/env';
import SetupNotice from '@/components/SetupNotice';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

const NAV = [
  ['/admin', 'Dashboard'],
  ['/admin/jobs', 'Jobs'],
  ['/admin/qualifications', 'Qualifications'],
  ['/admin/templates', 'Templates'],
  ['/admin/payments', 'Payments'],
  ['/admin/users', 'Users'],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const missingCfg = missingEnv(SUPABASE_ENV);
  if (missingCfg.length) return <SetupNotice missing={missingCfg} />;
  if (!(await requireAdmin())) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className="chip shrink-0 border-slate-200 bg-white hover:border-brand-500">{label}</Link>
        ))}
      </div>
      {children}
    </div>
  );
}
