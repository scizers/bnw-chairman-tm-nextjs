"use client";

import { useRouter } from "next/navigation";
import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TeamMember } from "@/types/team";
import StatusBadge from "@/components/common/StatusBadge";
import { resolveTeamMemberId } from "@/lib/utils/task";

interface TeamTableClientProps {
  teamMembers: TeamMember[];
}

export default function TeamTableClient({ teamMembers }: TeamTableClientProps) {
  const router = useRouter();

  const columns: ColumnsType<TeamMember> = [
    {
      key: "name",
      title: "Name",
      render: (row: TeamMember) => (
        <div>
          <p className="font-semibold text-text-primary">
            <span
              className="cursor-pointer hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                const id = resolveTeamMemberId(row);
                if (id) router.push(`/team/${id}`);
              }}
            >
              {row.name}
            </span>
          </p>
          <p className="text-xs text-text-muted">{row.department || "Department"}</p>
        </div>
      )
    },
    {
      key: "designation",
      title: "Designation",
      render: (row: TeamMember) => row.designation || "-"
    },
    {
      key: "openTasks",
      title: "Open Tasks",
      render: (row: TeamMember) => row.openTasks ?? "-"
    },
    {
      key: "overdueTasks",
      title: "Overdue",
      render: (row: TeamMember) => (
        <StatusBadge label={String(row.overdueTasks ?? 0)} />
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (row: TeamMember) => (
        <Space size="small">
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              const id = resolveTeamMemberId(row);
              if (id) router.push(`/team/${id}`);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              const id = resolveTeamMemberId(row);
              if (id) router.push(`/team/${id}/edit`);
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
      dataSource={teamMembers}
      rowKey={(record) => resolveTeamMemberId(record) || record.email || record.name}
      locale={{ emptyText: "No team members yet." }}
      pagination={false}
      rowClassName={() => "cursor-pointer"}
      onRow={(record) => ({
        onClick: () => {
          const id = resolveTeamMemberId(record);
          if (id) router.push(`/team/${id}`);
        }
      })}
    />
  );
}
