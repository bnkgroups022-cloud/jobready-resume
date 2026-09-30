// Turns ResumeData into a layout-neutral model used by HTML preview, PDF and Word.
import type { CandidateLevel, ResumeData, SectionKey } from './types';
import { candidateLevel, formatMonth, recommendFormat, sectionTitle } from './engine';

export type Entry = { title: string; subtitle?: string; meta?: string; bullets?: string[] };
export type Section =
  | { key: SectionKey; title: string; kind: 'text'; text: string; foot?: string }
  | { key: SectionKey; title: string; kind: 'tags'; items: string[] }
  | { key: SectionKey; title: string; kind: 'bullets'; items: string[] }
  | { key: SectionKey; title: string; kind: 'entries'; entries: Entry[] }
  | { key: SectionKey; title: string; kind: 'kv'; rows: [string, string][] };

export type ResumeModel = {
  name: string;
  headline: string;
  contacts: string[];
  level: CandidateLevel;
  sections: Section[];
};

// Sections that go in the side column of the "modern" template
export const SIDEBAR_KEYS: SectionKey[] = ['skills', 'languages', 'hobbies', 'personal'];

function fmtDob(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : v;
}

export function buildResume(d: ResumeData): ResumeModel {
  const level = candidateLevel(d);
  const order = recommendFormat(level).order;
  const p = d.personal;
  const place = [p.city, p.state].filter(Boolean).join(', ');
  const contacts = [p.phone, p.email, place, p.linkedin].filter(Boolean);
  const sections: Section[] = [];

  for (const key of order) {
    const title = sectionTitle(key, level);
    switch (key) {
      case 'objective':
        if (d.objective.trim()) sections.push({ key, title, kind: 'text', text: d.objective.trim() });
        break;
      case 'experience': {
        const list = d.experienceType === 'experienced' ? d.experience.filter((e) => e.role || e.company) : [];
        if (list.length)
          sections.push({
            key, title, kind: 'entries',
            entries: list.map((e) => ({
              title: e.role,
              subtitle: e.company,
              meta: [formatMonth(e.from), e.current ? 'Present' : formatMonth(e.to)].filter(Boolean).join(' – '),
              bullets: e.points.filter((x) => x.trim()),
            })),
          });
        break;
      }
      case 'skills': {
        const items = [...d.skills];
        if (d.typingSpeed.trim()) items.push(`Typing Speed: ${d.typingSpeed.trim()}`);
        if (items.length) sections.push({ key, title, kind: 'tags', items });
        break;
      }
      case 'education': {
        const list = d.education.filter((e) => e.degree || e.institute);
        if (list.length)
          sections.push({
            key, title, kind: 'entries',
            entries: list.map((e) => ({
              title: e.degree,
              subtitle: [e.institute, e.board].filter(Boolean).join(' · '),
              meta: [e.year, e.score ? `Score: ${e.score}` : ''].filter(Boolean).join(' | '),
            })),
          });
        break;
      }
      case 'certifications': {
        const list = d.certifications.filter((c) => c.name);
        if (list.length)
          sections.push({
            key, title, kind: 'bullets',
            items: list.map((c) => [c.name, c.issuer, c.year].filter(Boolean).join(' — ')),
          });
        break;
      }
      case 'achievements': {
        const items = d.achievements.filter((x) => x.trim());
        if (items.length) sections.push({ key, title, kind: 'bullets', items });
        break;
      }
      case 'languages':
        if (d.languages.length) sections.push({ key, title, kind: 'tags', items: d.languages });
        break;
      case 'hobbies': {
        const items = d.hobbies.filter((x) => x.trim());
        if (items.length) sections.push({ key, title, kind: 'tags', items });
        break;
      }
      case 'personal': {
        const rows: [string, string][] = [];
        if (p.fatherName) rows.push(["Father's Name", p.fatherName]);
        if (p.dob) rows.push(['Date of Birth', fmtDob(p.dob)]);
        if (p.gender) rows.push(['Gender', p.gender]);
        if (p.maritalStatus) rows.push(['Marital Status', p.maritalStatus]);
        if (p.nationality) rows.push(['Nationality', p.nationality]);
        const addr = [p.address, p.city, p.state, p.pincode].filter(Boolean).join(', ');
        if (addr) rows.push(['Address', addr]);
        if (rows.length) sections.push({ key, title, kind: 'kv', rows });
        break;
      }
      case 'declaration':
        if (d.declaration)
          sections.push({
            key, title, kind: 'text',
            text: 'I hereby declare that the information given above is true and correct to the best of my knowledge and belief.',
            foot: `Place: ${p.city || '__________'}        Date: __________        (${p.fullName || 'Signature'})`,
          });
        break;
    }
  }

  return { name: p.fullName || 'Your Name', headline: d.jobTitle, contacts, level, sections };
}
