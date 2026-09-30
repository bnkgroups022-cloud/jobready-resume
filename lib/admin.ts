import 'server-only';
import { getUser, isAdminEmail } from './supabase/server';
import type { Field } from './types';
export type { Field, FieldType } from './types';

export async function requireAdmin() {
  const user = await getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}


export const ADMIN_TABLES: Record<string, { id: string; fields: Field[] }> = {
  jobs: {
    id: 'id',
    fields: [
      { key: 'title', label: 'Job title', type: 'text', required: true },
      { key: 'slug', label: 'Slug (url name, e.g. data-entry-operator)', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'min_qualification_rank', label: 'Min qualification (1 Below 10th, 2 10th, 3 12th/ITI, 4 Diploma, 5 Graduate, 6 PG)', type: 'number', required: true },
      { key: 'key_skills', label: 'Key skills (one per line)', type: 'list' },
      { key: 'optional_skills', label: 'Extra skills — Pro (one per line)', type: 'list' },
      { key: 'responsibilities', label: 'Responsibilities — Pro (one per line)', type: 'list' },
      { key: 'learn_suggestions', label: 'Suggested to learn (one per line)', type: 'list' },
      { key: 'objective_fresher', label: 'Fresher objective ({job} {qualification} {skills})', type: 'textarea' },
      { key: 'objective_experienced', label: 'Experienced objective ({job} {years} {skills})', type: 'textarea' },
      { key: 'sort_order', label: 'Sort order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
  },
  qualifications: {
    id: 'id',
    fields: [
      { key: 'name', label: 'Qualification name', type: 'text', required: true },
      { key: 'rank', label: 'Rank (1 Below 10th, 2 10th, 3 12th/ITI, 4 Diploma, 5 Graduate, 6 PG)', type: 'number', required: true },
      { key: 'group_name', label: 'Group (School, ITI / Diploma, Graduate, Post Graduate)', type: 'text', required: true },
      { key: 'sort_order', label: 'Sort order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
  },
  templates: {
    id: 'slug',
    fields: [
      { key: 'name', label: 'Template name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'accent_color', label: 'Accent colour', type: 'color' },
      { key: 'is_pro', label: 'Pro only', type: 'bool' },
      { key: 'sort_order', label: 'Sort order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
  },
};
