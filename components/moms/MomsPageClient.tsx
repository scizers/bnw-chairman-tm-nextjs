"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, DatePicker, Input, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import dayjs from "dayjs";
import { momsApi, type MomListMeta } from "@/lib/api/moms";
import type { Mom } from "@/types/mom";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { formatDate } from "@/lib/utils/format";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SORT_OPTIONS = [
  { value: "meetingDate:desc", label: "Meeting Date (Newest)" },
  { value: "meetingDate:asc", label: "Meeting Date (Oldest)" },
  { value: "createdAt:desc", label: "Created (Newest)" },
  { value: "createdAt:asc", label: "Created (Oldest)" },
  { value: "title:asc", label: "Title (A-Z)" },
  { value: "title:desc", label: "Title (Z-A)" }
];

export default function MomsPageClient() {
  const [moms, setMoms] = useState<Mom[]>([]);
  const [pagination, setPagination] = useState<MomListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    attendees: [] as string[],
    meetingFrom: "",
    meetingTo: "",
    sortBy: "meetingDate",
    sortDir: "desc",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  });

  const attendeeOptions = useMemo(() => {
    const names = new Set<string>();
    moms.forEach((mom) => {
      mom.attendees?.forEach((name) => {
        const trimmed = name?.trim();
        if (trimmed) names.add(trimmed);
      });
    });
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [moms]);

  const sortValue = `${filters.sortBy}:${filters.sortDir}`;

  const load = async () => {
    if (!hasLoaded) setLoading(true);
    setError(null);
    try {
      const data = await momsApi.listPaged({
        q: filters.q || undefined,
        attendees: filters.attendees.length ? filters.attendees.join(",") : undefined,
        meetingFrom: filters.meetingFrom || undefined,
        meetingTo: filters.meetingTo || undefined,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
        page: filters.page,
        pageSize: filters.pageSize
      });
      setMoms(data?.data ?? []);
      setPagination(data?.meta ?? null);
      setHasLoaded(true);
    } catch (err) {
      setError("Unable to load MOMs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

  const applySearch = () => {
    setFilters((prev) => ({
      ...prev,
      q: searchInput.trim(),
      page: 1
    }));
  };

  const handleReset = () => {
    setSearchInput("");
    setFilters({
      q: "",
      attendees: [],
      meetingFrom: "",
      meetingTo: "",
      sortBy: "meetingDate",
      sortDir: "desc",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="MOM feed unavailable" description={error} onRetry={load} />;
  }

  const totalMoms = pagination?.total ?? moms.length;
  const totalPages = Math.max(1, Math.ceil(totalMoms / filters.pageSize));
  const currentPage = Math.min(filters.page, totalPages);

  const columns: ColumnsType<Mom> = [
    {
      key: "title",
      dataIndex: "title",
      title: "Title",
      sorter: true,
      sortOrder:
        filters.sortBy === "title"
          ? filters.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null,
      render: (row: Mom) => {
        const id = row.id ?? row._id ?? "";
        return (
          <div>
            <Link href={`/moms/${id}`} className="font-semibold text-text-primary hover:underline">
              {row.title}
            </Link>
            <p className="text-xs text-text-muted">{row.rawNotes?.slice(0, 90) || "—"}</p>
          </div>
        );
      }
    },
    {
      key: "meetingDate",
      dataIndex: "meetingDate",
      title: "Meeting Date",
      sorter: true,
      sortOrder:
        filters.sortBy === "meetingDate"
          ? filters.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null,
      render: (row: Mom) => formatDate(row.meetingDate)
    },
    {
      key: "attendees",
      title: "Attendees",
      render: (row: Mom) => (
        <span className="text-sm text-text-primary">
          {row.attendees?.length ? row.attendees.join(", ") : "—"}
        </span>
      )
    },
    {
      key: "createdAt",
      dataIndex: "createdAt",
      title: "Created",
      sorter: true,
      sortOrder:
        filters.sortBy === "createdAt"
          ? filters.sortDir === "asc"
            ? "ascend"
            : "descend"
          : null,
      render: (row: Mom) => formatDate(row.createdAt)
    },
    {
      key: "actions",
      title: "Actions",
      render: (row: Mom) => {
        const id = row.id ?? row._id ?? "";
        return (
          <Space size="small">
            <Link href={`/moms/${id}`}>
              <Button type="link">View</Button>
            </Link>
            <Link href={`/moms/${id}/edit`}>
              <Button type="link">Edit</Button>
            </Link>
          </Space>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{totalMoms} meetings logged</p>
        <Link
          href="/moms/new"
          className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-black"
        >
          Add MOM
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input.Search
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onSearch={applySearch}
          allowClear
          placeholder="Search by title or notes"
          className="min-w-[240px] flex-1"
        />
        <Select
          mode="tags"
          allowClear
          maxTagCount="responsive"
          placeholder="Filter attendees"
          value={filters.attendees}
          onChange={(values) =>
            setFilters((prev) => ({ ...prev, attendees: values, page: 1 }))
          }
          options={attendeeOptions}
          className="min-w-[220px]"
        />
        <DatePicker
          value={filters.meetingFrom ? dayjs(filters.meetingFrom) : null}
          onChange={(_, dateString) =>
            setFilters((prev) => ({
              ...prev,
              meetingFrom: dateString ? String(dateString) : "",
              page: 1
            }))
          }
          className="min-w-[160px]"
          placeholder="Meeting from"
          allowClear
        />
        <DatePicker
          value={filters.meetingTo ? dayjs(filters.meetingTo) : null}
          onChange={(_, dateString) =>
            setFilters((prev) => ({
              ...prev,
              meetingTo: dateString ? String(dateString) : "",
              page: 1
            }))
          }
          className="min-w-[160px]"
          placeholder="Meeting to"
          allowClear
        />
        <Select
          value={sortValue}
          onChange={(value) => {
            const [sortBy, sortDir] = value.split(":");
            setFilters((prev) => ({ ...prev, sortBy, sortDir, page: 1 }));
          }}
          options={SORT_OPTIONS}
          className="min-w-[210px]"
        />
        <Button onClick={handleReset}>Reset</Button>
      </div>

      <Table
        columns={columns}
        dataSource={moms}
        rowKey={(record) => record.id ?? record._id ?? record.title}
        locale={{ emptyText: "No MOMs match the current filters." }}
        pagination={{
          current: currentPage,
          pageSize: filters.pageSize,
          total: totalMoms,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} MOMs`
        }}
        onChange={(pager, _filters, sorter) => {
          const nextPage = pager.current ?? 1;
          const nextPageSize = pager.pageSize ?? DEFAULT_PAGE_SIZE;

          const normalizedSorter = Array.isArray(sorter)
            ? (sorter[0] as SorterResult<Mom>)
            : (sorter as SorterResult<Mom>);

          const sorterKey =
            typeof normalizedSorter?.columnKey === "string" ? normalizedSorter.columnKey : null;
          const sorterOrder = normalizedSorter?.order;
          const nextSortBy =
            sorterKey && ["title", "meetingDate", "createdAt"].includes(sorterKey)
              ? sorterKey
              : filters.sortBy;
          const nextSortDir = sorterOrder ? (sorterOrder === "ascend" ? "asc" : "desc") : filters.sortDir;
          const sortChanged = nextSortBy !== filters.sortBy || nextSortDir !== filters.sortDir;

          setFilters((prev) => ({
            ...prev,
            page: sortChanged ? 1 : nextPage,
            pageSize: nextPageSize,
            sortBy: nextSortBy,
            sortDir: nextSortDir
          }));
        }}
      />
    </div>
  );
}
