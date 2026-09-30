'use client';
import AdminCrud from './AdminCrud';
import type { Field } from '@/lib/types';
export default function AdminJobsList({ rows, fields }: { rows: any[]; fields: Field[] }) {
  return <AdminCrud table="jobs" idKey="id" rows={rows} fields={fields} titleKey="title" subtitle={(r) => `${r.category} · min rank ${r.min_qualification_rank} · ${r.key_skills?.length || 0} key skills`} />;
}
