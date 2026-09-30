import { getUser, supabaseAdmin } from '@/lib/supabase/server';
import { getStatus } from '@/lib/status';
import { candidateLevel } from '@/lib/engine';
import { sanitizeResume, missingRequired } from '@/lib/validate';
import { json } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Edit resume (Pro feature)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return json({ error: 'Please login first.' }, 401);
  const status = await getStatus(user);
  if (!status.isPro) return json({ error: 'Resume editing is a Pro feature.', code: 'PRO_REQUIRED' }, 403);

  const body = await req.json().catch(() => null);
  const data = sanitizeResume(body?.data);
  const miss = missingRequired(data);
  if (miss) return json({ error: miss }, 400);

  const db = supabaseAdmin();
  const { data: tpl } = await db.from('templates').select('slug').eq('slug', data.template).eq('is_active', true).maybeSingle();
  if (!tpl) return json({ error: 'Please choose a valid template.' }, 400);

  const { data: row, error } = await db
    .from('resumes')
    .update({
      resume_data: data,
      template: data.template,
      job_role: data.jobTitle || 'Resume',
      job_slug: data.jobSlug,
      candidate_level: candidateLevel(data),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
  if (error || !row) return json({ error: 'Resume not found.' }, 404);
  return json({ id: row.id });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return json({ error: 'Please login first.' }, 401);
  const { error } = await supabaseAdmin().from('resumes').delete().eq('id', id).eq('user_id', user.id);
  if (error) return json({ error: 'Could not delete.' }, 500);
  return json({ ok: true });
}
