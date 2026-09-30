// Generates supabase/seed.sql from data/seed-data.mjs   (npm run seed)
//
// All text values use PostgreSQL dollar-quoting ($v$...$v$) instead of '...'
// so apostrophes, smart quotes or a lost quote during copy-paste can never
// turn resume text (e.g. "computer systems") into SQL keywords/table names.
// The whole seed runs in ONE transaction: it either fully succeeds or changes nothing.
import { writeFileSync } from 'node:fs';
import { jobs, qualifications, templates } from '../data/seed-data.mjs';

const q = (s) => {
  if (s === null || s === undefined) return 'null';
  const t = String(s);
  if (t.includes('$v$')) throw new Error('Text may not contain $v$: ' + t);
  return `$v$${t}$v$`;
};
const arr = (a) => (a.length ? `array[${a.map(q).join(', ')}]::text[]` : `'{}'::text[]`);

let sql = `-- =====================================================================
-- JobReady Resume - seed data
-- STEP 2 of 2: run AFTER schema.sql. Paste this WHOLE file into a NEW,
-- EMPTY SQL Editor tab -> Run. Safe to re-run (updates, never duplicates).
-- Inserts: ${qualifications.length} qualifications, ${templates.length} templates, ${jobs.length} jobs
-- =====================================================================

begin;

-- Stop with a clear message if schema.sql has not been run yet
do $check$
begin
  if to_regclass('public.jobs') is null or to_regclass('public.qualifications') is null or to_regclass('public.templates') is null then
    raise exception 'Tables not found. Run supabase/schema.sql first, then run this seed.sql again.';
  end if;
end
$check$;

-- ---------- qualifications ----------
insert into public.qualifications (name, rank, group_name, sort_order) values
`;
sql += qualifications.map(([n, r, g], i) => `  (${q(n)}, ${r}, ${q(g)}, ${i + 1})`).join(',\n');
sql += `
on conflict (name) do update set rank = excluded.rank, group_name = excluded.group_name, sort_order = excluded.sort_order;

-- ---------- resume templates ----------
insert into public.templates (slug, name, description, is_pro, accent_color, sort_order) values
`;
sql += templates.map((t) => `  (${q(t.slug)}, ${q(t.name)}, ${q(t.description)}, ${t.is_pro}, ${q(t.accent_color)}, ${t.sort_order})`).join(',\n');
sql += `
on conflict (slug) do update set name = excluded.name, description = excluded.description, is_pro = excluded.is_pro, accent_color = excluded.accent_color, sort_order = excluded.sort_order;

-- ---------- jobs ----------
insert into public.jobs (slug, title, category, min_qualification_rank, key_skills, optional_skills, responsibilities, learn_suggestions, objective_fresher, objective_experienced, sort_order) values
`;
sql += jobs
  .map(
    (j) =>
      `  (${q(j.slug)}, ${q(j.title)}, ${q(j.category)}, ${j.min_qualification_rank},\n   ${arr(j.key_skills)},\n   ${arr(j.optional_skills)},\n   ${arr(j.responsibilities)},\n   ${arr(j.learn_suggestions)},\n   ${q(j.objective_fresher)},\n   ${q(j.objective_experienced)}, ${j.sort_order})`,
  )
  .join(',\n');
sql += `
on conflict (slug) do update set title = excluded.title, category = excluded.category, min_qualification_rank = excluded.min_qualification_rank, key_skills = excluded.key_skills, optional_skills = excluded.optional_skills, responsibilities = excluded.responsibilities, learn_suggestions = excluded.learn_suggestions, objective_fresher = excluded.objective_fresher, objective_experienced = excluded.objective_experienced, sort_order = excluded.sort_order;

commit;

-- Expected result: one row -> jobs = ${jobs.length}, qualifications = ${qualifications.length}, templates = ${templates.length}
select (select count(*) from public.jobs) as jobs,
       (select count(*) from public.qualifications) as qualifications,
       (select count(*) from public.templates) as templates;
`;

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log(`seed.sql written: ${jobs.length} jobs, ${qualifications.length} qualifications, ${templates.length} templates`);
