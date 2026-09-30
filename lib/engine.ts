// JobReady Resume — rule-based engines (no AI cost).
// Candidate Level Engine, Eligibility, Format Recommendation, Objective Generator,
// Job Readiness Check and Resume Improvement Suggestions.
import type { CandidateLevel, Job, ResumeData, SectionKey } from './types';

export const RANK_LABELS: Record<number, string> = {
  1: 'Below 10th',
  2: '10th Pass',
  3: '12th Pass / ITI',
  4: 'Diploma',
  5: 'Graduate',
  6: 'Post Graduate',
};
export const rankLabel = (r: number) => RANK_LABELS[r] || 'Any';

export function emptyResume(): ResumeData {
  return {
    jobSlug: '',
    jobTitle: '',
    qualificationName: '',
    qualificationRank: 0,
    personal: {
      fullName: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
      dob: '', gender: '', fatherName: '', maritalStatus: '', nationality: 'Indian', linkedin: '',
    },
    objective: '',
    education: [],
    skills: [],
    typingSpeed: '',
    languages: ['Hindi', 'English'],
    experienceType: 'fresher',
    experience: [],
    certifications: [],
    achievements: [],
    hobbies: [],
    declaration: true,
    template: '',
  };
}

// ---------- Experience ----------
function monthIndex(v: string): number | null {
  // accepts "YYYY-MM" (month input) or "YYYY"
  const m = /^(\d{4})(?:-(\d{1,2}))?/.exec((v || '').trim());
  if (!m) return null;
  return Number(m[1]) * 12 + (m[2] ? Number(m[2]) - 1 : 0);
}

export function experienceMonths(d: Pick<ResumeData, 'experience' | 'experienceType'>, now = new Date()): number {
  if (d.experienceType !== 'experienced') return 0;
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  let total = 0;
  for (const e of d.experience || []) {
    const a = monthIndex(e.from);
    const b = e.current ? nowIdx : monthIndex(e.to);
    if (a !== null && b !== null && b >= a) total += b - a + 1;
  }
  return total;
}

export function experienceText(months: number): string {
  if (months <= 0) return 'less than 1 year';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m > 1 ? 's' : ''}`;
  if (m === 0) return `${y} year${y > 1 ? 's' : ''}`;
  return `${y}+ year${y > 1 ? 's' : ''}`;
}

export function formatMonth(v: string): string {
  const m = /^(\d{4})-(\d{1,2})/.exec(v || '');
  if (!m) return v || '';
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[Number(m[2]) - 1] || ''} ${m[1]}`;
}

// ---------- Candidate Level Engine ----------
export function candidateLevel(d: ResumeData): CandidateLevel {
  const hasRealExp = d.experienceType === 'experienced' && (d.experience || []).some((e) => e.role || e.company);
  if (hasRealExp && experienceMonths(d) >= 6) return 'experienced';
  if (d.qualificationRank >= 4) return 'graduate_fresher';
  return 'school_fresher';
}

export const LEVEL_LABELS: Record<CandidateLevel, string> = {
  school_fresher: 'Fresher (10th / 12th / ITI)',
  graduate_fresher: 'Fresher (Diploma / Graduate)',
  experienced: 'Experienced',
};

// ---------- Eligibility ----------
export type Eligibility = { status: 'eligible' | 'below' | 'unknown'; message: string };

export function eligibility(job: Pick<Job, 'title' | 'min_qualification_rank'> | null, rank: number): Eligibility {
  if (!job || !rank) return { status: 'unknown', message: 'Select job and qualification to check eligibility.' };
  if (rank >= job.min_qualification_rank) {
    return { status: 'eligible', message: `Basic qualification met for ${job.title} (usually ${rankLabel(job.min_qualification_rank)} or above).` };
  }
  return {
    status: 'below',
    message: `${job.title} usually needs ${rankLabel(job.min_qualification_rank)} or above. You can still make a resume — highlight your skills and experience.`,
  };
}

// ---------- Format Recommendation Engine ----------
export type FormatRecommendation = {
  key: 'fresher_simple' | 'skills_based' | 'chronological';
  name: string;
  why: string;
  order: SectionKey[];
  template: string; // best template
  freeTemplate: string; // best free template
};

export function recommendFormat(level: CandidateLevel): FormatRecommendation {
  if (level === 'experienced') {
    return {
      key: 'chronological',
      name: 'Experience-First (Chronological)',
      why: 'You have work experience, so recruiters should see your latest job first.',
      order: ['objective', 'experience', 'skills', 'education', 'certifications', 'achievements', 'languages', 'personal', 'declaration'],
      template: 'professional',
      freeTemplate: 'classic',
    };
  }
  if (level === 'graduate_fresher') {
    return {
      key: 'skills_based',
      name: 'Skills-First (Fresher Graduate)',
      why: 'As a fresher graduate, your skills and education are your strongest points.',
      order: ['objective', 'skills', 'education', 'certifications', 'experience', 'achievements', 'languages', 'hobbies', 'personal', 'declaration'],
      template: 'modern',
      freeTemplate: 'classic',
    };
  }
  return {
    key: 'fresher_simple',
    name: 'Simple Fresher Format',
    why: 'A clean one-page format with objective, education and skills works best for 10th/12th/ITI freshers.',
    order: ['objective', 'education', 'skills', 'certifications', 'experience', 'achievements', 'languages', 'hobbies', 'personal', 'declaration'],
    template: 'simple',
    freeTemplate: 'simple',
  };
}

export function sectionTitle(key: SectionKey, level: CandidateLevel): string {
  switch (key) {
    case 'objective': return level === 'experienced' ? 'Professional Summary' : 'Career Objective';
    case 'experience': return level === 'experienced' ? 'Work Experience' : 'Experience / Internship';
    case 'skills': return 'Skills';
    case 'education': return 'Education';
    case 'certifications': return 'Certifications & Courses';
    case 'achievements': return 'Achievements';
    case 'languages': return 'Languages Known';
    case 'hobbies': return 'Hobbies';
    case 'personal': return 'Personal Details';
    case 'declaration': return 'Declaration';
  }
}

// ---------- Objective Generator ----------
function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '').replace(/\s+/g, ' ').replace(/\s([.,])/g, '$1').trim();
}

function joinSkills(list: string[]): string {
  const s = list.filter(Boolean).slice(0, 3);
  if (s.length === 0) return 'my field';
  if (s.length === 1) return s[0];
  return `${s.slice(0, -1).join(', ')} and ${s[s.length - 1]}`;
}

export function generateObjectives(job: Job | null, d: ResumeData): string[] {
  const title = job?.title || d.jobTitle || 'the role';
  const skills = joinSkills(d.skills.length ? d.skills : job?.key_skills || []);
  const years = experienceText(experienceMonths(d));
  const vars = { job: title, qualification: d.qualificationName || 'qualified', skills, years };
  const exp = d.experienceType === 'experienced' && experienceMonths(d) > 0;

  const primary = exp
    ? job?.objective_experienced || 'Result-oriented {job} with {years} of experience in {skills}. Looking for an opportunity to add value to a growing organisation.'
    : job?.objective_fresher || 'Motivated {qualification} candidate seeking the role of {job}. Eager to apply my skills in {skills} and grow with a reputed organisation.';

  const variants = exp
    ? [
        primary,
        'Dedicated professional with {years} of hands-on experience as {job}. Strong in {skills}, with a track record of reliable, quality work. Seeking a role where I can contribute and grow.',
        'Experienced {job} skilled in {skills}. Known for discipline, teamwork and meeting targets. Looking to take on new responsibilities in a professional organisation.',
      ]
    : [
        primary,
        'To obtain the position of {job} where I can use my knowledge of {skills}, learn new things quickly and contribute sincerely to the growth of the organisation.',
        'Enthusiastic and hard-working {qualification} fresher looking to start my career as {job}. Quick learner with good knowledge of {skills} and a positive attitude.',
      ];
  return Array.from(new Set(variants.map((v) => fill(v, vars))));
}

// ---------- Job Readiness Check ("Am I Ready for This Job?") ----------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();

export function skillMatches(required: string, have: string[]): boolean {
  const r = norm(required);
  if (!r) return false;
  const rTokens = r.split(' ').filter((t) => t.length > 2 && !['and', 'basic', 'skills', 'knowledge'].includes(t));
  return have.some((h) => {
    const x = norm(h);
    if (!x) return false;
    if (x === r || x.includes(r) || r.includes(x)) return true;
    // token overlap, e.g. "MS Word" vs "MS Office (Word, Excel)"
    return rTokens.some((t) => x.split(' ').includes(t));
  });
}

export type Readiness = {
  job: string;
  qualification: { label: string; ok: boolean; note: string };
  skills: { name: string; ok: boolean }[];
  typing: { needed: boolean; value: string };
  experience: string;
  matchPercent: number;
  summary: string;
  learn: string[];
};

const TYPING_JOBS = /typing|data entry|computer operator|back office|bpo|office/i;

export function readiness(job: Job, d: ResumeData): Readiness {
  const have = [...d.skills, ...(d.certifications || []).map((c) => c.name), ...(d.typingSpeed ? ['Typing'] : [])];
  const skills = job.key_skills.map((s) => ({ name: s, ok: skillMatches(s, have) }));
  const qOk = d.qualificationRank >= job.min_qualification_rank;
  const typingNeeded = TYPING_JOBS.test(job.title) || job.key_skills.some((s) => /typing/i.test(s));
  const months = experienceMonths(d);
  const matched = skills.filter((s) => s.ok).length;
  const total = skills.length + 1 + (typingNeeded ? 1 : 0);
  const score = matched + (qOk ? 1 : 0) + (typingNeeded && d.typingSpeed ? 1 : 0);
  // typing counted once when it is also a key skill

  const matchPercent = Math.round((score / Math.max(total, 1)) * 100);

  let summary: string;
  if (!qOk) summary = 'Qualification is below the usual requirement. Strong skills can still help — apply where the requirement is flexible.';
  else if (matchPercent >= 80) summary = 'Strong match: basic eligibility met and most key skills are present.';
  else if (matchPercent >= 50) summary = 'Basic eligibility met. Learning the missing skills will make your profile stronger.';
  else summary = 'Basic eligibility met, but several key skills are missing. Focus on the skills below.';

  const missing = skills.filter((s) => !s.ok).map((s) => s.name);
  const learn = Array.from(new Set([...missing, ...(typingNeeded && !d.typingSpeed ? ['Typing'] : []), ...job.learn_suggestions.filter((l) => !skillMatches(l, have))])).slice(0, 6);

  return {
    job: job.title,
    qualification: {
      label: d.qualificationName || '—',
      ok: qOk,
      note: qOk ? 'Meets usual requirement' : `Usually ${rankLabel(job.min_qualification_rank)}+`,
    },
    skills,
    typing: { needed: typingNeeded, value: d.typingSpeed },
    experience: months > 0 ? experienceText(months) : 'Fresher',
    matchPercent,
    summary,
    learn,
  };
}

// ---------- Resume Improvement Suggestions (Pro) ----------
export function improvementSuggestions(d: ResumeData, job: Job | null): string[] {
  const out: string[] = [];
  const p = d.personal;
  if (!p.email) out.push('Add an email address — most employers reply by email.');
  if (!/^[6-9]\d{9}$/.test((p.phone || '').replace(/\D/g, '').slice(-10))) out.push('Check your mobile number — it should be a valid 10-digit number.');
  if (!p.city) out.push('Add your city so local employers can shortlist you.');
  if ((d.objective || '').length < 80) out.push('Make your career objective 2–3 lines long and mention the job title.');
  if (job && d.objective && !d.objective.toLowerCase().includes(job.title.toLowerCase().split(' ')[0])) out.push(`Mention "${job.title}" in your objective so it looks job-specific.`);
  if (d.skills.length < 4) out.push('Add at least 4–6 relevant skills.');
  if (job) {
    const miss = job.key_skills.filter((s) => !skillMatches(s, d.skills));
    if (miss.length) out.push(`Key skills for ${job.title} not on your resume: ${miss.slice(0, 3).join(', ')}. Add them only if you really have them.`);
  }
  if (d.education.length === 0) out.push('Add your education details (board/university, year, percentage).');
  if (d.education.some((e) => !e.year)) out.push('Add passing year for every education entry.');
  if (d.experienceType === 'experienced') {
    for (const e of d.experience) {
      if (e.points.filter(Boolean).length < 2) { out.push(`Add 2–4 responsibilities for "${e.role || 'your job'}" — start each with an action word (Handled, Managed, Prepared).`); break; }
    }
    if (d.experience.some((e) => e.points.some((pt) => pt && !/\d/.test(pt)))) out.push('Add numbers where possible, e.g. "Handled 80+ calls daily" or "Managed stock of 500 items".');
  } else {
    if (d.certifications.length === 0) out.push('Freshers: add any course or certificate (computer course, typing, training) to stand out.');
    if (d.achievements.length === 0) out.push('Add 1–2 achievements (school rank, sports, NSS/NCC, competitions).');
  }
  if (TYPING_JOBS.test(d.jobTitle) && !d.typingSpeed) out.push('Mention your typing speed (e.g. 30 WPM English) — this job usually asks for it.');
  if (d.languages.length < 2) out.push('Mention all languages you can speak (Hindi, English, regional language).');
  return out;
}
