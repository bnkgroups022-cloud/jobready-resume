import { getUser } from '@/lib/supabase/server';
import { getStatus } from '@/lib/status';
import { json } from '@/lib/request';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  return json(await getStatus(user));
}
