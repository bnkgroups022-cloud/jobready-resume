export type ProductKey = 'resume_credit' | 'pro_monthly' | 'pro_yearly';

export const PRODUCTS: Record<ProductKey, { name: string; amount: number; label: string; note: string }> = {
  resume_credit: { name: '1 Resume Credit', amount: 900, label: '₹9', note: 'One more resume' },
  pro_monthly: { name: 'Pro Monthly', amount: 4900, label: '₹49 / month', note: '30 days Pro access' },
  pro_yearly: { name: 'Pro Yearly', amount: 39900, label: '₹399 / year', note: '365 days Pro — just ₹33.25/month' },
};

export const PRO_FEATURES = [
  'Unlimited resumes for personal use',
  'All resume templates (incl. Modern & Professional)',
  'Job-specific resume for every job',
  'PDF, Word & Print',
  'Edit your resumes anytime',
  'Multiple job profiles',
  'Extra job-specific skill suggestions',
  '3 career objective options',
  'Resume improvement suggestions',
];

export const FREE_FEATURES = ['1 resume free', 'Qualification & job-based format', 'PDF, Word & Print', 'Basic templates', '"Am I Ready?" job check'];
