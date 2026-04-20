"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Space } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { salesReportsApi } from "@/lib/api";
import { triggerBrowserDownload } from "@/lib/utils/download";
import type {
  DailySalesReport,
  SalesReportDirector,
  SalesReportDirectorMetrics,
  SalesReportSalesHead
} from "@/types/salesReport";

interface SalesReportViewClientProps {
  reportId: string;
}

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
};

const formatInteger = (value: unknown) => {
  const numeric = normalizeNumber(value);
  if (!numeric) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numeric);
};

const formatSales = (value: unknown) => {
  const numeric = normalizeNumber(value);
  if (!numeric) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric);
};

const formatReportDate = (reportDate?: string) => {
  if (!reportDate) return "";
  const parsed = dayjs(reportDate);
  if (!parsed.isValid()) return reportDate;
  return parsed.format("DD-MMM-YY");
};

const computeHeadTotal = (head: SalesReportSalesHead) => {
  if (typeof head.totalSalesAED === "number") return head.totalSalesAED;
  return (head.directors || []).reduce(
    (sum, director) => sum + normalizeNumber(director.metrics?.salesAchievedAED),
    0
  );
};

const computeGrandTotals = (report: DailySalesReport): SalesReportDirectorMetrics => {
  if (report.grandTotals) return report.grandTotals;
  const totals: SalesReportDirectorMetrics = {
    activeTeamMembers: 0,
    clientMeetings: 0,
    cpMeetingsHeadOffice: 0,
    cpMeetingsChannelPartner: 0,
    salesAchievedAED: 0
  };
  report.salesHeads?.forEach((head) => {
    head.directors?.forEach((director) => {
      const metrics = director.metrics || ({} as SalesReportDirectorMetrics);
      totals.activeTeamMembers += normalizeNumber(metrics.activeTeamMembers);
      totals.clientMeetings += normalizeNumber(metrics.clientMeetings);
      totals.cpMeetingsHeadOffice += normalizeNumber(metrics.cpMeetingsHeadOffice);
      totals.cpMeetingsChannelPartner += normalizeNumber(metrics.cpMeetingsChannelPartner);
      totals.salesAchievedAED += normalizeNumber(metrics.salesAchievedAED);
    });
  });
  return totals;
};

export default function SalesReportViewClient({ reportId }: SalesReportViewClientProps) {
  const { message } = App.useApp();
  const [report, setReport] = useState<DailySalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const reportData = await salesReportsApi.getById(reportId);
      setReport(reportData ?? null);
    } catch {
      setLoadError("Unable to load daily sales report.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    if (!report?.salesHeads?.length) return [];
    return report.salesHeads.flatMap((head, headIndex) => {
      const fallbackDirector: SalesReportDirector = {
        directorName: "",
        metrics: {
          activeTeamMembers: 0,
          clientMeetings: 0,
          cpMeetingsHeadOffice: 0,
          cpMeetingsChannelPartner: 0,
          salesAchievedAED: 0
        }
      };
      const directors = head.directors?.length ? head.directors : [fallbackDirector];
      const headTotal = computeHeadTotal(head);
      return directors.map((director, directorIndex) => ({
        key: `${head.salesHeadId || head.salesHeadName || "head"}-${headIndex}-${directorIndex}`,
        salesHeadName: head.salesHeadName || "-",
        salesHeadRowSpan: directorIndex === 0 ? directors.length : 0,
        directorName: director.directorName || "-",
        activeTeamMembers: director.metrics?.activeTeamMembers ?? 0,
        clientMeetings: director.metrics?.clientMeetings ?? 0,
        cpMeetingsHeadOffice: director.metrics?.cpMeetingsHeadOffice ?? 0,
        cpMeetingsChannelPartner: director.metrics?.cpMeetingsChannelPartner ?? 0,
        salesAchievedAED: director.metrics?.salesAchievedAED ?? 0,
        headTotal,
        headTotalRowSpan: directorIndex === 0 ? directors.length : 0
      }));
    });
  }, [report]);

  const grandTotals = useMemo(() => {
    if (!report) {
      return {
        activeTeamMembers: 0,
        clientMeetings: 0,
        cpMeetingsHeadOffice: 0,
        cpMeetingsChannelPartner: 0,
        salesAchievedAED: 0
      };
    }
    return computeGrandTotals(report);
  }, [report]);

  const handleExcelExport = useCallback(async () => {
    setDownloadingExcel(true);
    try {
      const result = await salesReportsApi.downloadExport(reportId, "excel");
      triggerBrowserDownload(result.blob, result.filename);
    } catch {
      message.error("Unable to export Excel file.");
    } finally {
      setDownloadingExcel(false);
    }
  }, [message, reportId]);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState title="Unable to load report" description={loadError} onRetry={load} />
    );
  }

  if (!report) {
    return <ErrorState title="Report not found" description="Return to the list." />;
  }

  return (
    <div className="rounded-xl bg-surface-card p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Export</p>
          <p className="mt-1 text-sm text-text-muted">
            Download this report in the same tabular layout.
          </p>
        </div>
        <Space wrap>
          <Button
            icon={<DownloadOutlined />}
            loading={downloadingExcel}
            onClick={() => void handleExcelExport()}
          >
            Export Excel
          </Button>
        </Space>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                colSpan={8}
                className="border border-brand-primary/40 bg-black px-4 py-3 text-center text-xs uppercase tracking-[0.4em] text-brand-primary"
              >
                Sales Update - {formatReportDate(report.reportDate)}
              </th>
            </tr>
            <tr className="bg-black text-brand-primary">
              <th
                rowSpan={2}
                className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Sales Head
              </th>
              <th
                rowSpan={2}
                className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Sales Director
              </th>
              <th
                rowSpan={2}
                className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]"
              >
                No. of Active Team Member
              </th>
              <th
                colSpan={3}
                className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Meetings
              </th>
              <th
                colSpan={2}
                className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Bookings
              </th>
            </tr>
            <tr className="bg-black text-brand-primary">
              <th className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                Client Meetings
              </th>
              <th className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                CP Meetings Head Office
              </th>
              <th className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                CP Meetings Channel Partner Office
              </th>
              <th className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                Sales Achieved for Sales Dir. (in AED)
              </th>
              <th className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                Sales Achieved for Sales Head (in AED)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="odd:bg-surface-muted/40">
                {row.salesHeadRowSpan ? (
                  <td
                    rowSpan={row.salesHeadRowSpan}
                    className="border border-brand-primary/30 px-3 py-2 font-semibold text-text-primary"
                  >
                    {row.salesHeadName}
                  </td>
                ) : null}
                <td className="border border-brand-primary/30 px-3 py-2 text-text-primary">
                  {row.directorName}
                </td>
                <td className="border border-brand-primary/30 px-3 py-2 text-right text-text-primary">
                  {formatInteger(row.activeTeamMembers)}
                </td>
                <td className="border border-brand-primary/30 px-3 py-2 text-right text-text-primary">
                  {formatInteger(row.clientMeetings)}
                </td>
                <td className="border border-brand-primary/30 px-3 py-2 text-right text-text-primary">
                  {formatInteger(row.cpMeetingsHeadOffice)}
                </td>
                <td className="border border-brand-primary/30 px-3 py-2 text-right text-text-primary">
                  {formatInteger(row.cpMeetingsChannelPartner)}
                </td>
                <td className="border border-brand-primary/30 px-3 py-2 text-right text-text-primary">
                  {formatSales(row.salesAchievedAED)}
                </td>
                {row.headTotalRowSpan ? (
                  <td
                    rowSpan={row.headTotalRowSpan}
                    className="border border-brand-primary/30 px-3 py-2 text-right font-semibold text-text-primary"
                  >
                    {formatSales(row.headTotal)}
                  </td>
                ) : null}
              </tr>
            ))}
            <tr className="bg-black text-brand-primary">
              <td
                colSpan={2}
                className="border border-brand-primary/40 px-3 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Grand Total
              </td>
              <td className="border border-brand-primary/40 px-3 py-2 text-right">
                {formatInteger(grandTotals.activeTeamMembers)}
              </td>
              <td className="border border-brand-primary/40 px-3 py-2 text-right">
                {formatInteger(grandTotals.clientMeetings)}
              </td>
              <td className="border border-brand-primary/40 px-3 py-2 text-right">
                {formatInteger(grandTotals.cpMeetingsHeadOffice)}
              </td>
              <td className="border border-brand-primary/40 px-3 py-2 text-right">
                {formatInteger(grandTotals.cpMeetingsChannelPartner)}
              </td>
              <td className="border border-brand-primary/40 px-3 py-2 text-right">
                {formatSales(grandTotals.salesAchievedAED)}
              </td>
              <td className="border border-brand-primary/40 px-3 py-2 text-right">
                {formatSales(grandTotals.salesAchievedAED)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
