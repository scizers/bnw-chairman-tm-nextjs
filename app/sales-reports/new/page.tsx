"use client";

import SalesReportCreateClient from "@/components/salesReports/SalesReportCreateClient";

export default function SalesReportCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Add Daily Sales Report</h2>
        <p className="mt-2 text-sm text-text-muted">
          Capture daily performance across sales heads and directors.
        </p>
      </div>

      <SalesReportCreateClient />
    </div>
  );
}
