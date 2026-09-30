// Generates supabase/seed.sql from data/seed-data.mjs
import { writeFileSync } from 'node:fs';
import { jobs, qualifications, templates } from '../data/seed-data.mjs';

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;

let sql = `-- JobReady Resume seed data (safe to re-run; updates existing rows)\n\n`;
sql += `insert into public.qualifications (name, rank, group_name, sort_order) values\n`;
sql += qualifications.map(([n, r, g], i) => `  (${q(n)}, ${r}, ${q(g)}, ${i + 1})`).join(',\n');
sql += `\non conflict (name) do update set rank = excluded.rank, group_name = excluded.group_name, sort_order = excluded.sort_order;\n\n`;

sql += `insert into public.templates (slug, name, description, is_pro, accent_color, sort_order) values\n`;
sql += templates.map((t) => `  (${q(t.slug)}, ${q(t.name)}, ${q(t.description)}, ${t.is_pro}, ${q(t.accent_color)}, ${t.sort_order})`).join(',\n');
sql += `\non conflict (slug) do update set name = excluded.name, description = excluded.description, is_pro = excluded.is_pro, accent_color = excluded.accent_color, sort_order = excluded.sort_order;\n\n`;

sql += `insert into public.jobs (slug, title, category, min_qualification_rank, key_skills, optional_skills, responsibilities, learn_suggestions, objective_fresher, objective_experienced, sort_order) values\n`;
sql += jobs.map((j) => `  (${q(j.slug)}, ${q(j.title)}, ${q(j.category)}, ${j.min_qualification_rank}, ${arr(j.key_skills)}, ${arr(j.optional_skills)}, ${arr(j.responsibilities)}, ${arr(j.learn_suggestions)}, ${q(j.objective_fresher)}, ${q(j.objective_experienced)}, ${j.sort_order})`).join(',\n');
sql += `\non conflict (slug) do update set title = excluded.title, category = excluded.category, min_qualification_rank = excluded.min_qualification_rank, key_skills = excluded.key_skills, optional_skills = excluded.optional_skills, responsibilities = excluded.responsibilities, learn_suggestions = excluded.learn_suggestions, objective_fresher = excluded.objective_fresher, objective_experienced = excluded.objective_experienced, sort_order = excluded.sort_order;\n`;

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log(`seed.sql written: ${jobs.length} jobs, ${qualifications.length} qualifications, ${templates.length} templates`);
