"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Input, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { departmentsApi } from "@/lib/api";
import type { DepartmentSummary } from "@/types/department";
import type { DepartmentListMeta, DepartmentListQuery } from "@/lib/api/departments";

const extractApiError = (err: unknown, fallback: string) => {
  const error = err as { response?: { data?: { error?: string } }; message?: string };
  const apiMessage = error?.response?.data?.error;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

export default function DepartmentsPageClient() {
  const { message } = App.useApp();
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [pagination, setPagination] = useState<DepartmentListMeta | null>(null);
  const [query, setQuery] = useState<DepartmentListQuery>({
    sortBy: "department",
    sortDir: "asc",
    page: 1,
    pageSize: 20
  });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("");
  const queryKey = useMemo(() => JSON.stringify(query), [query]);
  const queryRef = useRef(query);
  const canCreateDepartment = useMemo(() => Boolean(newDepartmentName.trim()), [newDepartmentName]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await departmentsApi.listPaged(queryRef.current);
      if (Array.isArray(response)) {
        const normalizedQuery = queryRef.current;
        const searchQuery = normalizedQuery.q?.trim().toLowerCase() ?? "";
        const filtered = searchQuery
          ? response.filter((dept) =>
              dept.department.toLowerCase().includes(searchQuery)
            )
          : response;
        const sortField = normalizedQuery.sortBy ?? "department";
        const sortDir = normalizedQuery.sortDir ?? "asc";
        const sorted = [...filtered].sort((a, b) => {
          const direction = sortDir === "desc" ? -1 : 1;
          const aVal = a[sortField as keyof DepartmentSummary];
          const bVal = b[sortField as keyof DepartmentSummary];
          if (typeof aVal === "number" && typeof bVal === "number") {
            return direction * (aVal - bVal);
          }
          return direction * String(aVal ?? "").localeCompare(String(bVal ?? ""));
        });
        const page = normalizedQuery.page ?? 1;
        const pageSize = normalizedQuery.pageSize ?? 20;
        const start = (page - 1) * pageSize;
        setDepartments(sorted.slice(start, start + pageSize));
        setPagination({
          page,
          pageSize,
          total: sorted.length
        });
      } else {
        setDepartments(response?.data ?? []);
        setPagination(response?.meta ?? null);
      }
    } catch (err) {
      setError("Unable to load departments.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(timer);
  }, [queryKey, load]);

  const openCreateModal = () => {
    setNewDepartmentName("");
    setNewDepartmentDescription("");
    setCreateModalOpen(true);
  };

  const closeCreateModal = (force = false) => {
    if (creating && !force) return;
    setCreateModalOpen(false);
    setNewDepartmentName("");
    setNewDepartmentDescription("");
  };

  const handleCreateDepartment = async () => {
    if (!canCreateDepartment) return;
    setCreating(true);
    try {
      await departmentsApi.create({
        name: newDepartmentName.trim(),
        description: newDepartmentDescription.trim() || undefined
      });
      message.success("Department created.");
      closeCreateModal(true);
      await load();
    } catch (err) {
      message.error(extractApiError(err, "Unable to create department."));
    } finally {
      setCreating(false);
    }
  };

  if (loading && !hasLoaded) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Department feed unavailable" description={error} onRetry={load} />;
  }

  const hasActiveFilters = Boolean(query.q?.trim());

  if (!departments.length && !hasActiveFilters) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="No departments yet"
          description="Add team members with departments to see the breakdown."
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          className="rounded-full shadow-soft"
        >
          Add Department
        </Button>
      </div>
    );
  }

  const columns: ColumnsType<DepartmentSummary> = [
    {
      key: "department",
      title: "Department",
      dataIndex: "department",
      sorter: true,
      sortOrder:
        query.sortBy === "department"
          ? query.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null,
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
      sorter: true,
      sortOrder:
        query.sortBy === "memberCount"
          ? query.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null
    },
    {
      key: "taskCount",
      title: "Total Tasks",
      dataIndex: "taskCount",
      sorter: true,
      sortOrder:
        query.sortBy === "taskCount"
          ? query.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null
    },
    {
      key: "openTasks",
      title: "Open Tasks",
      dataIndex: "openTasks",
      sorter: true,
      sortOrder:
        query.sortBy === "openTasks"
          ? query.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null
    },
    {
      key: "overdueTasks",
      title: "Overdue",
      dataIndex: "overdueTasks",
      sorter: true,
      sortOrder:
        query.sortBy === "overdueTasks"
          ? query.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null,
      render: (value: number) => <StatusBadge label={String(value ?? 0)} />
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(event) => {
            const value = event.target.value;
            setSearch(value);
            const trimmed = value.trim();
            setQuery((prev) => ({
              ...prev,
              q: trimmed || undefined,
              page: 1
            }));
          }}
          allowClear
          placeholder="Search department"
          className="min-w-[220px] flex-1"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          className="rounded-full shadow-soft"
        >
          Add Department
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={departments}
        rowKey={(record) => record.department}
        pagination={{
          current: pagination?.page ?? query.page ?? 1,
          pageSize: pagination?.pageSize ?? query.pageSize ?? 20,
          total: pagination?.total ?? departments.length,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total}`
        }}
        loading={loading}
        rowClassName={() => "cursor-pointer"}
        style={{
          opacity: loading ? 0.9 : 1,
          transition: "opacity 0.2s ease"
        }}
        onRow={(record) => ({
          onClick: () => {
            router.push(`/departments/${encodeURIComponent(record.department)}`);
          }
        })}
        onChange={(pager, _filters, sorter) => {
          const nextPage = pager.current ?? 1;
          const nextPageSize = pager.pageSize ?? 20;
          const normalizedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
          const sorterKey =
            typeof normalizedSorter?.columnKey === "string"
              ? normalizedSorter.columnKey
              : null;
          const sorterOrder = normalizedSorter?.order;

          setQuery((prev) => ({
            ...prev,
            page: nextPageSize !== prev.pageSize ? 1 : nextPage,
            pageSize: nextPageSize,
            sortBy:
              sorterOrder &&
              (sorterKey === "department" ||
                sorterKey === "memberCount" ||
                sorterKey === "taskCount" ||
                sorterKey === "openTasks" ||
                sorterKey === "overdueTasks")
                ? sorterKey
                : prev.sortBy,
            sortDir: sorterOrder ? (sorterOrder === "ascend" ? "asc" : "desc") : prev.sortDir
          }));
        }}
      />

      <Modal
        title="Add Department"
        open={createModalOpen}
        onCancel={() => closeCreateModal()}
        onOk={handleCreateDepartment}
        okText="Create Department"
        okButtonProps={{ disabled: !canCreateDepartment, loading: creating }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Name</label>
            <Input
              value={newDepartmentName}
              onChange={(event) => setNewDepartmentName(event.target.value)}
              placeholder="Department name"
              maxLength={120}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Description (optional)
            </label>
            <Input.TextArea
              value={newDepartmentDescription}
              onChange={(event) => setNewDepartmentDescription(event.target.value)}
              placeholder="Short description"
              rows={3}
              maxLength={400}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
