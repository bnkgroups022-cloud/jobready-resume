import { supabaseAdmin } from '@/lib/supabase/server';
import { ADMIN_TABLES } from '@/lib/admin';
import AdminJobsList from '@/components/AdminJobsList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data } = await supabaseAdmin().from('jobs').select('*').order('sort_order');
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Jobs ({data?.length || 0})</h1>
      <p className="mb-4 text-sm text-slate-600">Add or edit job roles. Changes appear in the resume builder immediately.</p>
      <AdminJobsList rows={data || []} fields={ADMIN_TABLES.jobs.fields} />
    </div>
  );
}
