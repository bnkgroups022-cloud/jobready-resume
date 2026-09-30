import { supabaseAdmin } from '@/lib/supabase/server';
import { ADMIN_TABLES } from '@/lib/admin';
import { AdminQualList } from '@/components/AdminSimpleLists';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data } = await supabaseAdmin().from('qualifications').select('*').order('sort_order');
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Qualifications ({data?.length || 0})</h1>
      <p className="mb-4 text-sm text-slate-600">Rank decides eligibility: 1 Below 10th · 2 10th · 3 12th/ITI · 4 Diploma · 5 Graduate · 6 Post Graduate.</p>
      <AdminQualList rows={data || []} fields={ADMIN_TABLES.qualifications.fields} />
    </div>
  );
}
