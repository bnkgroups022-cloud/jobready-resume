import Link from 'next/link';
import { getUser, isAdminEmail } from '@/lib/supabase/server';

export default async function Header() {
  let user: { email?: string | null } | null = null;
  try { user = await getUser(); } catch { /* not configured yet or network error */ }
  const name = process.env.NEXT_PUBLIC_APP_NAME || 'JobReady Resume';
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <img src="/icon.svg" alt="" className="h-7 w-7" />
          <span>{name}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/pricing" className="btn-ghost hidden sm:inline-flex">Pricing</Link>
          {user ? (
            <>
              {isAdminEmail(user.email) && <Link href="/admin" className="btn-ghost">Admin</Link>}
              <Link href="/dashboard" className="btn-outline">My Resumes</Link>
            </>
          ) : (
            <Link href="/login" className="btn-outline">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
