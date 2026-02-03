"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Space, Table, Tooltip } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TeamMember } from "@/types/team";
import StatusBadge from "@/components/common/StatusBadge";
import { resolveTeamMemberId } from "@/lib/utils/task";
import type { TeamMemberListMeta, TeamMemberListQuery } from "@/lib/api/teamMembers";

interface TeamTableClientProps {
  teamMembers: TeamMember[];
  pagination?: TeamMemberListMeta;
  loading?: boolean;
  query: TeamMemberListQuery;
  onQueryChange: (query: TeamMemberListQuery) => void;
}

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function TeamTableClient({
  teamMembers,
  pagination,
  loading,
  query,
  onQueryChange
}: TeamTableClientProps) {
  const router = useRouter();
  const [nameFilter, setNameFilter] = useState(query.name ?? "");
  const [designationFilter, setDesignationFilter] = useState(query.designation ?? "");
  const [sortBy, setSortBy] = useState(query.sortBy ?? "createdAt");
  const [sortDir, setSortDir] = useState(query.sortDir ?? "desc");
  const [page, setPage] = useState(query.page ?? 1);
  const [pageSize, setPageSize] = useState(query.pageSize ?? DEFAULT_PAGE_SIZE);
  const lastEmittedQueryKey = useRef<string | null>(null);

  useEffect(() => {
    setNameFilter(query.name ?? "");
    setDesignationFilter(query.designation ?? "");
    setSortBy(query.sortBy ?? "createdAt");
    setSortDir(query.sortDir ?? "desc");
    setPage(query.page ?? 1);
    setPageSize(query.pageSize ?? DEFAULT_PAGE_SIZE);
  }, [query]);

  useEffect(() => {
    const nextQuery: TeamMemberListQuery = {
      sortBy,
      sortDir,
      page,
      pageSize
    };
    if (nameFilter.trim()) nextQuery.name = nameFilter.trim();
    if (designationFilter.trim()) nextQuery.designation = designationFilter.trim();

    const queryKey = JSON.stringify(nextQuery);
    if (lastEmittedQueryKey.current === queryKey) return;
    const timer = setTimeout(() => {
      if (lastEmittedQueryKey.current === queryKey) return;
      lastEmittedQueryKey.current = queryKey;
      onQueryChange(nextQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameFilter, designationFilter, sortBy, sortDir, page, pageSize, onQueryChange]);

  const columns: ColumnsType<TeamMember> = [
    {
      key: "name",
      title: "Name",
      sorter: true,
      sortOrder: sortBy === "name" ? (sortDir === "asc" ? "ascend" : "descend") : null,
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
      sorter: true,
      sortOrder:
        sortBy === "designation" ? (sortDir === "asc" ? "ascend" : "descend") : null,
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
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                const id = resolveTeamMemberId(row);
                if (id) router.push(`/team/${id}`);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                const id = resolveTeamMemberId(row);
                if (id) router.push(`/team/${id}/edit`);
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          value={nameFilter}
          onChange={(event) => {
            setNameFilter(event.target.value);
            setPage(1);
          }}
          allowClear
          placeholder="Search name"
          className="min-w-[220px] flex-1"
        />
        <Input
          value={designationFilter}
          onChange={(event) => {
            setDesignationFilter(event.target.value);
            setPage(1);
          }}
          allowClear
          placeholder="Search designation"
          className="min-w-[220px] flex-1"
        />
      </div>

      <Table
        columns={columns}
        dataSource={teamMembers}
        rowKey={(record) => resolveTeamMemberId(record) || record.email || record.name}
        locale={{ emptyText: "No team members yet." }}
        pagination={{
          current: pagination?.page ?? page,
          pageSize: pagination?.pageSize ?? pageSize,
          total: pagination?.total ?? teamMembers.length,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total}`
        }}
        loading={loading}
        rowClassName={() => "cursor-pointer"}
        onRow={(record) => ({
          onClick: () => {
            const id = resolveTeamMemberId(record);
            if (id) router.push(`/team/${id}`);
          }
        })}
        onChange={(pager, _filters, sorter) => {
          const nextPage = pager.current ?? 1;
          const nextPageSize = pager.pageSize ?? DEFAULT_PAGE_SIZE;
          if (nextPage !== page) setPage(nextPage);
          if (nextPageSize !== pageSize) {
            setPageSize(nextPageSize);
            setPage(1);
          }

          const normalizedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
          const sorterKey =
            typeof normalizedSorter?.columnKey === "string"
              ? normalizedSorter.columnKey
              : null;
          const sorterOrder = normalizedSorter?.order;
          if (sorterOrder && (sorterKey === "name" || sorterKey === "designation")) {
            setSortBy(sorterKey);
            setSortDir(sorterOrder === "ascend" ? "asc" : "desc");
            setPage(1);
          }
        }}
      />
    </div>
  );
}
