"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import dayjs, { type Dayjs } from "dayjs";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { salesReportsApi } from "@/lib/api";
import type { DailySalesReport, SalesReportGrandTotals } from "@/types/salesReport";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export default function SalesReportsCalendarClient() {
  const [month, setMonth] = useState<Dayjs>(() => dayjs().startOf("month"));
  const [reports, setReports] = useState<DailySalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthRange = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    return { start, end };
  }, [month]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesReportsApi.list({
        reportDateFrom: monthRange.start.format("YYYY-MM-DD"),
        reportDateTo: monthRange.end.format("YYYY-MM-DD"),
        sortBy: "reportDate",
        sortDir: "asc",
        page: 1,
        pageSize: 200
      });
      const data = Array.isArray(response) ? response : response?.data ?? [];
      setReports(data);
    } catch (err) {
      setError("Unable to load sales reports for this month.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [monthRange]);

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

  const calendarDays = useMemo(() => {
    const start = monthRange.start.startOf("week");
    const end = monthRange.end.endOf("week");
    const days: Dayjs[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      days.push(current);
      current = current.add(1, "day");
    }
    return days;
  }, [monthRange]);

  const totalsSummary = useMemo(() => {
    const totalDaysInMonth = monthRange.start.daysInMonth();
    const reportDays = Array.from(reportSummaries.keys()).filter((key) =>
      dayjs(key).isSame(monthRange.start, "month")
    );
    const totalSales = reportDays.reduce((acc, key) => {
      const summary = reportSummaries.get(key);
      return acc + (summary?.totalSales ?? 0);
    }, 0);
    return {
      totalDaysInMonth,
      reportDaysCount: reportDays.length,
      missingDays: Math.max(totalDaysInMonth - reportDays.length, 0),
      totalSales
    };
  }, [monthRange, reportSummaries]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setMonth((prev) =>
      direction === "prev" ? prev.subtract(1, "month") : prev.add(1, "month")
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Calendar View</h2>
        <p className="mt-2 text-sm text-text-muted">
          Monthly view of daily sales reports, highlighting missing days and totals.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-4 py-2 shadow-soft">
          <button
            type="button"
            onClick={() => handleMonthChange("prev")}
            className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted hover:text-text-primary"
          >
            Prev
          </button>
          <span className="text-sm font-semibold text-text-primary">
            {monthRange.start.format("MMMM YYYY")}
          </span>
          <button
            type="button"
            onClick={() => handleMonthChange("next")}
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
          <p className="mt-1 text-xs text-text-muted">
            Reports submitted this month.
          </p>
        </div>
        <div className="rounded-xl bg-surface-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Missing Days</p>
          <p className="mt-2 text-2xl font-semibold text-rose-200">
            {totalsSummary.missingDays}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Days without a report.
          </p>
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
          <LoadingSkeleton lines={8} />
        ) : error ? (
          <ErrorState
            title="Calendar unavailable"
            description={error}
            onRetry={load}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-3 text-xs uppercase tracking-[0.2em] text-text-muted">
              {weekDays.map((day) => (
                <div key={day} className="px-2 text-center">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day) => {
                const isCurrentMonth = day.isSame(monthRange.start, "month");
                const isToday = day.isSame(dayjs(), "day");
                const dateKey = day.format("YYYY-MM-DD");
                const summary = reportSummaries.get(dateKey);
                const hasReport = Boolean(summary);
                const isMissing = isCurrentMonth && !hasReport;

                return (
                  <div
                    key={dateKey}
                    className={clsx(
                      "min-h-[120px] rounded-xl border p-3 transition",
                      isCurrentMonth
                        ? "border-border-subtle"
                        : "border-border-subtle/40 opacity-60",
                      hasReport && "bg-brand-primary/10",
                      isMissing && "bg-rose-500/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          "text-xs font-semibold",
                          isCurrentMonth ? "text-text-primary" : "text-text-muted"
                        )}
                      >
                        {day.date()}
                      </span>
                      {isToday ? (
                        <span className="rounded-full bg-brand-primary/20 px-2 py-0.5 text-[10px] text-brand-primary">
                          Today
                        </span>
                      ) : null}
                    </div>
                    {isCurrentMonth ? (
                      hasReport ? (
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
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
            {!reports.length ? (
              <EmptyState
                title="No sales reports in this month"
                description="Add daily sales reports to populate the calendar."
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
