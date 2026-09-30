import { requireAdmin, ADMIN_TABLES } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { json } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return json({ error: 'Not allowed' }, 403);
  const b = await req.json().catch(() => null);
  const cfg = ADMIN_TABLES[b?.table];
  if (!cfg) return json({ error: 'Bad table' }, 400);
  const db = supabaseAdmin();

  if (b.action === 'delete') {
    const { error } = await db.from(b.table).delete().eq(cfg.id, b.id);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }

  const row: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const v = b.row?.[f.key];
    if (f.type === 'number') row[f.key] = Number(v) || 0;
    else if (f.type === 'bool') row[f.key] = !!v;
    else if (f.type === 'list') row[f.key] = (Array.isArray(v) ? v : String(v || '').split('\n')).map((s: string) => String(s).trim()).filter(Boolean);
    else row[f.key] = v === undefined || v === null ? null : String(v).trim();
    if (f.required && (row[f.key] === null || row[f.key] === '')) return json({ error: `${f.label} is required` }, 400);
  }
  if (b.table === 'jobs') row.slug = String(row.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (b.id) {
    const { error } = await db.from(b.table).update(row).eq(cfg.id, b.id);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  if (b.table === 'templates') return json({ error: 'New template layouts need code. Edit existing templates instead.' }, 400);
  const { error } = await db.from(b.table).insert(row);
  return error ? json({ error: error.message }, 400) : json({ ok: true });
}
