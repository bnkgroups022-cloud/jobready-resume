'use client';
import { createBrowserClient } from '@supabase/ssr';

// Browser client: uses ONLY the public URL + anon/publishable key.
let client: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseBrowser() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.');
    client = createBrowserClient(url, key);
  }
  return client;
}
