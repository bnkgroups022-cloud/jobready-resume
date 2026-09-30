// Shown instead of a crash when the deployment is not configured yet.
// Lists only variable NAMES / table problems — never any secret value.
export default function SetupNotice({ missing, dbError }: { missing?: string[]; dbError?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="card border-amber-300 p-6">
        <h1 className="text-xl font-bold">Site setup is not complete</h1>
        {missing && missing.length > 0 && (
          <>
            <p className="mt-2 text-sm text-slate-700">These environment variables are missing in Vercel (Settings → Environment Variables → Production), then Redeploy:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 font-mono text-sm">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
          </>
        )}
        {dbError && <p className="mt-3 text-sm text-slate-700">Database problem: {dbError}</p>}
        <p className="mt-4 text-xs text-slate-500">Check status any time at /api/health</p>
      </div>
    </div>
  );
}
