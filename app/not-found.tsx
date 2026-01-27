import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-2xl bg-surface-card p-10 text-center shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">404</p>
        <h1 className="mt-3 font-display text-3xl text-text-primary">Page not found</h1>
        <p className="mt-2 text-sm text-text-muted">Return to the executive dashboard.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-black"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
