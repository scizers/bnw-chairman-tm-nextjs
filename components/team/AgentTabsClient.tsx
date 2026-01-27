"use client";

import { useMemo, useState } from "react";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import type { Task } from "@/types/task";
import { formatDate, formatRelative } from "@/lib/utils/format";

interface AgentTabsClientProps {
  tasks: Task[];
}

const tabs = ["pending", "in_progress", "overdue", "completed"] as const;

type TabKey = (typeof tabs)[number];

const tabLabel: Record<TabKey, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  overdue: "Overdue",
  completed: "Completed"
};

export default function AgentTabsClient({ tasks }: AgentTabsClientProps) {
  const [active, setActive] = useState<TabKey>("pending");

  const filteredTasks = useMemo(() => {
    switch (active) {
      case "pending":
        return tasks.filter((task) => task.status === "open");
      case "in_progress":
        return tasks.filter((task) => task.status === "in_progress");
      case "overdue":
        return tasks.filter((task) => task.status === "overdue");
      case "completed":
        return tasks.filter((task) => task.status === "completed");
      default:
        return tasks;
    }
  }, [active, tasks]);

  const columns = [
    {
      key: "title",
      header: "Task",
      render: (row: Task) => (
        <div>
          <p className="font-semibold text-text-primary">{row.title}</p>
          <p className="text-xs text-text-muted">{row.description || "No description"}</p>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (row: Task) => <StatusBadge label={row.status} />
    },
    {
      key: "priority",
      header: "Priority",
      render: (row: Task) => <StatusBadge label={row.priority} />
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (row: Task) => formatDate(row.dueDate)
    },
    {
      key: "lastRemark",
      header: "Last Remark Activity",
      render: (row: Task) => (
        <span className="text-xs text-text-muted">
          {row.updatedAt ? formatRelative(row.updatedAt) : row.lastRemark || "-"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              active === tab
                ? "bg-brand-primary text-black"
                : "border border-border-subtle text-text-muted hover:text-text-primary"
            }`}
          >
            {tabLabel[tab]}
          </button>
        ))}
      </div>
      <DataTable columns={columns} data={filteredTasks} emptyState="No tasks in this view." />
    </div>
  );
}
