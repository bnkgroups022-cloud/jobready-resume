'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Job, Qualification, Template, ResumeData, UserStatus } from '@/lib/types';
import {
  candidateLevel, eligibility, emptyResume, generateObjectives, LEVEL_LABELS, recommendFormat, skillMatches, rankLabel,
} from '@/lib/engine';
import { clearDraft, getDeviceId, loadDraft, saveDraft } from '@/lib/client';
import ResumeView from './ResumeView';
import ScaledSheet from './ScaledSheet';
import Paywall from './Paywall';

type Props = {
  jobs: Job[];
  qualifications: Qualification[];
  templates: Template[];
  initialStatus: UserStatus;
  edit: { id: string; data: ResumeData } | null;
  presetJob: string | null;
};

const STEPS = ['Job', 'Qualification', 'Personal', 'Skills & Experience', 'Objective & Format', 'Preview'];

export default function Builder({ jobs, qualifications, templates, initialStatus, edit, presetJob }: Props) {
  const router = useRouter();
  const [d, setD] = useState<ResumeData>(() => edit?.data || emptyResume());
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(!!edit);
  const [status, setStatus] = useState<UserStatus>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [paywall, setPaywall] = useState<{ reason: string; proOnly?: boolean; thenGenerate?: boolean } | null>(null);

  // restore draft (new resume only)
  useEffect(() => {
    if (edit) return;
    const draft = loadDraft();
    const params = new URLSearchParams(window.location.search);
    if (draft?.d) {
      setD({ ...emptyResume(), ...draft.d, personal: { ...emptyResume().personal, ...draft.d.personal } });
      setStep(Number(params.get('step')) || draft.step || 0);
    }
    if (presetJob) {
      const j = jobs.find((x) => x.slug === presetJob);
      if (j) { setD((p) => ({ ...p, jobSlug: j.slug, jobTitle: j.title })); setStep(1); }
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (ready && !edit) saveDraft(d, step); }, [d, step, ready, edit]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const job = useMemo(() => jobs.find((j) => j.slug === d.jobSlug) || null, [jobs, d.jobSlug]);
  const level = candidateLevel(d);
  const format = recommendFormat(level);
  const tpl = templates.find((t) => t.slug === d.template) || templates[0];
  const up = (patch: Partial<ResumeData>) => setD((p) => ({ ...p, ...patch }));
  const upP = (patch: Partial<ResumeData['personal']>) => setD((p) => ({ ...p, personal: { ...p.personal, ...patch } }));

  function validate(s: number): string {
    if (s === 0 && !d.jobSlug) return 'Please select a job.';
    if (s === 1 && !d.qualificationName) return 'Please select your highest qualification.';
    if (s === 2) {
      if (!d.personal.fullName.trim()) return 'Please enter your full name.';
      if (!/^[6-9]\d{9}$/.test(d.personal.phone.replace(/\D/g, '').slice(-10))) return 'Please enter a valid 10-digit mobile number.';
    }
    return '';
  }

  function next() {
    const e = validate(step);
    setErr(e);
    if (e) return;
    if (step === 3 && !d.objective.trim()) up({ objective: generateObjectives(job, d)[0] });
    if (step === 3 && !d.template) up({ template: status.isPro ? format.template : format.freeTemplate });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function refreshStatus() {
    const r = await fetch('/api/me', { cache: 'no-store' });
    if (r.ok) setStatus(await r.json());
  }

  async function generate(afterPayment = false) {
    setErr('');
    for (let s = 0; s < 3; s++) {
      const e = validate(s);
      if (e) { setStep(s); setErr(e); return; }
    }
    if (!status.loggedIn) {
      saveDraft(d, 5);
      router.push(`/login?mode=signup&next=${encodeURIComponent('/builder?step=5')}`);
      return;
    }
    if (!afterPayment && tpl?.is_pro && !status.isPro) {
      setPaywall({ reason: `"${tpl.name}" is a Pro template. Upgrade to Pro, or go back and choose a free template.`, proOnly: true, thenGenerate: true });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(edit ? `/api/resumes/${edit.id}` : '/api/resumes', {
        method: edit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...d, template: d.template || format.freeTemplate }, deviceId: getDeviceId() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { saveDraft(d, 5); router.push(`/login?next=${encodeURIComponent('/builder?step=5')}`); return; }
      if (r.status === 402) { setPaywall({ reason: j.error, thenGenerate: true }); return; }
      if (r.status === 403 && (j.code === 'PRO_TEMPLATE' || j.code === 'PRO_REQUIRED')) { setPaywall({ reason: j.error, proOnly: true, thenGenerate: true }); return; }
      if (!r.ok) { setErr(j.error || 'Something went wrong.'); return; }
      if (!edit) clearDraft();
      router.push(`/resume/${j.id}${edit ? '' : '?new=1'}`);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="p-10 text-center text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{edit ? 'Edit resume · ' : ''}Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
          {job && <span className="hidden text-slate-500 sm:block">{job.title}</span>}
        </div>
        <div className="mt-2 flex gap-1">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => i < step && setStep(i)} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`} aria-label={s} />
          ))}
        </div>
      </div>

      <div className={step === 5 ? '' : 'grid gap-6 lg:grid-cols-[1fr_380px]'}>
        <div>
          {step === 0 && <StepJob jobs={jobs} value={d.jobSlug} onPick={(j) => { up({ jobSlug: j.slug, jobTitle: j.title, objective: '' }); setErr(''); setStep(1); }} />}
          {step === 1 && <StepQualification quals={qualifications} d={d} job={job} up={up} />}
          {step === 2 && <StepPersonal d={d} upP={upP} />}
          {step === 3 && <StepSkills d={d} job={job} up={up} isPro={status.isPro} onUpgrade={() => setPaywall({ reason: 'Get extra skill and responsibility suggestions with Pro.', proOnly: true })} />}
          {step === 4 && (
            <StepFormat d={d} job={job} up={up} templates={templates} isPro={status.isPro} format={format} levelLabel={LEVEL_LABELS[level]}
              onUpgrade={(reason) => setPaywall({ reason, proOnly: true })} />
          )}
          {step === 5 && (
            <StepPreview d={d} tpl={tpl} status={status} edit={!!edit} busy={busy} onGenerate={() => generate()} onBack={() => setStep(4)} />
          )}

          {err && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}

          {step < 5 && (
            <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
              {step > 0 && <button className="btn-outline flex-1 sm:flex-none" onClick={() => { setErr(''); setStep(step - 1); }}>Back</button>}
              {step > 0 && <button className="btn-primary flex-1 sm:flex-none sm:px-8" onClick={next}>{step === 4 ? 'Preview Resume' : 'Next'}</button>}
            </div>
          )}
        </div>

        {step > 0 && step < 5 && (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <p className="mb-2 text-sm font-semibold text-slate-600">Live preview</p>
              <ScaledSheet><ResumeView data={d} template={d.template} accent={tpl?.accent_color} /></ScaledSheet>
            </div>
          </aside>
        )}
      </div>

      {paywall && (
        <Paywall
          reason={paywall.reason}
          proOnly={paywall.proOnly}
          onClose={() => setPaywall(null)}
          onPaid={async () => { const go = paywall.thenGenerate; setPaywall(null); await refreshStatus(); if (go) { setStep(5); await generate(true); } }}
        />
      )}
    </div>
  );
}

/* ------------------------------ Step 1: Job ------------------------------ */
function StepJob({ jobs, value, onPick }: { jobs: Job[]; value: string; onPick: (j: Job) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const cats = ['All', ...Array.from(new Set(jobs.map((j) => j.category)))];
  const list = jobs.filter((j) => (cat === 'All' || j.category === cat) && j.title.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <div>
      <h1 className="text-2xl font-bold">Which job are you applying for?</h1>
      <p className="mt-1 text-slate-600">Your resume will be made specially for this job.</p>
      <input className="input mt-4" placeholder="Search job… e.g. Telecaller, Teacher" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white'}`}>{c}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {list.map((j) => (
          <button key={j.slug} onClick={() => onPick(j)} className={`card flex items-center justify-between p-4 text-left hover:border-brand-500 ${value === j.slug ? 'border-brand-600 ring-2 ring-brand-100' : ''}`}>
            <div>
              <div className="font-semibold">{j.title}</div>
              <div className="text-xs text-slate-500">{j.category} · Usually {rankLabel(j.min_qualification_rank)}+</div>
            </div>
            <span className="text-brand-600">›</span>
          </button>
        ))}
        {list.length === 0 && <p className="text-sm text-slate-500">No job found. Try another word.</p>}
      </div>
    </div>
  );
}

/* -------------------------- Step 2: Qualification ------------------------- */
function StepQualification({ quals, d, job, up }: { quals: Qualification[]; d: ResumeData; job: Job | null; up: (p: Partial<ResumeData>) => void }) {
  const groups = Array.from(new Set(quals.map((q) => q.group_name)));
  const el = eligibility(job, d.qualificationRank);
  function pick(name: string) {
    const q = quals.find((x) => x.name === name);
    if (!q) return;
    const edu = [...d.education];
    if (edu.length === 0) edu.push({ degree: q.name, institute: '', board: '', year: '', score: '' });
    else if (!edu[0].institute && !edu[0].year) edu[0] = { ...edu[0], degree: q.name };
    up({ qualificationName: q.name, qualificationRank: q.rank, education: edu });
  }
  const setEdu = (i: number, k: keyof ResumeData['education'][0], v: string) =>
    up({ education: d.education.map((e, j) => (j === i ? { ...e, [k]: v } : e)) });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Your highest qualification</h1>
        <p className="mt-1 text-slate-600">We use this to check eligibility and choose the best resume format.</p>
      </div>
      <div>
        <label className="label">Highest qualification</label>
        <select className="input" value={d.qualificationName} onChange={(e) => pick(e.target.value)}>
          <option value="">Select…</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {quals.filter((q) => q.group_name === g).map((q) => <option key={q.id} value={q.name}>{q.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      {d.qualificationName && (
        <div className={`rounded-2xl border p-4 text-sm ${el.status === 'eligible' ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          <p className="font-semibold">{el.status === 'eligible' ? '✅ Eligibility check passed' : '⚠️ Eligibility note'}</p>
          <p className="mt-1">{el.message}</p>
        </div>
      )}

      {d.qualificationName && (
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Education details</h2>
            <button className="btn-ghost text-brand-600" onClick={() => up({ education: [...d.education, { degree: '', institute: '', board: '', year: '', score: '' }] })}>+ Add</button>
          </div>
          <p className="mb-3 text-xs text-slate-500">Add highest first. Example: B.Com → 12th → 10th.</p>
          <div className="space-y-4">
            {d.education.map((e, i) => (
              <div key={i} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                <input className="input" placeholder="Course / Class (e.g. 12th, B.Com)" value={e.degree} onChange={(x) => setEdu(i, 'degree', x.target.value)} />
                <input className="input" placeholder="School / College" value={e.institute} onChange={(x) => setEdu(i, 'institute', x.target.value)} />
                <input className="input" placeholder="Board / University (e.g. CBSE)" value={e.board} onChange={(x) => setEdu(i, 'board', x.target.value)} />
                <div className="flex gap-2">
                  <input className="input" placeholder="Year" inputMode="numeric" value={e.year} onChange={(x) => setEdu(i, 'year', x.target.value)} />
                  <input className="input" placeholder="% / CGPA" value={e.score} onChange={(x) => setEdu(i, 'score', x.target.value)} />
                </div>
                {d.education.length > 1 && (
                  <button className="text-left text-xs text-red-600" onClick={() => up({ education: d.education.filter((_, j) => j !== i) })}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Step 3: Personal ---------------------------- */
function StepPersonal({ d, upP }: { d: ResumeData; upP: (p: Partial<ResumeData['personal']>) => void }) {
  const p = d.personal;
  const F = ({ k, label, type = 'text', ph = '', req = false }: { k: keyof ResumeData['personal']; label: string; type?: string; ph?: string; req?: boolean }) => (
    <div>
      <label className="label">{label}{req && <span className="text-red-500"> *</span>}</label>
      <input className="input" type={type} placeholder={ph} value={p[k]} onChange={(e) => upP({ [k]: e.target.value })} inputMode={k === 'phone' || k === 'pincode' ? 'numeric' : undefined} />
    </div>
  );
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Personal details</h1>
        <p className="mt-1 text-slate-600">Only name and mobile are required.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {F({ k: 'fullName', label: 'Full name', req: true, ph: 'e.g. Rahul Kumar' })}
        {F({ k: 'phone', label: 'Mobile number', req: true, ph: '10-digit mobile' })}
        {F({ k: 'email', label: 'Email', type: 'email', ph: 'name@gmail.com' })}
        {F({ k: 'city', label: 'City', ph: 'e.g. Ranchi' })}
        {F({ k: 'state', label: 'State', ph: 'e.g. Jharkhand' })}
        {F({ k: 'pincode', label: 'PIN code' })}
        <div className="sm:col-span-2">{F({ k: 'address', label: 'Full address (optional)' })}</div>
        {F({ k: 'dob', label: 'Date of birth', type: 'date' })}
        <div>
          <label className="label">Gender</label>
          <select className="input" value={p.gender} onChange={(e) => upP({ gender: e.target.value })}>
            <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        {F({ k: 'fatherName', label: "Father's name (optional)" })}
        <div>
          <label className="label">Marital status</label>
          <select className="input" value={p.maritalStatus} onChange={(e) => upP({ maritalStatus: e.target.value })}>
            <option value="">—</option><option>Unmarried</option><option>Married</option>
          </select>
        </div>
        {F({ k: 'nationality', label: 'Nationality' })}
        {F({ k: 'linkedin', label: 'LinkedIn / Portfolio (optional)' })}
      </div>
    </div>
  );
}

/* ------------------------- Step 4: Skills & Experience -------------------- */
function Chips({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => {
        const on = selected.some((x) => x.toLowerCase() === s.toLowerCase());
        return (
          <button key={s} onClick={() => onToggle(s)} className={`chip ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'}`}>
            {on ? '✓' : '+'} {s}
          </button>
        );
      })}
    </div>
  );
}

function ListInput({ label, ph, items, onChange }: { label: string; ph: string; items: string[]; onChange: (v: string[]) => void }) {
  const [v, setV] = useState('');
  const add = () => { const t = v.trim(); if (t && !items.includes(t)) onChange([...items, t]); setV(''); };
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input className="input" placeholder={ph} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button className="btn-outline" onClick={add}>Add</button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((s) => (
            <span key={s} className="chip border-slate-200 bg-slate-50">
              {s}<button className="ml-1 text-slate-400" onClick={() => onChange(items.filter((x) => x !== s))} aria-label="remove">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StepSkills({ d, job, up, isPro, onUpgrade }: { d: ResumeData; job: Job | null; up: (p: Partial<ResumeData>) => void; isPro: boolean; onUpgrade: () => void }) {
  const toggle = (s: string) => {
    const has = d.skills.some((x) => x.toLowerCase() === s.toLowerCase());
    up({ skills: has ? d.skills.filter((x) => x.toLowerCase() !== s.toLowerCase()) : [...d.skills, s] });
  };
  const setExp = (i: number, patch: Partial<ResumeData['experience'][0]>) => up({ experience: d.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const langs = ['Hindi', 'English', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Punjabi', 'Odia', 'Urdu', 'Kannada', 'Malayalam', 'Assamese'];
  const custom = d.skills.filter((s) => !(job?.key_skills || []).includes(s) && !(job?.optional_skills || []).includes(s));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Skills & experience</h1>
        <p className="mt-1 text-slate-600">Tap the skills you really have. Honest resumes get better results.</p>
      </div>

      <section className="card space-y-4 p-4">
        <div>
          <h2 className="font-semibold">Key skills for {job?.title || 'this job'}</h2>
          <p className="mb-2 text-xs text-slate-500">Employers look for these first.</p>
          <Chips items={job?.key_skills || []} selected={d.skills} onToggle={toggle} />
        </div>
        <div>
          <h2 className="flex items-center gap-2 font-semibold">More suggested skills {!isPro && <span className="badge bg-amber-100 text-amber-800">PRO</span>}</h2>
          {isPro ? (
            <div className="mt-2"><Chips items={job?.optional_skills || []} selected={d.skills} onToggle={toggle} /></div>
          ) : (
            <button onClick={onUpgrade} className="mt-2 w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900">
              🔒 {job?.optional_skills.length || 0} more job-specific skills — unlock with Pro
            </button>
          )}
        </div>
        <ListInput label="Add your own skill" ph="e.g. Canva, Hindi Typing" items={custom} onChange={(v) => up({ skills: [...d.skills.filter((s) => !custom.includes(s)), ...v] })} />
        <div>
          <label className="label">Typing speed (optional)</label>
          <input className="input" placeholder="e.g. 30 WPM English, 25 WPM Hindi" value={d.typingSpeed} onChange={(e) => up({ typingSpeed: e.target.value })} />
        </div>
        <div>
          <label className="label">Languages you can speak</label>
          <Chips items={langs} selected={d.languages} onToggle={(l) => up({ languages: d.languages.includes(l) ? d.languages.filter((x) => x !== l) : [...d.languages, l] })} />
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Work experience</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['fresher', 'experienced'] as const).map((t) => (
            <button key={t} onClick={() => up({ experienceType: t, experience: t === 'experienced' && d.experience.length === 0 ? [{ role: job?.title || '', company: '', from: '', to: '', current: false, points: [] }] : d.experience })}
              className={`rounded-xl border p-3 text-sm font-semibold ${d.experienceType === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200'}`}>
              {t === 'fresher' ? 'I am a Fresher' : 'I have Experience'}
            </button>
          ))}
        </div>
        {d.experienceType === 'experienced' && (
          <div className="space-y-4">
            {d.experience.map((e, i) => (
              <div key={i} className="space-y-2 rounded-xl bg-slate-50 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="input" placeholder="Job title / Role" value={e.role} onChange={(x) => setExp(i, { role: x.target.value })} />
                  <input className="input" placeholder="Company / Shop name" value={e.company} onChange={(x) => setExp(i, { company: x.target.value })} />
                  <div><label className="text-xs text-slate-500">From</label><input className="input" type="month" value={e.from} onChange={(x) => setExp(i, { from: x.target.value })} /></div>
                  <div><label className="text-xs text-slate-500">To</label><input className="input" type="month" value={e.to} disabled={e.current} onChange={(x) => setExp(i, { to: x.target.value })} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.current} onChange={(x) => setExp(i, { current: x.target.checked })} /> I currently work here</label>
                <div>
                  <label className="label">What did you do? (one per line)</label>
                  <textarea className="input min-h-[96px]" value={e.points.join('\n')} onChange={(x) => setExp(i, { points: x.target.value.split('\n') })} placeholder="Handled 60+ customer calls daily" />
                  {job && job.responsibilities.length > 0 && (
                    isPro ? (
                      <button className="mt-1 text-sm text-brand-600" onClick={() => setExp(i, { points: Array.from(new Set([...e.points.filter(Boolean), ...job.responsibilities])) })}>+ Add suggested responsibilities</button>
                    ) : (
                      <button className="mt-1 text-sm text-amber-700" onClick={onUpgrade}>🔒 Auto-fill responsibilities (Pro)</button>
                    )
                  )}
                </div>
                {d.experience.length > 1 && <button className="text-xs text-red-600" onClick={() => up({ experience: d.experience.filter((_, j) => j !== i) })}>Remove this job</button>}
              </div>
            ))}
            <button className="btn-outline" onClick={() => up({ experience: [...d.experience, { role: '', company: '', from: '', to: '', current: false, points: [] }] })}>+ Add another job</button>
          </div>
        )}
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Courses, achievements & hobbies (optional)</h2>
        <div className="space-y-2">
          <label className="label">Certificates / Courses</label>
          {d.certifications.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_90px_auto]">
              <input className="input" placeholder="e.g. DCA, Tally Prime" value={c.name} onChange={(x) => up({ certifications: d.certifications.map((z, j) => (j === i ? { ...z, name: x.target.value } : z)) })} />
              <input className="input hidden sm:block" placeholder="Institute" value={c.issuer} onChange={(x) => up({ certifications: d.certifications.map((z, j) => (j === i ? { ...z, issuer: x.target.value } : z)) })} />
              <input className="input hidden sm:block" placeholder="Year" value={c.year} onChange={(x) => up({ certifications: d.certifications.map((z, j) => (j === i ? { ...z, year: x.target.value } : z)) })} />
              <button className="btn-ghost text-red-600" onClick={() => up({ certifications: d.certifications.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button className="btn-outline" onClick={() => up({ certifications: [...d.certifications, { name: '', issuer: '', year: '' }] })}>+ Add course</button>
        </div>
        <ListInput label="Achievements" ph="e.g. 1st rank in school" items={d.achievements} onChange={(v) => up({ achievements: v })} />
        <ListInput label="Hobbies" ph="e.g. Reading, Cricket" items={d.hobbies} onChange={(v) => up({ hobbies: v })} />
      </section>
    </div>
  );
}

/* -------------------------- Step 5: Objective & Format --------------------- */
function StepFormat({ d, job, up, templates, isPro, format, levelLabel, onUpgrade }: {
  d: ResumeData; job: Job | null; up: (p: Partial<ResumeData>) => void; templates: Template[]; isPro: boolean;
  format: ReturnType<typeof recommendFormat>; levelLabel: string; onUpgrade: (reason: string) => void;
}) {
  const options = generateObjectives(job, d);
  const missingKey = (job?.key_skills || []).filter((s) => !skillMatches(s, d.skills));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Career objective & resume format</h1>
        <p className="mt-1 text-slate-600">We picked the best format for your profile.</p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Recommended for you</p>
        <p className="mt-1 text-lg font-bold">{format.name}</p>
        <p className="text-sm text-slate-700">Your level: <b>{levelLabel}</b>. {format.why}</p>
        {missingKey.length > 0 && <p className="mt-2 text-xs text-slate-600">Tip: key skills not added yet — {missingKey.slice(0, 3).join(', ')}.</p>}
      </section>

      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Career objective</h2>
          <button className="text-sm text-brand-600" onClick={() => up({ objective: options[0] })}>Auto-write</button>
        </div>
        <textarea className="input min-h-[110px]" value={d.objective} onChange={(e) => up({ objective: e.target.value })} placeholder="Tap Auto-write or type your own" />
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">More objective options {!isPro && <span className="badge bg-amber-100 text-amber-800">PRO</span>}</p>
          {isPro ? (
            <div className="space-y-2">
              {options.map((o, i) => (
                <button key={i} onClick={() => up({ objective: o })} className={`w-full rounded-xl border p-3 text-left text-sm ${d.objective === o ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}>{o}</button>
              ))}
            </div>
          ) : (
            <button onClick={() => onUpgrade('Get 3 job-specific career objective options with Pro.')} className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900">🔒 See 3 different objective options — Pro</button>
          )}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Choose template</h2>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => {
            const locked = t.is_pro && !isPro;
            const rec = t.slug === format.template || (!isPro && t.slug === format.freeTemplate);
            return (
              <button key={t.slug} onClick={() => up({ template: t.slug })}
                className={`relative rounded-2xl border p-3 text-left transition ${d.template === t.slug ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200 hover:border-brand-300'}`}>
                <TemplateThumb slug={t.slug} color={t.accent_color} />
                <div className="mt-2 flex items-center gap-1 text-sm font-semibold">{t.name} {locked && '🔒'}</div>
                <div className="text-xs text-slate-500">{t.description}</div>
                <div className="mt-1 flex gap-1">
                  {t.is_pro ? <span className="badge bg-amber-100 text-amber-800">PRO</span> : <span className="badge bg-green-100 text-green-800">FREE</span>}
                  {rec && <span className="badge bg-brand-100 text-brand-700">Recommended</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.declaration} onChange={(e) => up({ declaration: e.target.checked })} /> Add declaration at the end</label>
    </div>
  );
}

function TemplateThumb({ slug, color }: { slug: string; color: string }) {
  const line = (w: string, c = '#e5e7eb') => <div style={{ height: 4, width: w, background: c, borderRadius: 2, marginBottom: 4 }} />;
  if (slug === 'modern')
    return (
      <div className="flex h-24 overflow-hidden rounded-lg border bg-white">
        <div style={{ width: '35%', background: color }} className="p-2">{line('80%', '#ffffffaa')}{line('60%', '#ffffff77')}{line('70%', '#ffffff77')}</div>
        <div className="flex-1 p-2">{line('70%', color)}{line('90%')}{line('80%')}{line('60%', color)}{line('90%')}</div>
      </div>
    );
  if (slug === 'professional')
    return (
      <div className="h-24 overflow-hidden rounded-lg border bg-white">
        <div style={{ background: color, height: 26 }} className="p-2">{line('50%', '#ffffffcc')}</div>
        <div className="p-2">{line('40%', color)}{line('90%')}{line('80%')}{line('40%', color)}</div>
      </div>
    );
  return (
    <div className="h-24 overflow-hidden rounded-lg border bg-white p-2">
      <div className={slug === 'classic' ? 'flex flex-col items-center' : ''}>{line('50%', slug === 'classic' ? color : '#111')}{line('70%')}</div>
      {line('35%', slug === 'classic' ? color : '#9ca3af')}{line('90%')}{line('85%')}{line('35%', slug === 'classic' ? color : '#9ca3af')}{line('80%')}
    </div>
  );
}

/* ----------------------------- Step 6: Preview ----------------------------- */
function StepPreview({ d, tpl, status, edit, busy, onGenerate, onBack }: {
  d: ResumeData; tpl: Template | undefined; status: UserStatus; edit: boolean; busy: boolean; onGenerate: () => void; onBack: () => void;
}) {
  let note: string;
  if (edit) note = 'Save changes to your resume.';
  else if (!status.loggedIn) note = 'Create a free account to generate and download your resume.';
  else if (status.isPro) note = 'Pro: unlimited resumes for personal use.';
  else if (!status.freeUsed) note = 'This is your 1 FREE resume.';
  else if (status.credits > 0) note = `This will use 1 of your ${status.credits} resume credit(s).`;
  else note = 'Free resume already used. Next resume: ₹9, or go Pro.';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="order-2 lg:order-1">
        <ScaledSheet><ResumeView data={d} template={d.template} accent={tpl?.accent_color} /></ScaledSheet>
      </div>
      <div className="order-1 lg:order-2">
        <div className="card sticky top-20 space-y-3 p-5">
          <h1 className="text-xl font-bold">Your resume is ready to generate</h1>
          <p className="text-sm text-slate-600">{d.jobTitle} · {tpl?.name}</p>
          <p className="rounded-xl bg-slate-50 p-3 text-sm">{note}</p>
          {tpl?.is_pro && !status.isPro && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">“{tpl.name}” is a Pro template. Go back to choose a free one, or upgrade.</p>}
          <button className="btn-primary w-full py-3.5 text-base" disabled={busy} onClick={onGenerate}>
            {busy ? 'Generating…' : edit ? 'Save Changes' : status.loggedIn ? 'Generate Resume' : 'Sign up & Generate'}
          </button>
          <button className="btn-outline w-full" onClick={onBack}>Back to edit</button>
          <p className="text-center text-xs text-slate-500">After generating: download PDF, Word or Print.</p>
        </div>
      </div>
    </div>
  );
}
