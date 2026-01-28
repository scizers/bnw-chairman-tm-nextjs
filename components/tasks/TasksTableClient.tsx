"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Select, Space, Table } from "antd";
import type { ColumnsType, SorterResult } from "antd/es/table";
import StatusBadge from "@/components/common/StatusBadge";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import { formatDate, formatRelative } from "@/lib/utils/format";
import type { TaskListMeta } from "@/lib/api/tasks";

interface TasksTableClientProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  pagination?: TaskListMeta;
  loading?: boolean;
  hideMemberFilter?: boolean;
  fixedMemberIds?: string[];
  onViewTask?: (taskId: string) => void;
  onEditTask?: (taskId: string) => void;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "overdue", label: "Overdue" },
  { value: "blocked", label: "Blocked" },
  { value: "critical", label: "Critical" },
  { value: "completed", label: "Completed" }
];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

const parseListParam = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .sort();
};

const normalizeList = (values: string[]) =>
  [...values].map((entry) => entry.trim()).filter(Boolean).sort();

const areListsEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export default function TasksTableClient({
  tasks,
  teamMembers,
  pagination,
  loading,
  hideMemberFilter,
  fixedMemberIds,
  onViewTask,
  onEditTask
}: TasksTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const lockedMemberIds = useMemo(
    () => (fixedMemberIds ? normalizeList(fixedMemberIds) : null),
    [fixedMemberIds]
  );
  const [statusFilter, setStatusFilter] = useState<string[]>(() =>
    parseListParam(searchParams.get("status"))
  );
  const [priorityFilter, setPriorityFilter] = useState<string[]>(() =>
    parseListParam(searchParams.get("priority"))
  );
  const [memberFilter, setMemberFilter] = useState<string[]>(() =>
    lockedMemberIds ?? parseListParam(searchParams.get("member"))
  );
  const [titleQuery, setTitleQuery] = useState(() => searchParams.get("q") ?? "");
  const [dueFrom, setDueFrom] = useState(() => searchParams.get("dueFrom") ?? "");
  const [dueTo, setDueTo] = useState(() => searchParams.get("dueTo") ?? "");
  const [sortBy, setSortBy] = useState(() => searchParams.get("sortBy") ?? "updatedAt");
  const [sortDir, setSortDir] = useState(() => searchParams.get("sortDir") ?? "desc");
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get("page") ?? "1");
    return Number.isFinite(value) && value > 0 ? value : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const value = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
    return PAGE_SIZE_OPTIONS.includes(value) ? value : DEFAULT_PAGE_SIZE;
  });

  useEffect(() => {
    const nextStatus = parseListParam(searchParams.get("status"));
    if (!areListsEqual(nextStatus, statusFilter)) setStatusFilter(nextStatus);
    const nextPriority = parseListParam(searchParams.get("priority"));
    if (!areListsEqual(nextPriority, priorityFilter)) setPriorityFilter(nextPriority);
    if (!lockedMemberIds) {
      const nextMember = parseListParam(searchParams.get("member"));
      if (!areListsEqual(nextMember, memberFilter)) setMemberFilter(nextMember);
    } else if (!areListsEqual(lockedMemberIds, memberFilter)) {
      setMemberFilter(lockedMemberIds);
    }
    const nextTitle = searchParams.get("q") ?? "";
    if (nextTitle !== titleQuery) setTitleQuery(nextTitle);
    const nextDueFrom = searchParams.get("dueFrom") ?? "";
    if (nextDueFrom !== dueFrom) setDueFrom(nextDueFrom);
    const nextDueTo = searchParams.get("dueTo") ?? "";
    if (nextDueTo !== dueTo) setDueTo(nextDueTo);
    const nextSortBy = searchParams.get("sortBy") ?? "updatedAt";
    if (nextSortBy !== sortBy) setSortBy(nextSortBy);
    const nextSortDir = searchParams.get("sortDir") ?? "desc";
    if (nextSortDir !== sortDir) setSortDir(nextSortDir);
    const nextPage = Number(searchParams.get("page") ?? "1");
    if (Number.isFinite(nextPage) && nextPage > 0 && nextPage !== page) setPage(nextPage);
    const nextPageSize = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
    if (PAGE_SIZE_OPTIONS.includes(nextPageSize) && nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
    }
  }, [searchParamsString, lockedMemberIds]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const setParam = (key: string, value: string, fallback?: string) => {
      if (!value || (fallback && value === fallback)) {
        params.delete(key);
        return;
      }
      params.set(key, value);
    };
    const setListParam = (key: string, values: string[]) => {
      const normalized = normalizeList(values);
      if (!normalized.length) {
        params.delete(key);
        return;
      }
      params.set(key, normalized.join(","));
    };

    setListParam("status", statusFilter);
    setListParam("priority", priorityFilter);
    setListParam("member", lockedMemberIds ?? memberFilter);
    setParam("q", titleQuery.trim());
    setParam("dueFrom", dueFrom);
    setParam("dueTo", dueTo);
    setParam("sortBy", sortBy, "updatedAt");
    setParam("sortDir", sortDir, "desc");
    setParam("page", String(page), "1");
    setParam("pageSize", String(pageSize), String(DEFAULT_PAGE_SIZE));

    const nextQuery = params.toString();
    if (nextQuery !== searchParamsString) {
      router.replace(nextQuery ? `?${nextQuery}` : "?", { scroll: false });
    }
  }, [
    statusFilter,
    priorityFilter,
    memberFilter,
    titleQuery,
    dueFrom,
    dueTo,
    sortBy,
    sortDir,
    page,
    pageSize,
    router,
    searchParamsString,
    lockedMemberIds
  ]);

  const totalTasks = pagination?.total ?? tasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const currentPage = Math.min(page, totalPages);
  const currentPageSize = pageSize;

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const memberOptions = useMemo(
    () =>
      teamMembers.map((member, index) => {
        const value =
          member.id ?? member._id ?? member.email ?? member.name ?? String(index);
        return {
          value,
          label: member.name ?? value
        };
      }),
    [teamMembers]
  );

  const handleView = (taskId?: string) => {
    if (!taskId) return;
    if (onViewTask) {
      onViewTask(taskId);
      return;
    }
    router.push(`/tasks/${taskId}`);
  };

  const handleEdit = (taskId?: string) => {
    if (!taskId) return;
    if (onEditTask) {
      onEditTask(taskId);
      return;
    }
    router.push(`/tasks/${taskId}/edit`);
  };

  const columns: ColumnsType<Task> = [
    {
      key: "title",
      title: "Title",
      sorter: true,
      sortOrder: sortBy === "title" ? (sortDir === "asc" ? "ascend" : "descend") : null,
      render: (row: Task) => (
        <div>
          <p className="font-semibold text-text-primary">
            <span
              className="cursor-pointer hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                handleView(row.id ?? row._id);
              }}
            >
              {row.title}
            </span>
          </p>
          <p className="text-xs text-text-muted">{row.description || "No description"}</p>
        </div>
      )
    },
    {
      key: "assignedTo",
      title: "Assigned To",
      render: (row: Task) => row.assignedToName || "Unassigned"
    },
    {
      key: "status",
      title: "Status",
      render: (row: Task) => <StatusBadge label={row.status} />
    },
    {
      key: "priority",
      title: "Priority",
      render: (row: Task) => <StatusBadge label={row.priority} />
    },
    {
      key: "dueDate",
      title: "Due Date",
      sorter: true,
      sortOrder: sortBy === "dueDate" ? (sortDir === "asc" ? "ascend" : "descend") : null,
      render: (row: Task) => formatDate(row.dueDate)
    },
    {
      key: "updatedAt",
      title: "Last Updated",
      sorter: true,
      sortOrder:
        sortBy === "updatedAt" ? (sortDir === "asc" ? "ascend" : "descend") : null,
      render: (row: Task) =>
        row.lastRemark
          ? row.lastRemark
          : row.lastRemarkAt
            ? formatRelative(row.lastRemarkAt)
            : row.updatedAt
              ? formatRelative(row.updatedAt)
              : "—"
    },
    {
      key: "actions",
      title: "Actions",
      render: (row: Task) => (
        <Space size="small">
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              handleView(row.id ?? row._id);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              handleEdit(row.id ?? row._id);
            }}
          >
            Edit
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          value={titleQuery}
          onChange={(event) => {
            setTitleQuery(event.target.value);
            setPage(1);
          }}
          allowClear
          placeholder="Search task title"
          className="min-w-[220px] flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Due
          </span>
          <input
            type="date"
            value={dueFrom}
            onChange={(event) => {
              setDueFrom(event.target.value);
              setPage(1);
            }}
            className="rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-xs text-text-primary"
          />
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
            to
          </span>
          <input
            type="date"
            value={dueTo}
            onChange={(event) => {
              setDueTo(event.target.value);
              setPage(1);
            }}
            className="rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-xs text-text-primary"
          />
        </div>
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(values) => {
            setStatusFilter(values);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="min-w-[180px]"
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Priorities"
          value={priorityFilter}
          onChange={(values) => {
            setPriorityFilter(values);
            setPage(1);
          }}
          options={PRIORITY_OPTIONS}
          className="min-w-[180px]"
        />
        {hideMemberFilter || lockedMemberIds ? null : (
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="All Team Members"
            value={memberFilter}
            onChange={(values) => {
              setMemberFilter(values);
              setPage(1);
            }}
            options={memberOptions}
            className="min-w-[220px]"
          />
        )}
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey={(record) => record.id ?? record._id ?? `${record.title}-${record.dueDate ?? ""}`}
        locale={{ emptyText: "No tasks match the current filters." }}
        loading={loading}
        rowClassName={() => "cursor-pointer"}
        pagination={{
          current: currentPage,
          pageSize: currentPageSize,
          total: totalTasks,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} tasks`
        }}
        onRow={(record) => ({
          onClick: () => handleView(record.id ?? record._id)
        })}
        onChange={(pager, _filters, sorter) => {
          const nextPage = pager.current ?? 1;
          const nextPageSize = pager.pageSize ?? DEFAULT_PAGE_SIZE;
          if (nextPage !== page) setPage(nextPage);
          if (nextPageSize !== pageSize) {
            setPageSize(nextPageSize);
            setPage(1);
          }

          const normalizedSorter = Array.isArray(sorter)
            ? (sorter[0] as SorterResult<Task>)
            : (sorter as SorterResult<Task>);

          const sorterKey = typeof normalizedSorter?.columnKey === "string" ? normalizedSorter.columnKey : null;
          const sorterOrder = normalizedSorter?.order;
          if (!sorterOrder) {
            setSortBy("updatedAt");
            setSortDir("desc");
            return;
          }
          if (sorterKey === "title" || sorterKey === "dueDate" || sorterKey === "updatedAt") {
            setSortBy(sorterKey);
            setSortDir(sorterOrder === "ascend" ? "asc" : "desc");
            setPage(1);
          }
        }}
      />
    </div>
  );
}
