"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "antd";
import DataTable, { type TableColumn } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import StatusBadge from "@/components/common/StatusBadge";
import { auditLogsApi } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/utils/format";
import type { AuditLog } from "@/types/audit";

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

const resolvePerformerLabel = (log: AuditLog) => {
  const performer = log.performedBy;
  if (!performer) return "System";
  if (typeof performer === "string") return performer;
  return performer.name || performer.email || performer.id || performer._id || "User";
};

const resolvePerformerDisplay = (log: AuditLog) => {
  const performer = log.performedBy;
  if (!performer) {
    return { primary: "System", secondary: "", title: undefined };
  }
  if (typeof performer === "string") {
    return { primary: truncateText(performer, 24), secondary: "", title: performer };
  }
  const primary = performer.name || performer.email || performer.id || performer._id || "User";
  const secondary = performer.name && performer.email ? performer.email : "";
  const title = [performer.name, performer.email, performer.id, performer._id]
    .filter(Boolean)
    .join(" ");
  return { primary, secondary, title };
};

export default function AuditLogsPageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditLogsApi.list();
      setLogs(data ?? []);
    } catch (err) {
      setError("Unable to load audit logs.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const searchableLogs = useMemo(
    () =>
      logs.map((log) => ({
        log,
        searchText: [
          log.action,
          log.entityType,
          log.entityId,
          resolvePerformerLabel(log),
          stringifyValue(log.previousValue),
          stringifyValue(log.newValue),
          stringifyValue(log.details)
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      })),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return searchableLogs
      .filter((item) => item.searchText.includes(query))
      .map((item) => item.log);
  }, [logs, searchableLogs, search]);

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
          return (
            <div>
              <p className="font-semibold text-text-primary">{formatEntityType(row.entityType)}</p>
              <p className="truncate text-xs text-text-muted" title={entityId}>
                {entityId}
              </p>
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
    []
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

  if (!logs.length) {
    return (
      <EmptyState
        title="No audit logs yet"
        description="Activity will appear here as staff members take action."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{filteredLogs.length} logs</p>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
          placeholder="Search actions, entities, people"
          className="min-w-[220px] flex-1"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        emptyState="No audit logs match your search."
      />
    </div>
  );
}
