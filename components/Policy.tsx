export default function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
      <div className="card mt-6 space-y-4 p-6 text-[15px] leading-relaxed text-slate-700 [&_h2]:mt-4 [&_h2]:font-semibold [&_h2]:text-slate-900">{children}</div>
    </div>
  );
}
