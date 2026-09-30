import Link from 'next/link';

export default function Footer() {
  const name = process.env.NEXT_PUBLIC_APP_NAME || 'JobReady Resume';
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {name}. Resume help for Indian job seekers.</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/pricing">Pricing</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refund">Refund Policy</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
