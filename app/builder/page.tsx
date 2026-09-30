import { supabaseServer, getUser, supabaseAdmin } from '@/lib/supabase/server';
import { getStatus } from '@/lib/status';
import Builder from '@/components/Builder';
import type { Job, Qualification, Template, ResumeData } from '@/lib/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create Resume' };

export default async function BuilderPage({ searchParams }: { searchParams: Promise<{ edit?: string; job?: string }> }) {
  const sp = await searchParams;
  const sb = await supabaseServer();
  const user = await getUser();
  const [jobs, quals, tpls, status] = await Promise.all([
    sb.from('jobs').select('*').eq('is_active', true).order('sort_order'),
    sb.from('qualifications').select('*').eq('is_active', true).order('sort_order'),
    sb.from('templates').select('*').eq('is_active', true).order('sort_order'),
    getStatus(user),
  ]);

  let edit: { id: string; data: ResumeData } | null = null;
  if (sp.edit) {
    if (!user) redirect(`/login?next=${encodeURIComponent('/builder?edit=' + sp.edit)}`);
    const { data } = await supabaseAdmin().from('resumes').select('id, resume_data').eq('id', sp.edit).eq('user_id', user!.id).maybeSingle();
    if (data) edit = { id: data.id, data: data.resume_data as ResumeData };
  }

  return (
    <Builder
      jobs={(jobs.data || []) as Job[]}
      qualifications={(quals.data || []) as Qualification[]}
      templates={(tpls.data || []) as Template[]}
      initialStatus={status}
      edit={edit}
      presetJob={sp.job || null}
    />
  );
}
