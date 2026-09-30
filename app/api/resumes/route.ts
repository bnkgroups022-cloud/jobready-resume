import { getUser, supabaseAdmin } from '@/lib/supabase/server';
import { candidateLevel } from '@/lib/engine';
import { sanitizeResume, missingRequired } from '@/lib/validate';
import { cleanDevice, ipHash, json } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERRORS: Record<string, [number, string]> = {
  PAYMENT_REQUIRED: [402, 'Your free resume is already used. Buy 1 resume for ₹9 or go Pro.'],
  FREE_USED_DEVICE: [402, 'A free resume was already created on this device. Buy 1 resume for ₹9 or go Pro.'],
  PRO_TEMPLATE: [403, 'This template is for Pro members. Choose a free template or upgrade to Pro.'],
  RATE_LIMIT: [429, 'Too many resumes in a short time. Please try again after some time.'],
  BLOCKED: [403, 'Your account is blocked. Please contact support.'],
  BAD_TEMPLATE: [400, 'Please choose a valid template.'],
};

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return json({ error: 'Please login first.', code: 'LOGIN' }, 401);

  const body = await req.json().catch(() => null);
  if (!body?.data) return json({ error: 'Invalid request.' }, 400);
  const data = sanitizeResume(body.data);
  const miss = missingRequired(data);
  if (miss) return json({ error: miss }, 400);

  const db = supabaseAdmin();
  const { data: job } = await db.from('jobs').select('title').eq('slug', data.jobSlug).maybeSingle();
  if (job) data.jobTitle = data.jobTitle || job.title;

  const { data: id, error } = await db.rpc('create_resume', {
    p_user: user.id,
    p_device: cleanDevice(body.deviceId),
    p_ip_hash: ipHash(req),
    p_job_role: data.jobTitle || 'Resume',
    p_job_slug: data.jobSlug,
    p_level: candidateLevel(data),
    p_template: data.template,
    p_data: data,
  });

  if (error) {
    const code = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (code) return json({ error: ERRORS[code][1], code }, ERRORS[code][0]);
    console.error('create_resume:', error.message);
    return json({ error: 'Could not create resume. Please try again.' }, 500);
  }
  return json({ id });
}
