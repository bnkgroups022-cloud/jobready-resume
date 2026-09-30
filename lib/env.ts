import 'server-only';

// Server-side environment helper. Values are read at request time (never at
// build time) so a missing variable gives a clear error in Vercel logs instead
// of a broken build. The error message only contains the variable NAME.
export const SERVER_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_NAME',
  'ADMIN_EMAILS',
  'ABUSE_SALT',
  'NEXT_PUBLIC_SUPPORT_EMAIL',
  'NEXT_PUBLIC_SUPPORT_WHATSAPP',
] as const;

export type EnvName = (typeof SERVER_ENV)[number];

export function requireEnv(name: EnvName): string {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`Missing environment variable: ${name}. Add it in Vercel → Settings → Environment Variables, then redeploy.`);
  return v;
}

export function hasEnv(name: EnvName): boolean {
  return !!(process.env[name] || '').trim();
}

// Names (never values) of required variables that are not set.
export function missingEnv(names: readonly EnvName[]): EnvName[] {
  return names.filter((n) => !hasEnv(n));
}

// What pages that talk to Supabase on the server need.
export const SUPABASE_ENV: readonly EnvName[] = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
