import { notFound } from 'next/navigation';
import { getUser, supabaseAdmin } from '@/lib/supabase/server';
import { getStatus } from '@/lib/status';
import { readiness, improvementSuggestions, LEVEL_LABELS, candidateLevel } from '@/lib/engine';
import type { Job, ResumeData } from '@/lib/types';
import ResumeActions from '@/components/ResumeActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Resume' };

export default async function ResumePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getUser();
  if (!user) notFound();
  const db = supabaseAdmin();
  const { data: row } = await db.from('resumes').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!row) notFound();
  const data = row.resume_data as ResumeData;
  const [{ data: job }, { data: tpl }, status] = await Promise.all([
    db.from('jobs').select('*').eq('slug', row.job_slug || '').maybeSingle(),
    db.from('templates').select('accent_color, name').eq('slug', row.template).maybeSingle(),
    getStatus(user),
  ]);
  const ready = job ? readiness(job as Job, data) : null;
  const tips = improvementSuggestions(data, (job as Job) || null);

  return (
    <ResumeActions
      id={row.id}
      data={data}
      template={row.template}
      templateName={tpl?.name || row.template}
      accent={tpl?.accent_color}
      isNew={sp.new === '1'}
      isPro={status.isPro}
      level={LEVEL_LABELS[candidateLevel(data)]}
      readiness={ready}
      tips={status.isPro ? tips : []}
      tipCount={tips.length}
      createdAt={row.created_at}
    />
  );
}
