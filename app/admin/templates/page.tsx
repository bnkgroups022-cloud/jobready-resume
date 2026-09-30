import { supabaseAdmin } from '@/lib/supabase/server';
import { ADMIN_TABLES } from '@/lib/admin';
import { AdminTemplateList } from '@/components/AdminSimpleLists';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data } = await supabaseAdmin().from('templates').select('*').order('sort_order');
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Templates</h1>
      <p className="mb-4 text-sm text-slate-600">Rename, recolour, make Pro/Free or hide templates.</p>
      <AdminTemplateList rows={data || []} fields={ADMIN_TABLES.templates.fields} />
    </div>
  );
}
