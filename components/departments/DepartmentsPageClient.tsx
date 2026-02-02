"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { departmentsApi } from "@/lib/api";
import type { DepartmentSummary } from "@/types/department";

export default function DepartmentsPageClient() {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await departmentsApi.list();
      setDepartments(data ?? []);
    } catch (err) {
      setError("Unable to load departments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Department feed unavailable" description={error} onRetry={load} />;
  }

  if (!departments.length) {
    return (
      <EmptyState
        title="No departments yet"
        description="Add team members with departments to see the breakdown."
      />
    );
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredDepartments = normalizedSearch
    ? departments.filter((dept) =>
        dept.department.toLowerCase().includes(normalizedSearch)
      )
    : departments;

  const columns: ColumnsType<DepartmentSummary> = [
    {
      key: "department",
      title: "Department",
      dataIndex: "department",
      sorter: (a, b) => a.department.localeCompare(b.department),
      sortDirections: ["ascend", "descend"],
      render: (value: string) => (
        <div>
          <p className="font-semibold text-text-primary">{value}</p>
          <p className="text-xs text-text-muted">Department</p>
        </div>
      )
    },
    {
      key: "memberCount",
      title: "Members",
      dataIndex: "memberCount",
      sorter: (a, b) => (a.memberCount ?? 0) - (b.memberCount ?? 0),
      sortDirections: ["descend", "ascend"]
    },
    {
      key: "taskCount",
      title: "Total Tasks",
      dataIndex: "taskCount",
      sorter: (a, b) => (a.taskCount ?? 0) - (b.taskCount ?? 0),
      sortDirections: ["descend", "ascend"]
    },
    {
      key: "openTasks",
      title: "Open Tasks",
      dataIndex: "openTasks",
      sorter: (a, b) => (a.openTasks ?? 0) - (b.openTasks ?? 0),
      sortDirections: ["descend", "ascend"]
    },
    {
      key: "overdueTasks",
      title: "Overdue",
      dataIndex: "overdueTasks",
      sorter: (a, b) => (a.overdueTasks ?? 0) - (b.overdueTasks ?? 0),
      sortDirections: ["descend", "ascend"],
      render: (value: number) => <StatusBadge label={String(value ?? 0)} />
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input.Search
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
          placeholder="Search departments"
          className="min-w-[240px] flex-1"
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredDepartments}
        rowKey={(record) => record.department}
        pagination={false}
        rowClassName={() => "cursor-pointer"}
        onRow={(record) => ({
          onClick: () => {
            router.push(`/departments/${encodeURIComponent(record.department)}`);
          }
        })}
      />
    </div>
  );
}
