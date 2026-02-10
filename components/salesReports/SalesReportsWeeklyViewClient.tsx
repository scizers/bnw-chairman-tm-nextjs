"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import dayjs, { type Dayjs } from "dayjs";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { salesReportsApi } from "@/lib/api";
import type { DailySalesReport, SalesReportGrandTotals } from "@/types/salesReport";

const formatNumber = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number(value)
  );
};

const normalizeMetric = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
};

const computeTotals = (report: DailySalesReport) => {
  const totals: SalesReportGrandTotals = {
    activeTeamMembers: 0,
    clientMeetings: 0,
    cpMeetingsHeadOffice: 0,
    cpMeetingsChannelPartner: 0,
    salesAchievedAED: 0
  };

  report.salesHeads?.forEach((head) => {
    const directors = head.directors || [];
    directors.forEach((director) => {
      const metrics = director.metrics || ({} as SalesReportGrandTotals);
      totals.activeTeamMembers += normalizeMetric(metrics.activeTeamMembers);
      totals.clientMeetings += normalizeMetric(metrics.clientMeetings);
      totals.cpMeetingsHeadOffice += normalizeMetric(metrics.cpMeetingsHeadOffice);
      totals.cpMeetingsChannelPartner += normalizeMetric(metrics.cpMeetingsChannelPartner);
      totals.salesAchievedAED += normalizeMetric(metrics.salesAchievedAED);
    });
  });

  return totals;
};

const resolveReportId = (report: DailySalesReport) => report.id ?? report._id ?? "";

type ReportSummary = {
  totalSales: number;
  count: number;
  reportIds: string[];
};

export default function SalesReportsWeeklyViewClient() {
  const [weekStart, setWeekStart] = useState<Dayjs>(() => dayjs().startOf("week"));
  const [reports, setReports] = useState<DailySalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekRange = useMemo(() => {
    const start = weekStart.startOf("week");
    const end = start.add(6, "day");
    return { start, end };
  }, [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesReportsApi.list({
        reportDateFrom: weekRange.start.format("YYYY-MM-DD"),
        reportDateTo: weekRange.end.format("YYYY-MM-DD"),
        sortBy: "reportDate",
        sortDir: "asc",
        page: 1,
        pageSize: 50
      });
      const data = Array.isArray(response) ? response : response?.data ?? [];
      setReports(data);
    } catch (err) {
      setError("Unable to load sales reports for this week.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [weekRange]);

  useEffect(() => {
    void load();
  }, [load]);

  const reportSummaries = useMemo(() => {
    const map = new Map<string, ReportSummary>();
    reports.forEach((report) => {
      if (!report.reportDate) return;
      const dateKey = dayjs(report.reportDate).format("YYYY-MM-DD");
      const totals = report.grandTotals ?? computeTotals(report);
      const previous = map.get(dateKey);
      const salesValue = normalizeMetric(totals.salesAchievedAED);
      const reportId = resolveReportId(report);
      if (previous) {
        previous.totalSales += salesValue;
        previous.count += 1;
        if (reportId) {
          previous.reportIds.push(reportId);
        }
      } else {
        map.set(dateKey, {
          totalSales: salesValue,
          count: 1,
          reportIds: reportId ? [reportId] : []
        });
      }
    });
    return map;
  }, [reports]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => weekRange.start.add(index, "day"));
  }, [weekRange]);

  const totalsSummary = useMemo(() => {
    const reportDays = weekDays.filter((day) =>
      reportSummaries.has(day.format("YYYY-MM-DD"))
    );
    const totalSales = reportDays.reduce((acc, day) => {
      const summary = reportSummaries.get(day.format("YYYY-MM-DD"));
      return acc + (summary?.totalSales ?? 0);
    }, 0);
    return {
      reportDaysCount: reportDays.length,
      missingDays: Math.max(7 - reportDays.length, 0),
      totalSales
    };
  }, [reportSummaries, weekDays]);

  const handleWeekChange = (direction: "prev" | "next") => {
    setWeekStart((prev) =>
      direction === "prev" ? prev.subtract(1, "week") : prev.add(1, "week")
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Weekly View</h2>
        <p className="mt-2 text-sm text-text-muted">
          Weekly snapshot of sales reports with totals and missing days.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-4 py-2 shadow-soft">
          <button
            type="button"
            onClick={() => handleWeekChange("prev")}
            className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted hover:text-text-primary"
          >
            Prev
          </button>
          <span className="text-sm font-semibold text-text-primary">
            {weekRange.start.format("MMM D")} - {weekRange.end.format("MMM D, YYYY")}
          </span>
          <button
            type="button"
            onClick={() => handleWeekChange("next")}
            className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted hover:text-text-primary"
          >
            Next
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span className="flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-brand-primary" />
            Report added
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            No report
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Report Days</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {totalsSummary.reportDaysCount}
          </p>
          <p className="mt-1 text-xs text-text-muted">Reports submitted this week.</p>
        </div>
        <div className="rounded-xl bg-surface-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Missing Days</p>
          <p className="mt-2 text-2xl font-semibold text-rose-200">
            {totalsSummary.missingDays}
          </p>
          <p className="mt-1 text-xs text-text-muted">Days without a report.</p>
        </div>
        <div className="rounded-xl bg-surface-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Total Sales</p>
          <p className="mt-2 text-2xl font-semibold text-brand-primary">
            AED {formatNumber(totalsSummary.totalSales)}
          </p>
          <p className="mt-1 text-xs text-text-muted">Sum of report totals.</p>
        </div>
      </div>

      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        {loading && !hasLoaded ? (
          <LoadingSkeleton lines={6} />
        ) : error ? (
          <ErrorState
            title="Weekly view unavailable"
            description={error}
            onRetry={load}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {weekDays.map((day) => {
                const dateKey = day.format("YYYY-MM-DD");
                const summary = reportSummaries.get(dateKey);
                const hasReport = Boolean(summary);
                const isMissing = !hasReport;
                const isToday = day.isSame(dayjs(), "day");

                return (
                  <div
                    key={dateKey}
                    className={clsx(
                      "min-h-[120px] rounded-xl border p-3 transition",
                      "border-border-subtle",
                      hasReport && "bg-brand-primary/10",
                      isMissing && "bg-rose-500/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-text-primary">
                          {day.format("ddd")}
                        </p>
                        <p className="text-[11px] text-text-muted">{day.format("MMM D")}</p>
                      </div>
                      {isToday ? (
                        <span className="rounded-full bg-brand-primary/20 px-2 py-0.5 text-[10px] text-brand-primary">
                          Today
                        </span>
                      ) : null}
                    </div>
                    {hasReport ? (
                      <div className="mt-3 space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                          Total Sales
                        </p>
                        <p className="text-sm font-semibold text-brand-primary">
                          AED {formatNumber(summary?.totalSales)}
                        </p>
                        {summary && summary.count > 1 ? (
                          <p className="text-[11px] text-text-muted">
                            {summary.count} reports
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 text-xs text-rose-200">No report</div>
                    )}
                  </div>
                );
              })}
            </div>
            {!reports.length ? (
              <EmptyState
                title="No sales reports in this week"
                description="Add daily sales reports to populate the weekly view."
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
