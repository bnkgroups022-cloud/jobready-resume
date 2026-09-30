// Public site URL, safe for both server and browser.
// Production: NEXT_PUBLIC_SITE_URL (e.g. https://resume.brightwayjobs.in)
// Fallbacks: Vercel system URL, then localhost for local development only.
function normalize(u: string): string {
  let s = u.trim().replace(/\/+$/, '');
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    return new URL(s).origin;
  } catch {
    return '';
  }
}

export function getSiteUrl(): string {
  return (
    normalize(process.env.NEXT_PUBLIC_SITE_URL || '') ||
    normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL || '') ||
    normalize(process.env.VERCEL_URL || '') ||
    'http://localhost:3000'
  );
}

// In the browser: use the real origin while developing on localhost,
// otherwise the configured production URL (must be allowed in Supabase).
export function getBrowserSiteUrl(): string {
  if (typeof window === 'undefined') return getSiteUrl();
  const { hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return origin;
  return normalize(process.env.NEXT_PUBLIC_SITE_URL || '') || origin;
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'JobReady Resume';
