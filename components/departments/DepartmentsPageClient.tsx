"use client";

import { useCallback, useEffect, useState } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { departmentsApi } from "@/lib/api";
import type { DepartmentSummary } from "@/types/department";

export default function DepartmentsPageClient() {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const columns: ColumnsType<DepartmentSummary> = [
    {
      key: "department",
      title: "Department",
      dataIndex: "department",
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
      dataIndex: "memberCount"
    },
    {
      key: "taskCount",
      title: "Total Tasks",
      dataIndex: "taskCount"
    },
    {
      key: "openTasks",
      title: "Open Tasks",
      dataIndex: "openTasks"
    },
    {
      key: "overdueTasks",
      title: "Overdue",
      dataIndex: "overdueTasks",
      render: (value: number) => <StatusBadge label={String(value ?? 0)} />
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={departments}
      rowKey={(record) => record.department}
      pagination={false}
    />
  );
}
