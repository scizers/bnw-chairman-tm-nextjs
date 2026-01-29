"use client";

import { useMemo, useState } from "react";
import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import StatusBadge from "@/components/common/StatusBadge";
import type { Task } from "@/types/task";
import { formatDate, formatRelative } from "@/lib/utils/format";

interface TeamMemberTasksTableProps {
  tasks: Task[];
  onView: (taskId: string) => void;
  onEdit: (taskId: string) => void;
}

export default function TeamMemberTasksTable({
  tasks,
  onView,
  onEdit
}: TeamMemberTasksTableProps) {
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedTasks = useMemo(() => {
    const next = [...tasks];
    const direction = sortDir === "asc" ? 1 : -1;
    next.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title) * direction;
      }
      const getTimeValue = (value?: string) => {
        if (!value) return null;
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? null : time;
      };
      const aValue = sortBy === "dueDate" ? getTimeValue(a.dueDate) : getTimeValue(a.updatedAt);
      const bValue = sortBy === "dueDate" ? getTimeValue(b.dueDate) : getTimeValue(b.updatedAt);
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      return (aValue - bValue) * direction;
    });
    return next;
  }, [tasks, sortBy, sortDir]);

  const columns: ColumnsType<Task> = [
    {
      key: "title",
      title: "Title",
      sorter: true,
      sortOrder: sortBy === "title" ? (sortDir === "asc" ? "ascend" : "descend") : null,
      render: (row: Task) => (
        <div>
          <p className="font-semibold text-text-primary">{row.title}</p>
          <p className="text-xs text-text-muted">{row.description || "No description"}</p>
        </div>
      )
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
      title: "Last Remark",
      sorter: true,
      sortOrder: sortBy === "updatedAt" ? (sortDir === "asc" ? "ascend" : "descend") : null,
      render: (row: Task) => {
        const remark = row.lastRemark?.trim();
        const timestamp = row.lastRemarkAt ?? row.updatedAt;
        const timeLabel = timestamp ? formatRelative(timestamp) : null;
        if (!remark) {
          return timeLabel ?? "—";
        }
        return (
          <div>
            <p className="text-sm text-text-primary">{remark}</p>
            {timeLabel ? <p className="text-xs text-text-muted">{timeLabel}</p> : null}
          </div>
        );
      }
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
              const id = row.id ?? row._id;
              if (id) onView(id);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              const id = row.id ?? row._id;
              if (id) onEdit(id);
            }}
          >
            Edit
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={sortedTasks}
      rowKey={(record) => record.id ?? record._id ?? `${record.title}-${record.dueDate ?? ""}`}
      locale={{ emptyText: "No tasks assigned to this team member." }}
      pagination={{ showSizeChanger: true, pageSizeOptions: ["10", "20", "50"] }}
      rowClassName={() => "cursor-pointer"}
      onRow={(record) => ({
        onClick: () => {
          const id = record.id ?? record._id;
          if (id) onView(id);
        }
      })}
      onChange={(_pagination, _filters, sorter) => {
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
        }
      }}
    />
  );
}
