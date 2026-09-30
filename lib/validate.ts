import type { ResumeData } from './types';
import { emptyResume } from './engine';

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');
const strArr = (v: unknown, n = 40, max = 200) => (Array.isArray(v) ? v.slice(0, n).map((x) => str(x, max)).filter(Boolean) : []);

// Keeps only known fields with safe lengths (never trust the browser).
export function sanitizeResume(input: any): ResumeData {
  const e = emptyResume();
  const p = input?.personal || {};
  const personal = Object.fromEntries(Object.keys(e.personal).map((k) => [k, str(p[k], k === 'address' ? 300 : 120)])) as ResumeData['personal'];
  return {
    jobSlug: str(input?.jobSlug, 80),
    jobTitle: str(input?.jobTitle, 120),
    qualificationName: str(input?.qualificationName, 120),
    qualificationRank: Math.max(0, Math.min(9, Number(input?.qualificationRank) || 0)),
    personal,
    objective: str(input?.objective, 1200),
    education: (Array.isArray(input?.education) ? input.education : []).slice(0, 8).map((x: any) => ({
      degree: str(x?.degree, 120), institute: str(x?.institute, 160), board: str(x?.board, 120), year: str(x?.year, 20), score: str(x?.score, 30),
    })),
    skills: strArr(input?.skills, 30, 80),
    typingSpeed: str(input?.typingSpeed, 60),
    languages: strArr(input?.languages, 10, 40),
    experienceType: input?.experienceType === 'experienced' ? 'experienced' : 'fresher',
    experience: (Array.isArray(input?.experience) ? input.experience : []).slice(0, 8).map((x: any) => ({
      role: str(x?.role, 120), company: str(x?.company, 160), from: str(x?.from, 10), to: str(x?.to, 10), current: !!x?.current,
      points: strArr(x?.points, 8, 300),
    })),
    certifications: (Array.isArray(input?.certifications) ? input.certifications : []).slice(0, 10).map((x: any) => ({
      name: str(x?.name, 160), issuer: str(x?.issuer, 120), year: str(x?.year, 20),
    })),
    achievements: strArr(input?.achievements, 10, 300),
    hobbies: strArr(input?.hobbies, 10, 60),
    declaration: input?.declaration !== false,
    template: str(input?.template, 40) || 'classic',
  };
}

export function missingRequired(d: ResumeData): string | null {
  if (!d.jobSlug) return 'Please select a job.';
  if (!d.qualificationName) return 'Please select your qualification.';
  if (!d.personal.fullName.trim()) return 'Please enter your full name.';
  if (!d.personal.phone.trim()) return 'Please enter your mobile number.';
  return null;
}
