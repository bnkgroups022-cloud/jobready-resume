'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { ResumeData } from '@/lib/types';
import type { Readiness } from '@/lib/engine';
import { downloadBlob, fileSafe } from '@/lib/client';
import ResumeView from './ResumeView';
import ScaledSheet from './ScaledSheet';
import Paywall from './Paywall';

type Props = {
  id: string; data: ResumeData; template: string; templateName: string; accent?: string; isNew: boolean; isPro: boolean;
  level: string; readiness: Readiness | null; tips: string[]; tipCount: number; createdAt: string;
};

export default function ResumeActions(p: Props) {
  const [busy, setBusy] = useState<'pdf' | 'word' | null>(null);
  const [err, setErr] = useState('');
  const [paywall, setPaywall] = useState<string | null>(null);
  const base = `${fileSafe(p.data.personal.fullName)}_${fileSafe(p.data.jobTitle)}_Resume`;

  async function pdf() {
    setErr(''); setBusy('pdf');
    try {
      const { makePdfBlob } = await import('@/lib/export/pdf');
      downloadBlob(await makePdfBlob(p.data, p.template, p.accent), `${base}.pdf`);
    } catch (e) { console.error(e); setErr('PDF could not be created. Try Print → Save as PDF.'); }
    setBusy(null);
  }
  async function word() {
    setErr(''); setBusy('word');
    try {
      const { makeDocxBlob } = await import('@/lib/export/docx');
      downloadBlob(await makeDocxBlob(p.data, p.template, p.accent), `${base}.docx`);
    } catch (e) { console.error(e); setErr('Word file could not be created. Please try again.'); }
    setBusy(null);
  }

  const r = p.readiness;
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 print:hidden">
        {p.isNew && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
            <p className="font-bold">🎉 Your resume is ready!</p>
            <p className="text-sm">Download it below. It is saved in “My Resumes”.</p>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="order-2 lg:order-1">
            <ScaledSheet><ResumeView data={p.data} template={p.template} accent={p.accent} /></ScaledSheet>
          </div>

          <div className="order-1 space-y-4 lg:order-2">
            <div className="card space-y-3 p-5">
              <h1 className="text-lg font-bold">{p.data.jobTitle} Resume</h1>
              <p className="text-xs text-slate-500">{p.templateName} · {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="grid grid-cols-3 gap-2">
                <button className="btn-primary flex-col py-3" onClick={pdf} disabled={!!busy}><span className="text-lg">⬇</span>{busy === 'pdf' ? '…' : 'PDF'}</button>
                <button className="btn-outline flex-col py-3" onClick={word} disabled={!!busy}><span className="text-lg">📄</span>{busy === 'word' ? '…' : 'Word'}</button>
                <button className="btn-outline flex-col py-3" onClick={() => window.print()}><span className="text-lg">🖨</span>Print</button>
              </div>
              {err && <p className="text-sm text-red-700">{err}</p>}
              <div className="flex gap-2">
                {p.isPro ? (
                  <Link href={`/builder?edit=${p.id}`} className="btn-outline flex-1">✏️ Edit</Link>
                ) : (
                  <button className="btn-outline flex-1" onClick={() => setPaywall('Editing saved resumes is a Pro feature.')}>✏️ Edit 🔒</button>
                )}
                <Link href="/builder" className="btn-outline flex-1">+ New Resume</Link>
              </div>
            </div>

            {r && (
              <div className="card p-5">
                <h2 className="text-lg font-bold">Am I Ready for This Job?</h2>
                <p className="mt-1 text-sm text-slate-500">Job: <b className="text-slate-800">{r.job}</b> · Level: {p.level}</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li>{r.qualification.ok ? '✅' : '⚠️'} Qualification: {r.qualification.label} <span className="text-slate-500">({r.qualification.note})</span></li>
                  {r.skills.map((s) => <li key={s.name}>{s.ok ? '✅' : '⚠️'} {s.name}{s.ok ? '' : ': Not provided'}</li>)}
                  {r.typing.needed && <li>{r.typing.value ? '✅' : '⚠️'} Typing: {r.typing.value || 'Not provided'}</li>}
                  <li>ℹ️ Experience: {r.experience}</li>
                </ul>
                <div className="mt-3">
                  <div className="flex justify-between text-sm font-semibold"><span>Profile match</span><span>{r.matchPercent}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-green-500" style={{ width: `${r.matchPercent}%` }} /></div>
                </div>
                <p className={`mt-3 text-sm font-semibold ${r.qualification.ok ? 'text-green-700' : 'text-amber-700'}`}>{r.summary}</p>
                {r.learn.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold">Suggested skills to learn:</p>
                    <div className="mt-2 flex flex-wrap gap-2">{r.learn.map((l) => <span key={l} className="chip border-slate-200 bg-slate-50">{l}</span>)}</div>
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-500">This is only a qualification & skill match to help you improve. It does not guarantee selection.</p>
              </div>
            )}

            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold">Resume improvement tips {!p.isPro && <span className="badge bg-amber-100 text-amber-800">PRO</span>}</h2>
              {p.isPro ? (
                p.tips.length ? (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">{p.tips.map((t) => <li key={t}>{t}</li>)}</ul>
                ) : <p className="mt-2 text-sm text-green-700">Great! No major improvements found.</p>
              ) : (
                <button onClick={() => setPaywall('Unlock personalised resume improvement tips with Pro.')} className="mt-3 w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900">
                  🔒 {p.tipCount} improvement tip{p.tipCount === 1 ? '' : 's'} found for your resume — unlock with Pro
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print copy (full size, no scaling) */}
      <div className="hidden print:block">
        <ResumeView data={p.data} template={p.template} accent={p.accent} />
      </div>

      {paywall && <Paywall reason={paywall} proOnly onClose={() => setPaywall(null)} onPaid={() => window.location.reload()} />}
    </>
  );
}
