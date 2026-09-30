import { SERVER_ENV, hasEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/server';
import { json } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deployment check: open https://resume.brightwayjobs.in/api/health
// Shows ONLY whether each variable is set (true/false) — never the values.
export async function GET() {
  const env = Object.fromEntries(SERVER_ENV.map((n) => [n, hasEnv(n)]));
  let database: string = 'not checked';
  if (hasEnv('NEXT_PUBLIC_SUPABASE_URL') && hasEnv('SUPABASE_SERVICE_ROLE_KEY')) {
    try {
      const { count, error } = await supabaseAdmin().from('jobs').select('id', { count: 'exact', head: true });
      database = error ? `error: run supabase/schema.sql (${error.code || 'unknown'})` : `ok (${count ?? 0} jobs)`;
    } catch {
      database = 'error: cannot reach Supabase';
    }
  }
  const missing = SERVER_ENV.filter((n) => !env[n]);
  return json({ ok: missing.length === 0 && database.startsWith('ok'), missing, env, database });
}
