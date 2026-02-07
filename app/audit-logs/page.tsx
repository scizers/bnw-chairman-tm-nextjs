"use client";

import AuditLogsPageClient from "@/components/auditLogs/AuditLogsPageClient";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Administration</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Audit Logs</h2>
          <p className="mt-2 text-sm text-text-muted">
            Review activity for tasks, users, and key back office actions.
          </p>
        </div>
      </div>

      <AuditLogsPageClient />
    </div>
  );
}
