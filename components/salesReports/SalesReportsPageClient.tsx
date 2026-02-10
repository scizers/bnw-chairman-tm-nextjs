"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, DatePicker, Pagination, Popconfirm, Space, Table, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { salesReportsApi } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { DailySalesReport, SalesReportGrandTotals } from "@/types/salesReport";
import type { SalesReportListMeta, SalesReportListQuery } from "@/lib/api/salesReports";
import dayjs from "dayjs";

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

  return { totals };
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
  const [pagination, setPagination] = useState<SalesReportListMeta | null>(null);
  const [query, setQuery] = useState<SalesReportListQuery>({
    sortBy: "reportDate",
    sortDir: "desc"
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const toastHandledRef = useRef<{ saved?: string | null; updated?: string | null }>({});
  // Use the global message API to avoid duplicate holders in the tree.

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesReportsApi.list({ ...query, page, pageSize });
      if (Array.isArray(response)) {
        setReports(response ?? []);
        setPagination(null);
      } else {
        setReports(response?.data ?? []);
        setPagination(response?.meta ?? null);
      }
    } catch (err) {
      setError("Unable to load sales reports.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [query, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 200);
    return () => clearTimeout(timer);
  }, [query, load]);

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
          <h2 className="mt-2 font-display text-3xl text-text-primary">Daily Sales Reports (0)</h2>
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
          <h2 className="mt-2 font-display text-3xl text-text-primary">Daily Sales Reports (0)</h2>
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

  const columns: ColumnsType<DailySalesReport> = [
    {
      key: "reportDate",
      dataIndex: "reportDate",
      title: "Report Date",
      sorter: true,
      sortOrder:
        query.sortBy === "reportDate" ? (query.sortDir === "asc" ? "ascend" : "descend") : null,
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
      key: "activeTeamMembers",
      title: "Active Team Members",
      render: (_value, row) => {
        const derived = computeTotals(row);
        const totals = row.grandTotals ?? derived.totals;
        return formatNumber(totals.activeTeamMembers ?? derived.totals.activeTeamMembers);
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
      sorter: true,
      sortOrder:
        query.sortBy === "createdAt" ? (query.sortDir === "asc" ? "ascend" : "descend") : null,
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
            <Tooltip title="View">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/sales-reports/${reportId}`);
                }}
              />
            </Tooltip>
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
          Daily Sales Reports ({pagination?.total ?? reports.length})
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Track daily performance across sales leaders.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Report Date
          </span>
          <DatePicker.RangePicker
            value={
              reportDateFrom || reportDateTo
                ? [
                    reportDateFrom ? dayjs(reportDateFrom) : null,
                    reportDateTo ? dayjs(reportDateTo) : null
                  ]
                : null
            }
            onChange={(dates) => {
              const [start, end] = Array.isArray(dates) ? dates : [];
              const nextFrom = start ? start.format("YYYY-MM-DD") : "";
              const nextTo = end ? end.format("YYYY-MM-DD") : "";
              setReportDateFrom(nextFrom);
              setReportDateTo(nextTo);
              setQuery((prev) => ({
                ...prev,
                reportDateFrom: nextFrom || undefined,
                reportDateTo: nextTo || undefined
              }));
              setPage(1);
            }}
            className="min-w-[240px]"
            allowClear
            format="YYYY-MM-DD"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Created
          </span>
          <DatePicker.RangePicker
            value={
              createdFrom || createdTo
                ? [
                    createdFrom ? dayjs(createdFrom) : null,
                    createdTo ? dayjs(createdTo) : null
                  ]
                : null
            }
            onChange={(dates) => {
              const [start, end] = Array.isArray(dates) ? dates : [];
              const nextFrom = start ? start.format("YYYY-MM-DD") : "";
              const nextTo = end ? end.format("YYYY-MM-DD") : "";
              setCreatedFrom(nextFrom);
              setCreatedTo(nextTo);
              setQuery((prev) => ({
                ...prev,
                createdFrom: nextFrom || undefined,
                createdTo: nextTo || undefined
              }));
              setPage(1);
            }}
            className="min-w-[240px]"
            allowClear
            format="YYYY-MM-DD"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="default"
            onClick={() => {
              setReportDateFrom("");
              setReportDateTo("");
              setCreatedFrom("");
              setCreatedTo("");
              setQuery({ sortBy: "reportDate", sortDir: "desc" });
              setPage(1);
              setPageSize(10);
            }}
            className="rounded-full border-border-subtle"
          >
            Reset
          </Button>
          <Button
            type="default"
            onClick={load}
            className="rounded-full border-border-subtle"
          >
            Reload
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <Table
          columns={columns}
          dataSource={reports}
          rowKey={(record) => resolveReportId(record) || record.reportDate}
          locale={{ emptyText: "No sales reports yet." }}
          pagination={false}
          loading={loading}
          onChange={(_pager, _filters, sorter) => {
            const normalizedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
            const sorterKey =
              typeof normalizedSorter?.columnKey === "string"
                ? normalizedSorter.columnKey
                : typeof normalizedSorter?.field === "string"
                  ? normalizedSorter.field
                  : null;
            const sorterOrder = normalizedSorter?.order;
            if (sorterOrder && (sorterKey === "reportDate" || sorterKey === "createdAt")) {
              setQuery((prev) => ({
                ...prev,
                sortBy: sorterKey as SalesReportListQuery["sortBy"],
                sortDir: sorterOrder === "ascend" ? "asc" : "desc"
              }));
              setPage(1);
              return;
            }
          }}
        />
        {pagination?.total && pagination.total > 0 ? (
          <div className="mt-4 flex justify-end">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={pagination.total}
              showSizeChanger
              pageSizeOptions={["10", "20", "50"]}
              onChange={(nextPage, nextPageSize) => {
                const resolvedSize = nextPageSize ?? pageSize;
                setPage(resolvedSize !== pageSize ? 1 : nextPage);
                setPageSize(resolvedSize);
              }}
            />
          </div>
        ) : null}
      </div>

      {!reports.length && !loading ? (
        <EmptyState
          title="No daily sales reports"
          description="Create the first report to start tracking results."
        />
      ) : null}

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
