"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import SalesReportForm, {
  buildSalesReportPayload,
  type SalesReportFormState
} from "@/components/salesReports/SalesReportForm";
import { salesReportsApi, teamMembersApi } from "@/lib/api";
import type { DailySalesReport } from "@/types/salesReport";
import type { TeamMember } from "@/types/team";

interface SalesReportEditClientProps {
  reportId: string;
}

const emptyMetrics = {
  activeTeamMembers: 0,
  clientMeetings: 0,
  cpMeetingsHeadOffice: 0,
  cpMeetingsChannelPartner: 0,
  salesAchievedAED: 0
};

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const mapReportToForm = (report: DailySalesReport): SalesReportFormState => ({
  reportDate: report.reportDate || "",
  remarks: report.remarks || "",
  salesHeads:
    report.salesHeads?.length
      ? report.salesHeads.map((head) => ({
          salesHeadId: head.salesHeadId ? String(head.salesHeadId) : "",
          salesHeadName: head.salesHeadName || "",
          totalSalesAED: head.totalSalesAED || 0,
          directors:
            head.directors?.length
              ? head.directors.map((director) => ({
                  directorId: director.directorId ? String(director.directorId) : "",
                  directorName: director.directorName || "",
                  clientId: createClientId(),
                  metrics: {
                    activeTeamMembers: director.metrics?.activeTeamMembers ?? 0,
                    clientMeetings: director.metrics?.clientMeetings ?? 0,
                    cpMeetingsHeadOffice: director.metrics?.cpMeetingsHeadOffice ?? 0,
                    cpMeetingsChannelPartner: director.metrics?.cpMeetingsChannelPartner ?? 0,
                    salesAchievedAED: director.metrics?.salesAchievedAED ?? 0
                  }
                }))
              : [
                  {
                    directorId: "",
                    directorName: "",
                    clientId: createClientId(),
                    metrics: { ...emptyMetrics }
                  }
                ]
        }))
      : [
          {
            salesHeadId: "",
            salesHeadName: "",
            totalSalesAED: 0,
            directors: [
              {
                directorId: "",
                directorName: "",
                clientId: createClientId(),
                metrics: { ...emptyMetrics }
              }
            ]
          }
        ]
});

export default function SalesReportEditClient({ reportId }: SalesReportEditClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<SalesReportFormState | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [report, setReport] = useState<DailySalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Use the global message API to avoid duplicate holders in the tree.

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [reportData, teamData] = await Promise.all([
        salesReportsApi.getById(reportId),
        teamMembersApi.list()
      ]);
      setReport(reportData ?? null);
      setTeamMembers(teamData ?? []);
      setForm(reportData ? mapReportToForm(reportData) : null);
    } catch (err) {
      setLoadError("Unable to load daily sales report.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      await salesReportsApi.update(reportId, buildSalesReportPayload(form));
      router.push("/sales-reports?updated=1");
    } catch (err) {
      const apiMessage =
        typeof (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message === "string"
          ? (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message
          : null;
      setSaveError(apiMessage || "Failed to update daily sales report.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState title="Unable to edit report" description={loadError} onRetry={load} />
    );
  }

  if (!report || !form) {
    return <ErrorState title="Report not found" description="Return to the list." />;
  }

  return (
    <div className="space-y-4">
      {saveError ? (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {saveError}
        </div>
      ) : null}
      <SalesReportForm
        value={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        teamMembers={teamMembers}
        submitLabel={saving ? "Saving..." : "Save Changes"}
        loading={saving}
      />
    </div>
  );
}
