"use client";

import { useParams } from "next/navigation";
import SalesReportViewClient from "@/components/salesReports/SalesReportViewClient";

export default function SalesReportViewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Daily Sales Report</h2>
        <p className="mt-2 text-sm text-text-muted">
          Review the daily performance snapshot.
        </p>
      </div>

      <SalesReportViewClient reportId={id} />
    </div>
  );
}
