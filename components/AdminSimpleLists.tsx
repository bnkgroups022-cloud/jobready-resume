'use client';
import AdminCrud from './AdminCrud';
import type { Field } from '@/lib/admin';
export function AdminQualList({ rows, fields }: { rows: any[]; fields: Field[] }) {
  return <AdminCrud table="qualifications" idKey="id" rows={rows} fields={fields} titleKey="name" subtitle={(r) => `${r.group_name} · rank ${r.rank}`} />;
}
export function AdminTemplateList({ rows, fields }: { rows: any[]; fields: Field[] }) {
  return <AdminCrud table="templates" idKey="slug" rows={rows} fields={fields} titleKey="name" allowAdd={false} allowDelete={false} subtitle={(r) => `${r.slug} · ${r.accent_color} · ${r.description || ''}`} />;
}
