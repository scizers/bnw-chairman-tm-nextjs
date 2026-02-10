"use client";

import TimelinePageClient from "@/components/timeline/TimelinePageClient";

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Administration</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Timeline</h2>
          <p className="mt-2 text-sm text-text-muted">
            A chronological feed of tasks, remarks, and minutes of meeting activity.
          </p>
        </div>
      </div>

      <TimelinePageClient />
    </div>
  );
}
