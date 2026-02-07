"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Popconfirm, Space, Table, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { salesReportsApi } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils/format";
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
  let totalSalesCount = 0;

  report.salesHeads?.forEach((head) => {
    const directors = head.directors || [];
    totalSalesCount += directors.length;
    directors.forEach((director) => {
      const metrics = director.metrics || ({} as SalesReportGrandTotals);
      totals.activeTeamMembers += normalizeMetric(metrics.activeTeamMembers);
      totals.clientMeetings += normalizeMetric(metrics.clientMeetings);
      totals.cpMeetingsHeadOffice += normalizeMetric(metrics.cpMeetingsHeadOffice);
      totals.cpMeetingsChannelPartner += normalizeMetric(metrics.cpMeetingsChannelPartner);
      totals.salesAchievedAED += normalizeMetric(metrics.salesAchievedAED);
    });
  });

  return { totals, totalSalesCount };
};

const resolveReportId = (report: DailySalesReport) => report.id ?? report._id ?? "";

export default function SalesReportsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [reports, setReports] = useState<DailySalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toastHandledRef = useRef<{ saved?: string | null; updated?: string | null }>({});
  // Use the global message API to avoid duplicate holders in the tree.

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesReportsApi.list();
      setReports(data ?? []);
    } catch (err) {
      setError("Unable to load sales reports.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const saved = searchParams?.get("saved");
    const updated = searchParams?.get("updated");
    if (saved) {
      if (toastHandledRef.current.saved === saved) return;
      toastHandledRef.current.saved = saved;
      message.success("Report saved.");
      router.replace("/sales-reports");
    } else if (updated) {
      if (toastHandledRef.current.updated === updated) return;
      toastHandledRef.current.updated = updated;
      message.success("Report updated.");
      router.replace("/sales-reports");
    }
  }, [router, searchParams]);

  const handleDelete = async (report: DailySalesReport) => {
    const reportId = resolveReportId(report);
    if (!reportId) return;
    setDeletingId(reportId);
    try {
      await salesReportsApi.remove(reportId);
      message.success("Report deleted.");
      await load();
    } catch (err) {
      message.error("Failed to delete report.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !hasLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Daily Reports (0)</h2>
          <p className="mt-2 text-sm text-text-muted">
            Track daily performance across sales leaders.
          </p>
        </div>
        <div className="rounded-xl bg-surface-card p-6 shadow-card">
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Daily Reports (0)</h2>
          <p className="mt-2 text-sm text-text-muted">
            Track daily performance across sales leaders.
          </p>
        </div>
        <ErrorState
          title="Sales report feed unavailable"
          description={error}
          onRetry={load}
        />
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Daily Reports (0)</h2>
          <p className="mt-2 text-sm text-text-muted">
            Track daily performance across sales leaders.
          </p>
        </div>
        <EmptyState
          title="No daily sales reports"
          description="Create the first report to start tracking results."
        />
        <span className="fixed bottom-6 right-6">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/sales-reports/new")}
            className="rounded-full shadow-soft"
          >
            Add Daily Sales Report
          </Button>
        </span>
      </div>
    );
  }

  const columns: ColumnsType<DailySalesReport> = [
    {
      key: "reportDate",
      dataIndex: "reportDate",
      title: "Report Date",
      render: (_value, row) =>
        row.reportDate ? formatDate(`${row.reportDate}T00:00:00`) : "-"
    },
    {
      key: "totalSalesAED",
      title: "Total Sales AED",
      render: (_value, row) => {
        const derived = computeTotals(row);
        const totals = row.grandTotals ?? derived.totals;
        return formatNumber(totals.salesAchievedAED ?? derived.totals.salesAchievedAED);
      }
    },
    {
      key: "totalSalesCount",
      title: "Total Sales Count#",
      render: (_value, row) => {
        const derived = computeTotals(row);
        return formatNumber(derived.totalSalesCount);
      }
    },
    {
      key: "totalMeetings",
      title: "Total Meetings",
      render: (_value, row) => {
        const derived = computeTotals(row);
        const totals = row.grandTotals ?? derived.totals;
        const totalMeetings =
          normalizeMetric(totals.clientMeetings) +
          normalizeMetric(totals.cpMeetingsHeadOffice) +
          normalizeMetric(totals.cpMeetingsChannelPartner);
        return formatNumber(totalMeetings);
      }
    },
    {
      key: "createdAt",
      dataIndex: "createdAt",
      title: "Created At",
      render: (_value, row) => formatDateTime(row.createdAt)
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_value, row) => {
        const reportId = resolveReportId(row);
        if (!reportId) return null;
        return (
          <Space size="small" className="justify-end">
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/sales-reports/${reportId}/edit`);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete daily sales report?"
                description="This action cannot be undone."
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
                onConfirm={() => handleDelete(row)}
              >
                <Button
                  type="text"
                  danger
                  loading={deletingId === reportId}
                  icon={<DeleteOutlined />}
                  onClick={(event) => event.stopPropagation()}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Sales Reports</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">
          Daily Reports ({reports.length})
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Track daily performance across sales leaders.
        </p>
      </div>

      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <Table
          columns={columns}
          dataSource={reports}
          rowKey={(record) => resolveReportId(record) || record.reportDate}
          locale={{ emptyText: "No sales reports yet." }}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <span className="fixed bottom-6 right-6">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/sales-reports/new")}
          className="rounded-full shadow-soft"
        >
          Add Daily Sales Report
        </Button>
      </span>
    </div>
  );
}
