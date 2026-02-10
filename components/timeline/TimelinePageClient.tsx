"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DatePicker, Input, Pagination, Select } from "antd";
import dayjs from "dayjs";
import clsx from "clsx";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { timelineApi, usersApi } from "@/lib/api";
import { formatDate, formatDateTime, formatRelative } from "@/lib/utils/format";
import type { AuditLog } from "@/types/audit";
import type { User } from "@/types/user";
import type { AuditLogListMeta } from "@/lib/api/auditLogs";

const PAGE_SIZE = 60;

type RangePreset = "today" | "week" | "all" | "custom";

type TimelineTone = "remark" | "task" | "mom" | "success" | "default";

type TimelineEvent = {
  title: string;
  badge: string;
  tone: TimelineTone;
  summary?: string;
  task?: { id: string; title?: string };
  mom?: { id: string; title?: string };
  remarkText?: string;
};

type TimelineItem = {
  log: AuditLog;
  event: TimelineEvent;
};

const toneStyles: Record<TimelineTone, { dot: string; badge: string; ring: string }> = {
  remark: {
    dot: "bg-brand-primary",
    badge: "bg-brand-primary/15 text-brand-primary border-brand-primary/40",
    ring: "ring-brand-primary/15"
  },
  task: {
    dot: "bg-sky-400",
    badge: "bg-sky-500/15 text-sky-200 border-sky-400/40",
    ring: "ring-sky-400/15"
  },
  mom: {
    dot: "bg-amber-400",
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/40",
    ring: "ring-amber-400/15"
  },
  success: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
    ring: "ring-emerald-400/20"
  },
  default: {
    dot: "bg-white/25",
    badge: "bg-white/10 text-text-muted border-white/10",
    ring: "ring-white/10"
  }
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

const toSentenceCase = (value: string) => {
  if (!value) return value;
  const withSpaces = value
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

const formatFieldLabel = (field?: string) => {
  if (!field) return "Field";
  return toSentenceCase(field);
};

const isDateField = (field?: string) => {
  if (!field) return false;
  return /date/i.test(field) || /at$/i.test(field);
};

const formatFieldValue = (field: string | undefined, value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    if (isDateField(field)) {
      const dateValue = value instanceof Date ? value : new Date(value);
      if (!Number.isNaN(dateValue.getTime())) {
        return formatDate(dateValue.toISOString());
      }
    }
    return String(value);
  }
  if (typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildChangeSummary = (log: AuditLog) => {
  const previousField = extractFieldChange(log.previousValue);
  const nextField = extractFieldChange(log.newValue);

  if (previousField || nextField) {
    const rawField = nextField?.field || previousField?.field || "field";
    const fieldName = formatFieldLabel(rawField);
    const prevValue = formatFieldValue(rawField, previousField?.value);
    const nextValue = formatFieldValue(rawField, nextField?.value);
    if (prevValue === "-" && nextValue !== "-") return `${fieldName}: set to ${nextValue}`;
    if (prevValue !== "-" && nextValue === "-") return `${fieldName}: cleared from ${prevValue}`;
    if (prevValue === nextValue) return `${fieldName}: ${nextValue}`;
    return `${fieldName}: ${prevValue} -> ${nextValue}`;
  }

  const prevValue = stringifyValue(log.previousValue);
  const nextValue = stringifyValue(log.newValue);
  if (prevValue === "-" && nextValue === "-") return "-";
  if (prevValue === "-" && nextValue !== "-") return `Set to ${nextValue}`;
  if (prevValue !== "-" && nextValue === "-") return `Cleared from ${prevValue}`;
  if (prevValue === nextValue) return prevValue;
  return `${prevValue} -> ${nextValue}`;
};

const truncateText = (value: string, maxLength = 140) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
};

const resolveTimestamp = (log: AuditLog) => log.timestamp ?? log.createdAt;

const renderSummaryText = (text: string) => {
  const parts = text.split("->");
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part.trim()}
          {index < parts.length - 1 ? (
            <span className="mx-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-text-muted">
              →
            </span>
          ) : null}
          {index < parts.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
};

const resolveRemarkSummary = (log: AuditLog) => {
  const entityText = log.entity?.text;
  if (entityText) return entityText;
  const newValue = log.newValue as { text?: string; type?: string; audioDurationSec?: number } | null;
  const previousValue = log.previousValue as
    | { text?: string; type?: string; audioDurationSec?: number }
    | null;
  const text = newValue?.text || previousValue?.text;
  if (text) return text;
  const remarkType = log.entity?.remarkType || newValue?.type || previousValue?.type;
  if (remarkType === "audio") {
    const duration =
      log.entity?.audioDurationSec ?? newValue?.audioDurationSec ?? previousValue?.audioDurationSec;
    return duration ? `Audio remark (${duration}s)` : "Audio remark";
  }
  return undefined;
};

const resolveFieldChange = (log: AuditLog) => {
  const previousField = extractFieldChange(log.previousValue);
  const nextField = extractFieldChange(log.newValue);
  if (!previousField && !nextField) return null;
  return {
    field: nextField?.field || previousField?.field,
    previousValue: previousField?.value,
    nextValue: nextField?.value
  };
};

const formatStatus = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  return toSentenceCase(String(value).replace(/_/g, " "));
};

const resolveTaskId = (log: AuditLog) => {
  const newValue = log.newValue as { taskId?: string } | null;
  return String(log.entity?.id || log.entityId || newValue?.taskId || "");
};

const resolveTaskTitle = (log: AuditLog) =>
  log.entity?.title || (log.newValue as { title?: string } | null)?.title;

const resolveMomId = (log: AuditLog) => String(log.entity?.id || log.entityId || "");

const resolveMomTitle = (log: AuditLog) =>
  log.entity?.title || (log.newValue as { title?: string } | null)?.title;

const isRelevantTimelineLog = (log: AuditLog) => {
  if (log.entityType === "task") {
    return log.action === "create" || log.action === "update";
  }
  if (log.entityType === "remark") {
    return log.action === "create";
  }
  if (log.entityType === "mom") {
    return log.action === "create";
  }
  return false;
};

const resolveTimelineEvent = (log: AuditLog): TimelineEvent | null => {
  if (!isRelevantTimelineLog(log)) return null;

  const action = log.action ?? "activity";

  if (log.entityType === "remark") {
    const remarkText = resolveRemarkSummary(log);
    const taskId = String(log.entity?.taskId || (log.newValue as { taskId?: string })?.taskId || "");
    const taskTitle = log.entity?.taskTitle;
    return {
      title: "Remark added",
      badge: "Remark",
      tone: "remark",
      remarkText: remarkText ? truncateText(remarkText, 180) : undefined,
      task: taskId ? { id: taskId, title: taskTitle } : undefined
    };
  }

  if (log.entityType === "mom") {
    const momId = resolveMomId(log);
    return {
      title: "Minutes of meeting added",
      badge: "MOM",
      tone: "mom",
      mom: momId ? { id: momId, title: resolveMomTitle(log) } : undefined
    };
  }

  const taskId = resolveTaskId(log);
  const task = taskId ? { id: taskId, title: resolveTaskTitle(log) } : undefined;

  if (action === "create") {
    return {
      title: "Task created",
      badge: "Task",
      tone: "task",
      task
    };
  }

  const fieldChange = resolveFieldChange(log);
  const isStatusChange = fieldChange?.field === "status";
  const nextStatus = isStatusChange ? String(fieldChange?.nextValue ?? "") : undefined;

  if (isStatusChange && nextStatus === "completed") {
    return {
      title: "Task completed",
      badge: "Task",
      tone: "success",
      summary: truncateText(buildChangeSummary(log), 120),
      task
    };
  }

  if (isStatusChange) {
    const previousStatus = formatStatus(fieldChange?.previousValue);
    const currentStatus = formatStatus(fieldChange?.nextValue);
    const summary = previousStatus && currentStatus
      ? `Status: ${previousStatus} -> ${currentStatus}`
      : truncateText(buildChangeSummary(log), 120);
    return {
      title: "Task status updated",
      badge: "Task",
      tone: "task",
      summary,
      task
    };
  }

  return {
    title: "Task updated",
    badge: "Task",
    tone: "task",
    summary: truncateText(buildChangeSummary(log), 120),
    task
  };
};

const buildDateRange = (preset: RangePreset) => {
  if (preset === "today") {
    const start = dayjs().startOf("day");
    const end = dayjs().endOf("day");
    return { from: start.toISOString(), to: end.toISOString() };
  }
  if (preset === "week") {
    const start = dayjs().subtract(6, "day").startOf("day");
    const end = dayjs().endOf("day");
    return { from: start.toISOString(), to: end.toISOString() };
  }
  return { from: undefined, to: undefined };
};

const formatDayLabel = (value: string) => {
  const date = dayjs(value);
  if (date.isSame(dayjs(), "day")) return "Today";
  if (date.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return date.format("MMM D, YYYY");
};

export default function TimelinePageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<AuditLogListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [performedBy, setPerformedBy] = useState<string | undefined>(undefined);
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);
  const [rangePreset, setRangePreset] = useState<RangePreset>("today");
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
        ...(entityType ? { entityType } : {}),
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {})
      };
      const response = await timelineApi.list(params);
      setLogs(response?.data ?? []);
      setPagination(response?.meta ?? null);
    } catch (err) {
      setError("Unable to load timeline activity.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [page, performedBy, entityType, dateFrom, dateTo]);

  useEffect(() => {
    const { from, to } = buildDateRange(rangePreset);
    if (rangePreset !== "custom") {
      setDateFrom(from);
      setDateTo(to);
      setPage(1);
    }
  }, [rangePreset]);

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

  const resolvePerformerName = useCallback(
    (log: AuditLog) => {
      const performer = log.performedBy;
      if (!performer) return "System";
      if (typeof performer === "string") {
        const user = usersById.get(performer);
        return user?.name || user?.email || "User";
      }
      return performer.name || performer.email || "User";
    },
    [usersById]
  );

  const entityOptions = useMemo(
    () => [
      { value: "task", label: "Task" },
      { value: "remark", label: "Remark" },
      { value: "mom", label: "MOM" }
    ],
    []
  );

  const relevantLogs = useMemo(() => logs.filter(isRelevantTimelineLog), [logs]);

  const searchableItems = useMemo(() => {
    return relevantLogs
      .map((log) => {
        const event = resolveTimelineEvent(log);
        if (!event) return null;
        const performerName = resolvePerformerName(log);
        const searchText = [
          event.title,
          event.summary,
          event.remarkText,
          event.task?.title,
          event.mom?.title,
          performerName
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return { log, event, searchText };
      })
      .filter(Boolean) as Array<TimelineItem & { searchText: string }>;
  }, [relevantLogs, resolvePerformerName]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return searchableItems.map(({ log, event }) => ({ log, event }));
    return searchableItems
      .filter((item) => item.searchText.includes(query))
      .map(({ log, event }) => ({ log, event }));
  }, [search, searchableItems]);

  const groupedItems = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: TimelineItem[] }> = [];
    let currentKey: string | null = null;
    filteredItems.forEach((item) => {
      const timestamp = resolveTimestamp(item.log);
      if (!timestamp) return;
      const key = dayjs(timestamp).format("YYYY-MM-DD");
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ key, label: formatDayLabel(key), items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    });
    return groups;
  }, [filteredItems]);

  if (loading && !hasLoaded) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Timeline unavailable" description={error} onRetry={load} />;
  }

  const totalLogs = pagination?.total ?? relevantLogs.length;
  const visibleLogs = filteredItems.length;
  const countLabel = search.trim() ? `${visibleLogs} of ${totalLogs} events` : `${totalLogs} events`;
  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(performedBy) ||
    Boolean(entityType) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  if (!logs.length && !hasActiveFilters) {
    return (
      <EmptyState
        title="No activity yet"
        description="Activity will appear here as staff members take action."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-text-muted">{countLabel}</p>
        <div className="flex flex-wrap items-center gap-2">
          {([
            { value: "today", label: "Today" },
            { value: "week", label: "Last 7 Days" },
            { value: "all", label: "All Time" }
          ] as Array<{ value: RangePreset; label: string }>).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRangePreset(option.value)}
              className={clsx(
                "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                rangePreset === option.value
                  ? "border-brand-primary/40 bg-brand-primary/15 text-brand-primary"
                  : "border-white/10 text-text-muted hover:text-text-primary hover:border-white/20"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
          placeholder="Search tasks, remarks, or people"
          className="min-w-[200px] flex-1"
        />
        <Select
          allowClear
          placeholder="Type"
          value={entityType}
          onChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
          options={entityOptions}
          className="min-w-[140px]"
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
          className="min-w-[200px]"
        />
        <DatePicker.RangePicker
          showTime
          allowClear
          value={dateFrom && dateTo ? [dayjs(dateFrom), dayjs(dateTo)] : null}
          onChange={(dates) => {
            if (!dates || !dates[0] || !dates[1]) {
              setDateFrom(undefined);
              setDateTo(undefined);
              setRangePreset("all");
              setPage(1);
              return;
            }
            setDateFrom(dates[0].toISOString());
            setDateTo(dates[1].toISOString());
            setRangePreset("custom");
            setPage(1);
          }}
          className="min-w-[240px]"
          format="YYYY-MM-DD HH:mm"
          placeholder={["From", "To"]}
        />
      </div>

      {groupedItems.length === 0 ? (
        <EmptyState
          title="No activity matches the current filters"
          description="Try adjusting your search or date range."
        />
      ) : (
        <div className="space-y-4">
          {groupedItems.map((group) => (
            <section key={group.key} className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-brand-primary" />
                <h3 className="font-display text-base text-text-primary">{group.label}</h3>
                <span className="text-[11px] text-text-muted">
                  {dayjs(group.key).format("MMMM D, YYYY")}
                </span>
              </div>
              <div className="relative pl-7">
                <div className="absolute left-[10px] top-0 h-full w-px bg-white/10" />
                <div className="space-y-2.5">
                  {group.items.map((item) => {
                    const { log, event } = item;
                    const timestamp = resolveTimestamp(log);
                    const performerName = resolvePerformerName(log);
                    const tone = toneStyles[event.tone];
                    const lineKey = `${log._id ?? log.id ?? ""}-${timestamp ?? ""}`;
                    const taskLink = event.task?.id ? `/tasks/${event.task.id}` : undefined;
                    const momLink = event.mom?.id ? `/moms/${event.mom.id}` : undefined;
                    return (
                      <div key={lineKey} className="relative">
                        <div
                          className={clsx(
                            "absolute left-[5px] top-4 h-2.5 w-2.5 rounded-full",
                            tone.dot
                          )}
                        />
                        <div
                          className={clsx(
                            "rounded-lg bg-surface-card px-4 py-2.5 shadow-soft ring-1",
                            tone.ring
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <span
                                className={clsx(
                                  "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]",
                                  tone.badge
                                )}
                              >
                                {event.badge}
                              </span>
                              <h4 className="text-[13px] font-semibold text-text-primary">
                                {event.title}
                              </h4>
                            </div>
                            <div className="text-right text-[11px] text-text-muted">
                              <p className="font-semibold text-text-primary/80">
                                {performerName}
                              </p>
                              {timestamp ? (
                                <p title={formatDateTime(timestamp)}>{formatRelative(timestamp)}</p>
                              ) : (
                                <p>-</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-1.5 space-y-0.5 text-xs text-text-muted leading-snug">
                            {event.remarkText ? (
                              <div className="space-y-1">
                                <p>Remark:</p>
                                {taskLink ? (
                                  <Link
                                    href={taskLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-text-primary hover:text-brand-primary"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitBoxOrient: "vertical",
                                      WebkitLineClamp: 5,
                                      overflow: "hidden"
                                    }}
                                  >
                                    {event.remarkText}
                                  </Link>
                                ) : (
                                  <p
                                    className="text-text-primary"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitBoxOrient: "vertical",
                                      WebkitLineClamp: 5,
                                      overflow: "hidden"
                                    }}
                                  >
                                    {event.remarkText}
                                  </p>
                                )}
                              </div>
                            ) : null}
                            {event.task?.id ? (
                              <p>
                                Task:{" "}
                                <Link
                                  href={taskLink ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-text-primary hover:text-brand-primary"
                                >
                                  {event.task.title || "Open task"}
                                </Link>
                              </p>
                            ) : null}
                            {event.mom?.id ? (
                              <p>
                                MOM:{" "}
                                <Link
                                  href={momLink ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-text-primary hover:text-brand-primary"
                                >
                                  {event.mom.title || "Open MOM"}
                                </Link>
                              </p>
                            ) : null}
                            {event.summary && !event.remarkText ? (
                              <p>{renderSummaryText(event.summary)}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

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
