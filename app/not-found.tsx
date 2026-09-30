import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">This page does not exist or you do not have access.</p>
      <Link href="/" className="btn-primary mt-6">Go Home</Link>
    </div>
  );
}
