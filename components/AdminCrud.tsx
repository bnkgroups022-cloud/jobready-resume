'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Field } from '@/lib/admin';

type Props = { table: string; idKey: string; rows: any[]; fields: Field[]; titleKey: string; subtitle?: (r: any) => string; allowAdd?: boolean; allowDelete?: boolean };

export default function AdminCrud({ table, idKey, rows, fields, titleKey, subtitle, allowAdd = true, allowDelete = true }: Props) {
  const router = useRouter();
  const [edit, setEdit] = useState<{ id: string | null; row: any } | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const blank = () => Object.fromEntries(fields.map((f) => [f.key, f.type === 'bool' ? true : f.type === 'list' ? [] : f.type === 'number' ? 100 : f.type === 'color' ? '#1f3a8a' : '']));
  const list = rows.filter((r) => String(r[titleKey] || '').toLowerCase().includes(q.toLowerCase()));

  async function save() {
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/crud', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table, id: edit!.id, row: edit!.row }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || 'Save failed');
    setEdit(null); router.refresh();
  }
  async function remove(id: string) {
    if (!window.confirm('Delete permanently?')) return;
    const r = await fetch('/api/admin/crud', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table, action: 'delete', id }) });
    if (r.ok) router.refresh(); else alert((await r.json()).error);
  }
  const set = (k: string, v: any) => setEdit((e) => (e ? { ...e, row: { ...e.row, [k]: v } } : e));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        {allowAdd && <button className="btn-primary shrink-0" onClick={() => setEdit({ id: null, row: blank() })}>+ Add</button>}
      </div>
      <div className="card divide-y">
        {list.map((r) => (
          <div key={r[idKey]} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{r[titleKey]} {r.is_active === false && <span className="badge bg-slate-200 text-slate-600">inactive</span>} {r.is_pro && <span className="badge bg-amber-100 text-amber-800">PRO</span>}</p>
              {subtitle && <p className="truncate text-xs text-slate-500">{subtitle(r)}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <button className="btn-outline px-3 py-1.5" onClick={() => setEdit({ id: r[idKey], row: { ...r } })}>Edit</button>
              {allowDelete && <button className="btn-ghost px-2 text-red-600" onClick={() => remove(r[idKey])}>🗑</button>}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="p-4 text-sm text-slate-500">Nothing found.</p>}
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setEdit(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">{edit.id ? 'Edit' : 'Add'} {table.replace(/s$/, '')}</h2>
            <div className="space-y-3">
              {fields.map((f) => (
                <div key={f.key}>
                  {f.type === 'bool' ? (
                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!edit.row[f.key]} onChange={(e) => set(f.key, e.target.checked)} /> {f.label}</label>
                  ) : (
                    <>
                      <label className="label">{f.label}</label>
                      {f.type === 'list' ? (
                        <textarea className="input min-h-[90px]" value={(edit.row[f.key] || []).join('\n')} onChange={(e) => set(f.key, e.target.value.split('\n'))} />
                      ) : f.type === 'textarea' ? (
                        <textarea className="input min-h-[80px]" value={edit.row[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
                      ) : f.type === 'color' ? (
                        <div className="flex gap-2"><input type="color" className="h-11 w-14 rounded-lg border" value={edit.row[f.key] || '#000000'} onChange={(e) => set(f.key, e.target.value)} /><input className="input" value={edit.row[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} /></div>
                      ) : (
                        <input className="input" type={f.type === 'number' ? 'number' : 'text'} value={edit.row[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {err && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
            <div className="mt-5 flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn-primary flex-1" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
