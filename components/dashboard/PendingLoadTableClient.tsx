"use client";

import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import type { TeamMember } from "@/types/team";

interface PendingLoadTableClientProps {
  people: Array<TeamMember & { pending: number }>;
}

export default function PendingLoadTableClient({ people }: PendingLoadTableClientProps) {
  return (
    <DataTable
      data={people}
      columns={[
        {
          key: "name",
          header: "Team Member",
          render: (row: TeamMember & { pending: number }) => (
            <div>
              <p className="font-semibold text-text-primary">{row.name}</p>
              <p className="text-xs text-text-muted">{row.designation || row.department}</p>
            </div>
          )
        },
        {
          key: "pending",
          header: "Pending",
          render: (row: TeamMember & { pending: number }) => (
            <span className="text-sm text-text-primary">{row.pending}</span>
          )
        },
        {
          key: "overdueTasks",
          header: "Overdue",
          render: (row: TeamMember) => <StatusBadge label={String(row.overdueTasks ?? 0)} />
        }
      ]}
    />
  );
}
