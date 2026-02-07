"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Pagination, Select } from "antd";
import dayjs from "dayjs";
import DataTable, { type TableColumn } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import StatusBadge from "@/components/common/StatusBadge";
import { auditLogsApi, usersApi } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/utils/format";
import type { AuditLog } from "@/types/audit";
import type { User } from "@/types/user";
import type { AuditLogListMeta } from "@/lib/api/auditLogs";

const formatEntityType = (value?: string) => {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const extractFieldChange = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const record = value as { field?: unknown; value?: unknown };
  if (record.field === undefined && record.value === undefined) return null;
  return {
    field: record.field ? String(record.field) : undefined,
    value: record.value
  };
};

const buildChangeSummary = (log: AuditLog) => {
  const previousField = extractFieldChange(log.previousValue);
  const nextField = extractFieldChange(log.newValue);

  if (previousField || nextField) {
    const fieldName = nextField?.field || previousField?.field || "field";
    const prevValue = stringifyValue(previousField?.value);
    const nextValue = stringifyValue(nextField?.value);
    if (prevValue === "-" && nextValue !== "-") return `${fieldName}: set to ${nextValue}`;
    if (prevValue !== "-" && nextValue === "-") return `${fieldName}: cleared from ${prevValue}`;
    if (prevValue === nextValue) return `${fieldName}: ${nextValue}`;
    return `${fieldName}: ${prevValue} -> ${nextValue}`;
  }

  const prevValue = stringifyValue(log.previousValue);
  const nextValue = stringifyValue(log.newValue);
  if (prevValue === "-" && nextValue === "-") {
    const detailsValue = stringifyValue(log.details);
    return detailsValue === "-" ? "-" : detailsValue;
  }
  if (prevValue === "-" && nextValue !== "-") return `Set to ${nextValue}`;
  if (prevValue !== "-" && nextValue === "-") return `Cleared from ${prevValue}`;
  if (prevValue === nextValue) return prevValue;
  return `${prevValue} -> ${nextValue}`;
};

const truncateText = (value: string, maxLength = 80) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
};

const resolveTimestamp = (log: AuditLog) => log.timestamp ?? log.createdAt;

const resolveEntityDetails = (log: AuditLog) => {
  if (log.entityType === "task") {
    return {
      primary: log.entity?.title,
      secondary: undefined
    };
  }
  if (log.entityType === "remark") {
    let remarkSummary = log.entity?.text;
    if (!remarkSummary && log.entity?.remarkType === "audio") {
      const duration = log.entity.audioDurationSec
        ? `${log.entity.audioDurationSec}s`
        : "Audio";
      remarkSummary = `Audio remark (${duration})`;
    }
    return {
      primary: remarkSummary,
      secondary: log.entity?.taskTitle ? `Task: ${log.entity.taskTitle}` : undefined
    };
  }
  return {
    primary: undefined,
    secondary: undefined
  };
};

const PAGE_SIZE = 100;

export default function AuditLogsPageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<AuditLogListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [performedBy, setPerformedBy] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        pageSize: PAGE_SIZE,
        ...(performedBy ? { performedBy } : {}),
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {})
      };
      const response = await auditLogsApi.list(params);
      if (Array.isArray(response)) {
        setLogs(response ?? []);
        setPagination({
          page,
          pageSize: PAGE_SIZE,
          total: response.length,
          totalPages: Math.max(Math.ceil(response.length / PAGE_SIZE), 1)
        });
      } else {
        setLogs(response?.data ?? []);
        setPagination(response?.meta ?? null);
      }
    } catch (err) {
      setError("Unable to load audit logs.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [page, performedBy, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    if (usersLoaded) return () => {};
    const loadUsers = async () => {
      try {
        const data = await usersApi.list();
        if (active) {
          setUsers(data ?? []);
        }
      } catch {
        if (active) {
          setUsers([]);
        }
      } finally {
        if (active) {
          setUsersLoaded(true);
        }
      }
    };
    void loadUsers();
    return () => {
      active = false;
    };
  }, [usersLoaded]);

  const usersById = useMemo(() => {
    const entries = users
      .map((user) => {
        const id = String(user.id ?? user._id ?? "");
        if (!id) return null;
        return [id, user] as const;
      })
      .filter(Boolean) as Array<[string, User]>;
    return new Map(entries);
  }, [users]);

  const performerOptions = useMemo(
    () =>
      users
        .map((user) => {
          const id = String(user.id ?? user._id ?? "");
          if (!id) return null;
          const labelBase = user.name || user.email || id;
          const label = user.name && user.email ? `${user.name} (${user.email})` : labelBase;
          return { value: id, label };
        })
        .filter(Boolean) as Array<{ value: string; label: string }>,
    [users]
  );

  const resolvePerformerLabel = useCallback(
    (log: AuditLog) => {
      const performer = log.performedBy;
      if (!performer) return "System";
      if (typeof performer === "string") {
        const user = usersById.get(performer);
        if (user) {
          return [user.name, user.email, performer].filter(Boolean).join(" ");
        }
        return performer;
      }
      return [performer.name, performer.email, performer.id, performer._id]
        .filter(Boolean)
        .join(" ");
    },
    [usersById]
  );

  const searchableLogs = useMemo(
    () =>
      logs.map((log) => {
        const entityDetails = resolveEntityDetails(log);
        return {
          log,
          searchText: [
            log.action,
            log.entityType,
            log.entityId,
            resolvePerformerLabel(log),
            entityDetails.primary,
            entityDetails.secondary,
            stringifyValue(log.previousValue),
            stringifyValue(log.newValue),
            stringifyValue(log.details)
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        };
      }),
    [logs, resolvePerformerLabel]
  );

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return searchableLogs
      .filter((item) => item.searchText.includes(query))
      .map((item) => item.log);
  }, [logs, searchableLogs, search]);

  const resolvePerformerDisplay = useCallback(
    (log: AuditLog) => {
      const performer = log.performedBy;
      if (!performer) {
        return { primary: "System", secondary: "", title: undefined };
      }
      if (typeof performer === "string") {
        const user = usersById.get(performer);
        if (user) {
          return {
            primary: user.name || user.email || performer,
            secondary: user.name && user.email ? user.email : "",
            title: performer
          };
        }
        return { primary: truncateText(performer, 24), secondary: "", title: performer };
      }
      const primary = performer.name || performer.email || performer.id || performer._id || "User";
      const secondary = performer.name && performer.email ? performer.email : "";
      const title = [performer.name, performer.email, performer.id, performer._id]
        .filter(Boolean)
        .join(" ");
      return { primary, secondary, title };
    },
    [usersById]
  );

  const columns = useMemo<TableColumn<AuditLog>[]>(
    () => [
      {
        key: "timestamp",
        header: "Time",
        className: "whitespace-nowrap",
        render: (row) => {
          const timestamp = resolveTimestamp(row);
          return (
            <div>
              <p className="font-semibold text-text-primary">{formatDateTime(timestamp)}</p>
              <p className="text-xs text-text-muted">{formatRelative(timestamp)}</p>
            </div>
          );
        }
      },
      {
        key: "action",
        header: "Action",
        render: (row) => <StatusBadge label={row.action || "unknown"} />
      },
      {
        key: "entity",
        header: "Entity",
        render: (row) => {
          const entityId = row.entityId ? String(row.entityId) : "-";
          const entityDetails = resolveEntityDetails(row);
          return (
            <div title={entityId}>
              <p className="font-semibold text-text-primary">{formatEntityType(row.entityType)}</p>
              {entityDetails.primary ? (
                <p className="truncate text-xs text-text-muted" title={entityDetails.primary}>
                  {entityDetails.primary}
                </p>
              ) : null}
              {entityDetails.secondary ? (
                <p className="truncate text-[11px] text-text-muted/80" title={entityDetails.secondary}>
                  {entityDetails.secondary}
                </p>
              ) : null}
            </div>
          );
        }
      },
      {
        key: "performedBy",
        header: "Performed By",
        render: (row) => {
          const performer = resolvePerformerDisplay(row);
          return (
            <div title={performer.title}>
              <p className="font-semibold text-text-primary">{performer.primary}</p>
              {performer.secondary ? (
                <p className="text-xs text-text-muted">{performer.secondary}</p>
              ) : null}
            </div>
          );
        }
      },
      {
        key: "change",
        header: "Change",
        className: "max-w-[320px]",
        render: (row) => {
          const summary = buildChangeSummary(row);
          const display = truncateText(summary, 100);
          return (
            <p className="truncate text-xs text-text-muted" title={summary}>
              {display}
            </p>
          );
        }
      }
    ],
    [resolvePerformerDisplay]
  );

  if (loading && !hasLoaded) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Audit log feed unavailable" description={error} onRetry={load} />;
  }

  const hasActiveFilters =
    Boolean(search.trim()) || Boolean(performedBy) || Boolean(dateFrom) || Boolean(dateTo);
  const totalLogs = pagination?.total ?? logs.length;
  const visibleLogs = filteredLogs.length;
  const countLabel = search.trim()
    ? `${visibleLogs} of ${totalLogs} logs`
    : `${totalLogs} logs`;

  if (!logs.length && !hasActiveFilters) {
    return (
      <EmptyState
        title="No audit logs yet"
        description="Activity will appear here as staff members take action."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-text-muted">{countLabel}</p>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
          placeholder="Search actions, entities, people"
          className="min-w-[220px] flex-1"
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Performed by"
          value={performedBy}
          onChange={(value) => {
            setPerformedBy(value);
            setPage(1);
          }}
          options={performerOptions}
          className="min-w-[220px]"
        />
        <DatePicker.RangePicker
          showTime
          allowClear
          value={
            dateFrom && dateTo ? [dayjs(dateFrom), dayjs(dateTo)] : null
          }
          onChange={(dates) => {
            if (!dates || !dates[0] || !dates[1]) {
              setDateFrom(undefined);
              setDateTo(undefined);
              setPage(1);
              return;
            }
            setDateFrom(dates[0].toISOString());
            setDateTo(dates[1].toISOString());
            setPage(1);
          }}
          className="min-w-[260px]"
          format="YYYY-MM-DD HH:mm"
          placeholder={["From", "To"]}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        emptyState={hasActiveFilters ? "No audit logs match the current filters." : "No audit logs yet."}
      />

      {pagination && pagination.total > pagination.pageSize ? (
        <div className="flex justify-end">
          <Pagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      ) : null}
    </div>
  );
}
