import EmptyState from "@/components/common/EmptyState";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Reports</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Executive Reports</h2>
        <p className="mt-2 text-sm text-text-muted">
          Generate summarized intelligence for daily and weekly briefings.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-black">
          Generate Daily AI Summary
        </button>
        <button className="rounded-full border border-border-subtle px-5 py-2 text-sm text-text-primary">
          Generate Weekly PDF
        </button>
      </div>

      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <h3 className="font-display text-lg text-text-primary">Preview</h3>
        <div className="mt-4">
          <EmptyState
            title="No report generated yet"
            description="Select a report action to generate a preview."
          />
        </div>
      </div>
    </div>
  );
}
