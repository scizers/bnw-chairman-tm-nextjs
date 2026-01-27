"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import { formatDate, formatRelative } from "@/lib/utils/format";

interface TasksTableClientProps {
  tasks: Task[];
  teamMembers: TeamMember[];
}

export default function TasksTableClient({ tasks, teamMembers }: TasksTableClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      const memberMatch = memberFilter === "all" || task.assignedTo === memberFilter;
      return statusMatch && priorityMatch && memberMatch;
    });
  }, [tasks, statusFilter, priorityFilter, memberFilter]);

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (row: Task) => (
        <div>
          <p className="font-semibold text-text-primary">{row.title}</p>
          <p className="text-xs text-text-muted">{row.description || "No description"}</p>
        </div>
      )
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (row: Task) => row.assignedToName || "Unassigned"
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
      header: "Last Remark",
      render: (row: Task) =>
        row.lastRemark
          ? row.lastRemark
          : row.lastRemarkAt
            ? formatRelative(row.lastRemarkAt)
            : row.updatedAt
              ? formatRelative(row.updatedAt)
              : "—"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-xs text-text-primary"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="overdue">Overdue</option>
          <option value="blocked">Blocked</option>
          <option value="critical">Critical</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-xs text-text-primary"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={memberFilter}
          onChange={(event) => setMemberFilter(event.target.value)}
          className="rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-xs text-text-primary"
        >
          <option value="all">All Team Members</option>
          {teamMembers.map((member, index) => {
            const value =
              member.id ?? member._id ?? member.email ?? member.name ?? String(index);
            return (
              <option key={`${value}-${index}`} value={value}>
                {member.name}
              </option>
            );
          })}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredTasks}
        onRowClick={(row) => row.id && router.push(`/tasks/${row.id}`)}
        emptyState="No tasks match the current filters."
      />
    </div>
  );
}
