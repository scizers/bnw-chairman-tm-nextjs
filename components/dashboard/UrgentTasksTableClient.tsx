"use client";

import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import type { Task } from "@/types/task";
import { formatDate, formatRelative } from "@/lib/utils/format";

interface UrgentTasksTableClientProps {
  tasks: Task[];
}

export default function UrgentTasksTableClient({ tasks }: UrgentTasksTableClientProps) {
  return (
    <DataTable
      data={tasks}
      columns={[
        {
          key: "title",
          header: "Task",
          render: (row: Task) => (
            <div>
              <p className="font-semibold text-text-primary">{row.title}</p>
              <p className="text-xs text-text-muted">{row.assignedToName || "Unassigned"}</p>
            </div>
          )
        },
        {
          key: "status",
          header: "Status",
          render: (row: Task) => <StatusBadge label={row.status} />
        },
        {
          key: "dueDate",
          header: "Due Date",
          render: (row: Task) => formatDate(row.dueDate)
        },
        {
          key: "updatedAt",
          header: "Last Update",
          render: (row: Task) => formatRelative(row.updatedAt)
        }
      ]}
    />
  );
}
