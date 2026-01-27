"use client";

import { useRouter } from "next/navigation";
import DataTable from "@/components/common/DataTable";
import type { TeamMember } from "@/types/team";
import StatusBadge from "@/components/common/StatusBadge";

interface TeamTableClientProps {
  teamMembers: TeamMember[];
}

export default function TeamTableClient({ teamMembers }: TeamTableClientProps) {
  const router = useRouter();

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: TeamMember) => (
        <div>
          <p className="font-semibold text-text-primary">{row.name}</p>
          <p className="text-xs text-text-muted">{row.department || "Department"}</p>
        </div>
      )
    },
    {
      key: "designation",
      header: "Designation",
      render: (row: TeamMember) => row.designation || "-"
    },
    {
      key: "openTasks",
      header: "Open Tasks",
      render: (row: TeamMember) => row.openTasks ?? "-"
    },
    {
      key: "overdueTasks",
      header: "Overdue",
      render: (row: TeamMember) => (
        <StatusBadge label={String(row.overdueTasks ?? 0)} />
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={teamMembers}
      onRowClick={(row) => row.id && router.push(`/team/${row.id}`)}
      emptyState="No team members yet."
    />
  );
}
