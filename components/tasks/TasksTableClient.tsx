"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {Avatar, Button, DatePicker, Input, Select, Table, Tooltip} from "antd";
import {EyeOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import type {SorterResult} from "antd/es/table/interface";
import dayjs from "dayjs";
import StatusBadge from "@/components/common/StatusBadge";
import TaskStatusBadge from "@/components/common/TaskStatusBadge";
import type {Task} from "@/types/task";
import type {TeamMember} from "@/types/team";
import {formatDate, formatDateTime, formatRelative} from "@/lib/utils/format";
import type {TaskListMeta, TaskListQuery} from "@/lib/api/tasks";
import {resolveTeamMemberId} from "@/lib/utils/task";

interface TasksTableClientProps {
    tasks: Task[];
    teamMembers: TeamMember[];
    pagination?: TaskListMeta;
    loading?: boolean;
    onReload?: () => void;
    hideMemberFilter?: boolean;
    hideDepartmentFilter?: boolean;
    fixedMemberIds?: string[];
    fixedDepartment?: string;
    forcedStatusFilter?: string[];
    departmentOptionsOverride?: Array<{ value: string; label: string }>;
    useUrlState?: boolean;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number, pageSize: number) => void;
    initialQuery?: TaskListQuery;
    onQueryChange?: (query: TaskListQuery) => void;
    onViewTask?: (taskId: string) => void;
    onEditTask?: (taskId: string) => void;
    onTaskStatusUpdated?: (taskId: string, nextStatus: string) => void;
    showResetFilters?: boolean;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS = [
    {value: "open", label: "Open"},
    {value: "in_progress", label: "In Progress"},
    {value: "overdue", label: "Overdue"},
    {value: "blocked", label: "Blocked"},
    {value: "critical", label: "Critical"},
    {value: "completed", label: "Completed"}
];
const PRIORITY_OPTIONS = [
    {value: "low", label: "Low"},
    {value: "normal", label: "Normal"},
    {value: "medium", label: "Medium"},
    {value: "high", label: "High"},
    {value: "critical", label: "Critical"}
];

const formatShortDate = (value?: string) => {
    if (!value) return "";
    const parsed = dayjs(value);
    if (!parsed.isValid()) return value;
    return parsed.format("MMM D");
};

const getInitials = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return "";
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return `${first}${last}`.toUpperCase();
};

const resolveAddedByName = (row: Task) =>
    row.createdByName ||
    (typeof row.createdBy === "object" ? row.createdBy?.name : "") ||
    "Unknown";

const parseListParam = (value: string | null) => {
    if (!value) return [];
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .sort();
};

const normalizeList = (values: string[]) =>
    [...values].map((entry) => entry.trim()).filter(Boolean).sort();

const areListsEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

export default function TasksTableClient({
                                             tasks,
                                             teamMembers,
                                             pagination,
                                             loading,
                                             onReload,
                                             hideMemberFilter,
                                             hideDepartmentFilter,
                                             fixedMemberIds,
                                             fixedDepartment,
                                             forcedStatusFilter,
                                             departmentOptionsOverride,
                                             useUrlState = true,
                                             page: controlledPage,
                                             pageSize: controlledPageSize,
                                             onPageChange,
                                             initialQuery,
                                             onQueryChange,
                                             onViewTask,
                                             onEditTask,
                                             onTaskStatusUpdated,
                                             showResetFilters = false
                                         }: TasksTableClientProps) {
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const searchParamsString = searchParams.toString();
    const lockedMemberIds = useMemo(
        () => (fixedMemberIds ? normalizeList(fixedMemberIds) : null),
        [fixedMemberIds]
    );
    const lockedDepartment = useMemo(() => {
        const value = fixedDepartment?.trim();
        return value ? [value] : null;
    }, [fixedDepartment]);
    const [statusFilter, setStatusFilter] = useState<string[]>(() =>
        useUrlState
            ? parseListParam(searchParams.get("status"))
            : parseListParam(forcedStatusFilter?.join(",") ?? "")
    );
    const [priorityFilter, setPriorityFilter] = useState<string[]>(() =>
        useUrlState
            ? parseListParam(searchParams.get("priority"))
            : []
    );
    const [memberFilter, setMemberFilter] = useState<string[]>(() =>
        lockedMemberIds ??
        (useUrlState ? parseListParam(searchParams.get("member")) : [])
    );
    const [departmentFilter, setDepartmentFilter] = useState<string[]>(() =>
        lockedDepartment ??
        (useUrlState ? parseListParam(searchParams.get("department")) : [])
    );
    const [titleQuery, setTitleQuery] = useState(
        () => (useUrlState ? searchParams.get("q") ?? "" : "")
    );
    const [createdFrom, setCreatedFrom] = useState(
        () => (useUrlState ? searchParams.get("createdFrom") ?? "" : "")
    );
    const [createdTo, setCreatedTo] = useState(
        () => (useUrlState ? searchParams.get("createdTo") ?? "" : "")
    );
    const [dueFrom, setDueFrom] = useState(
        () => (useUrlState ? searchParams.get("dueFrom") ?? "" : "")
    );
    const [dueTo, setDueTo] = useState(
        () => (useUrlState ? searchParams.get("dueTo") ?? "" : "")
    );
    const [sortBy, setSortBy] = useState(
        () => (useUrlState ? searchParams.get("sortBy") ?? "updatedAt" : "updatedAt")
    );
    const [sortDir, setSortDir] = useState(
        () => (useUrlState ? searchParams.get("sortDir") ?? "desc" : "desc")
    );
    const [page, setPage] = useState(() => {
        if (!useUrlState) return 1;
        const value = Number(searchParams.get("page") ?? "1");
        return Number.isFinite(value) && value > 0 ? value : 1;
    });
    const [pageSize, setPageSize] = useState(() => {
        if (!useUrlState) return DEFAULT_PAGE_SIZE;
        const value = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
        return PAGE_SIZE_OPTIONS.includes(value) ? value : DEFAULT_PAGE_SIZE;
    });
    const resolvedPage = useUrlState ? page : controlledPage ?? page;
    const resolvedPageSize = useUrlState ? pageSize : controlledPageSize ?? pageSize;
    const lastEmittedQueryKey = useRef<string | null>(null);
    const lastAppliedForcedStatus = useRef<string | null>(null);
    const didInitRef = useRef(false);
    const skipInitialEmit = useRef(false);
    const resolvedForcedStatus = useMemo(
        () => (forcedStatusFilter?.length ? normalizeList(forcedStatusFilter) : []),
        [forcedStatusFilter]
    );

    useEffect(() => {
        setIsClient(true);
    }, []);

    const formatDateFallback = (value?: string) => {
        if (!value) return "";
        return value.split("T")[0] ?? value;
    };

    useEffect(() => {
        if (!useUrlState) return;
        const nextStatus = parseListParam(searchParams.get("status"));
        if (!areListsEqual(nextStatus, statusFilter)) setStatusFilter(nextStatus);
        const nextPriority = parseListParam(searchParams.get("priority"));
        if (!areListsEqual(nextPriority, priorityFilter)) setPriorityFilter(nextPriority);
        if (!lockedMemberIds) {
            const nextMember = parseListParam(searchParams.get("member"));
            if (!areListsEqual(nextMember, memberFilter)) setMemberFilter(nextMember);
        } else if (!areListsEqual(lockedMemberIds, memberFilter)) {
            setMemberFilter(lockedMemberIds);
        }
        if (!lockedDepartment) {
            const nextDepartment = parseListParam(searchParams.get("department"));
            if (!areListsEqual(nextDepartment, departmentFilter)) setDepartmentFilter(nextDepartment);
        } else if (!areListsEqual(lockedDepartment, departmentFilter)) {
            setDepartmentFilter(lockedDepartment);
        }
        const nextTitle = searchParams.get("q") ?? "";
        if (nextTitle !== titleQuery) setTitleQuery(nextTitle);
        const nextCreatedFrom = searchParams.get("createdFrom") ?? "";
        if (nextCreatedFrom !== createdFrom) setCreatedFrom(nextCreatedFrom);
        const nextCreatedTo = searchParams.get("createdTo") ?? "";
        if (nextCreatedTo !== createdTo) setCreatedTo(nextCreatedTo);
        const nextDueFrom = searchParams.get("dueFrom") ?? "";
        if (nextDueFrom !== dueFrom) setDueFrom(nextDueFrom);
        const nextDueTo = searchParams.get("dueTo") ?? "";
        if (nextDueTo !== dueTo) setDueTo(nextDueTo);
        const nextSortBy = searchParams.get("sortBy") ?? "updatedAt";
        if (nextSortBy !== sortBy) setSortBy(nextSortBy);
        const nextSortDir = searchParams.get("sortDir") ?? "desc";
        if (nextSortDir !== sortDir) setSortDir(nextSortDir);
        const nextPage = Number(searchParams.get("page") ?? "1");
        if (Number.isFinite(nextPage) && nextPage > 0 && nextPage !== page) setPage(nextPage);
        const nextPageSize = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
        if (PAGE_SIZE_OPTIONS.includes(nextPageSize) && nextPageSize !== pageSize) {
            setPageSize(nextPageSize);
        }
    }, [searchParamsString, lockedMemberIds, lockedDepartment, useUrlState, titleQuery, createdFrom, createdTo, dueFrom, dueTo, sortBy, sortDir, page, pageSize, statusFilter, priorityFilter, memberFilter, departmentFilter]);

    useEffect(() => {
        if (!useUrlState) return;
        const params = new URLSearchParams();
        const setParam = (key: string, value: string, fallback?: string) => {
            if (!value || (fallback && value === fallback)) {
                return;
            }
            params.set(key, value);
        };
        const setListParam = (key: string, values: string[]) => {
            const normalized = normalizeList(values);
            if (!normalized.length) {
                return;
            }
            params.set(key, normalized.join(","));
        };

        setListParam("status", statusFilter);
        setListParam("priority", priorityFilter);
        setListParam("member", lockedMemberIds ?? memberFilter);
        setListParam("department", lockedDepartment ?? departmentFilter);
        setParam("q", titleQuery.trim());
        setParam("createdFrom", createdFrom);
        setParam("createdTo", createdTo);
        setParam("dueFrom", dueFrom);
        setParam("dueTo", dueTo);
        setParam("sortBy", sortBy, "updatedAt");
        setParam("sortDir", sortDir, "desc");
        setParam("page", String(page));
        setParam("pageSize", String(pageSize));

        const nextQuery = params.toString();
        if (nextQuery !== searchParamsString) {
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {scroll: false});
        }
    }, [
        statusFilter,
        priorityFilter,
        memberFilter,
        titleQuery,
        createdFrom,
        createdTo,
        dueFrom,
        dueTo,
        sortBy,
        sortDir,
        page,
        pageSize,
        router,
        pathname,
        searchParamsString,
        lockedMemberIds,
        lockedDepartment,
        departmentFilter,
        useUrlState
    ]);

    useEffect(() => {
        if (useUrlState || !onQueryChange) return;
        if (!skipInitialEmit.current) {
            skipInitialEmit.current = true;
            return;
        }
        const query: TaskListQuery = {};
        if (statusFilter.length) query.status = normalizeList(statusFilter).join(",");
        if (priorityFilter.length) query.priority = normalizeList(priorityFilter).join(",");
        if ((lockedMemberIds ?? memberFilter).length) {
            query.assignedTo = normalizeList(lockedMemberIds ?? memberFilter).join(",");
        }
        if ((lockedDepartment ?? departmentFilter).length) {
            query.department = normalizeList(lockedDepartment ?? departmentFilter).join(",");
        }
        if (titleQuery.trim()) query.q = titleQuery.trim();
        if (createdFrom) query.createdFrom = createdFrom;
        if (createdTo) query.createdTo = createdTo;
        if (dueFrom) query.dueFrom = dueFrom;
        if (dueTo) query.dueTo = dueTo;
        query.sortBy = sortBy;
        query.sortDir = sortDir;
        query.page = page;
        query.pageSize = pageSize;
        const queryKey = JSON.stringify(query);
        if (lastEmittedQueryKey.current === queryKey) return;
        const timer = setTimeout(() => {
            if (lastEmittedQueryKey.current === queryKey) return;
            lastEmittedQueryKey.current = queryKey;
            onQueryChange(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [
        useUrlState,
        onQueryChange,
        statusFilter,
        priorityFilter,
        memberFilter,
        departmentFilter,
        lockedMemberIds,
        lockedDepartment,
        titleQuery,
        createdFrom,
        createdTo,
        dueFrom,
        dueTo,
        sortBy,
        sortDir,
        page,
        pageSize
    ]);

    const buildQuery = (overrides?: Partial<{ page: number; pageSize: number }>) => {
        const query: TaskListQuery = {};
        if (statusFilter.length) query.status = normalizeList(statusFilter).join(",");
        if (priorityFilter.length) query.priority = normalizeList(priorityFilter).join(",");
        if ((lockedMemberIds ?? memberFilter).length) {
            query.assignedTo = normalizeList(lockedMemberIds ?? memberFilter).join(",");
        }
        if ((lockedDepartment ?? departmentFilter).length) {
            query.department = normalizeList(lockedDepartment ?? departmentFilter).join(",");
        }
        if (titleQuery.trim()) query.q = titleQuery.trim();
        if (createdFrom) query.createdFrom = createdFrom;
        if (createdTo) query.createdTo = createdTo;
        if (dueFrom) query.dueFrom = dueFrom;
        if (dueTo) query.dueTo = dueTo;
        query.sortBy = sortBy;
        query.sortDir = sortDir;
        query.page = overrides?.page ?? resolvedPage;
        query.pageSize = overrides?.pageSize ?? resolvedPageSize;
        return query;
    };

    const currentPageSize = pagination?.pageSize ?? resolvedPageSize;
    const totalTasks =
        pagination?.total ??
        (pagination?.totalPages ? pagination.totalPages * currentPageSize : tasks.length);
    const effectivePage = resolvedPage;
    const currentPage = effectivePage;

    useEffect(() => {
        if (!useUrlState) return;
        if (page !== currentPage) {
            setPage(currentPage);
        }
    }, [currentPage, page, useUrlState]);

    const lastControlledPage = useRef<number | undefined>(controlledPage);
    const lastControlledPageSize = useRef<number | undefined>(controlledPageSize);

    useEffect(() => {
        if (useUrlState) return;
        if (controlledPage !== lastControlledPage.current) {
            lastControlledPage.current = controlledPage;
            if (controlledPage !== undefined && controlledPage !== page) {
                setPage(controlledPage);
            }
        }
        if (controlledPageSize !== lastControlledPageSize.current) {
            lastControlledPageSize.current = controlledPageSize;
            if (controlledPageSize !== undefined && controlledPageSize !== pageSize) {
                setPageSize(controlledPageSize);
            }
        }
    }, [controlledPage, controlledPageSize, page, pageSize, useUrlState]);

    useEffect(() => {
        if (useUrlState) return;
        if (!forcedStatusFilter) return;
        const key = forcedStatusFilter.join(",");
        if (lastAppliedForcedStatus.current === key) return;
        lastAppliedForcedStatus.current = key;
        setStatusFilter(parseListParam(key));
        setPage(1);
    }, [forcedStatusFilter, useUrlState]);

    useEffect(() => {
        if (useUrlState || !initialQuery || didInitRef.current) return;
        didInitRef.current = true;
        setStatusFilter(parseListParam(initialQuery.status ?? ""));
        setPriorityFilter(parseListParam(initialQuery.priority ?? ""));
        setMemberFilter(
            lockedMemberIds ?? parseListParam(initialQuery.assignedTo ?? "")
        );
        setDepartmentFilter(
            lockedDepartment ?? parseListParam(initialQuery.department ?? "")
        );
        setTitleQuery(initialQuery.q ?? "");
        setCreatedFrom(initialQuery.createdFrom ?? "");
        setCreatedTo(initialQuery.createdTo ?? "");
        setDueFrom(initialQuery.dueFrom ?? "");
        setDueTo(initialQuery.dueTo ?? "");
        setSortBy(initialQuery.sortBy ?? "updatedAt");
        setSortDir(initialQuery.sortDir ?? "desc");
        if (typeof initialQuery.page === "number") setPage(initialQuery.page);
        if (typeof initialQuery.pageSize === "number") setPageSize(initialQuery.pageSize);
    }, [initialQuery, lockedMemberIds, lockedDepartment, useUrlState]);

    const memberOptions = useMemo(
        () =>
            teamMembers.map((member, index) => {
                const value =
                    member.id ?? member._id ?? member.email ?? member.name ?? String(index);
                return {
                    value,
                    label: member.name ?? value
                };
            }),
        [teamMembers]
    );

    const departmentOptions = useMemo(() => {
        if (departmentOptionsOverride?.length) {
            return departmentOptionsOverride;
        }
        const names = new Set<string>();
        let hasUnassigned = false;
        teamMembers.forEach((member) => {
            const department = member.department?.trim();
            if (department) {
                names.add(department);
            } else {
                hasUnassigned = true;
            }
        });
        const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
        if (hasUnassigned) sorted.push("Unassigned");
        return sorted.map((dept) => ({value: dept, label: dept}));
    }, [departmentOptionsOverride, teamMembers]);

    const hasResettableFilters =
        Boolean(statusFilter.length) ||
        Boolean(priorityFilter.length) ||
        Boolean(titleQuery.trim()) ||
        Boolean(createdFrom) ||
        Boolean(createdTo) ||
        Boolean(dueFrom) ||
        Boolean(dueTo) ||
        Boolean((lockedMemberIds ?? []).length ? false : memberFilter.length) ||
        Boolean((lockedDepartment ?? []).length ? false : departmentFilter.length);

    const handleResetFilters = () => {
        setStatusFilter(resolvedForcedStatus);
        setPriorityFilter([]);
        setMemberFilter(lockedMemberIds ?? []);
        setDepartmentFilter(lockedDepartment ?? []);
        setTitleQuery("");
        setCreatedFrom("");
        setCreatedTo("");
        setDueFrom("");
        setDueTo("");
        setPage(1);
    };

    const memberDepartmentMap = useMemo(() => {
        const map = new Map<string, string>();
        teamMembers.forEach((member) => {
            const id = resolveTeamMemberId(member);
            if (id) {
                map.set(id, member.department?.trim() || "");
            }
        });
        return map;
    }, [teamMembers]);

    const handleView = (taskId?: string) => {
        if (!taskId) return;
        if (onViewTask) {
            onViewTask(taskId);
            return;
        }
        router.push(`/tasks/${taskId}`);
    };

    const columns: ColumnsType<Task> = [
        {
            key: "title",
            title: "Title",
            sorter: true,
            sortOrder: sortBy === "title" ? (sortDir === "asc" ? "ascend" : "descend") : null,
            render: (row: Task) => {
                const addedBy = resolveAddedByName(row);
                return (
                    <div className="space-y-1">
                        <p className="font-semibold text-text-primary break-words">{row.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            {row.status ? (
                                <TaskStatusBadge
                                    taskId={row.id ?? row._id}
                                    status={row.status}
                                    onChange={(nextStatus) => {
                                        const id = row.id ?? row._id;
                                        if (!id) return;
                                        onTaskStatusUpdated?.(id, nextStatus);
                                    }}
                                />
                            ) : null}
                            {row.priority ? <StatusBadge label={row.priority}/> : null}
                        </div>
                        <p className="text-xs text-text-muted">Added by {addedBy}</p>
                    </div>
                );
            }
        },
        {
            key: "assignedTo",
            title: "Assigned To",
            render: (row: Task) => {
                const name = row.assignedToName || "Unassigned";
                const department =
                    row.assignedTo && memberDepartmentMap.get(row.assignedTo)
                        ? memberDepartmentMap.get(row.assignedTo)
                        : "";
                const avatarUrl =
                    (row as Task & { assignedToAvatar?: string }).assignedToAvatar || undefined;
                return (
                    <Tooltip title={department || "Department not set"}>
                        <div className="flex items-center gap-2">
                            <Avatar
                                size={28}
                                src={avatarUrl}
                                className="bg-white/10 text-text-primary"
                            >
                                {getInitials(name)}
                            </Avatar>
                            <span className="font-semibold text-text-primary">{name}</span>
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            key: "dueDate",
            title: "Timeline",
            sorter: true,
            sortOrder: sortBy === "dueDate" ? (sortDir === "asc" ? "ascend" : "descend") : null,
            render: (row: Task) => {
                const startLabel = isClient
                    ? formatShortDate(row.startDate)
                    : formatDateFallback(row.startDate);
                const dueLabel = isClient
                    ? formatShortDate(row.dueDate)
                    : formatDateFallback(row.dueDate);
                let label = "—";
                if (startLabel && dueLabel) {
                    label = `${startLabel} \u2192 ${dueLabel}`;
                } else if (dueLabel) {
                    label = `Due ${dueLabel}`;
                } else if (startLabel) {
                    label = `Starts ${startLabel}`;
                }
                const tooltip = isClient
                    ? row.startDate && row.dueDate
                        ? `Start: ${formatDate(row.startDate)} \u2022 Due: ${formatDate(row.dueDate)}`
                        : row.dueDate
                            ? `Due: ${formatDate(row.dueDate)}`
                            : row.startDate
                                ? `Start: ${formatDate(row.startDate)}`
                                : ""
                    : row.startDate && row.dueDate
                        ? `Start: ${formatDateFallback(row.startDate)} \u2022 Due: ${formatDateFallback(row.dueDate)}`
                        : row.dueDate
                            ? `Due: ${formatDateFallback(row.dueDate)}`
                            : row.startDate
                                ? `Start: ${formatDateFallback(row.startDate)}`
                                : "";
                return tooltip ? (
                    <Tooltip title={tooltip}>
                        <span className="text-sm text-text-primary">{label}</span>
                    </Tooltip>
                ) : (
                    <span className="text-sm text-text-muted">{label}</span>
                );
            }
        },
        {
            key: "updatedAt",
            title: "Last Activity",
            sorter: true,
            sortOrder:
                sortBy === "updatedAt" ? (sortDir === "asc" ? "ascend" : "descend") : null,
            render: (row: Task) => {
                const timestamp = row.lastRemarkAt ?? row.updatedAt ?? row.createdAt;
                const timeLabel = timestamp
                    ? (isClient ? formatRelative(timestamp) : formatDateFallback(timestamp))
                    : "—";
                const fullTimestamp = timestamp
                    ? (isClient ? formatDateTime(timestamp) : formatDateFallback(timestamp))
                    : "";
                return fullTimestamp ? (
                    <Tooltip title={fullTimestamp}>
                        <span className="text-sm text-text-primary">{timeLabel}</span>
                    </Tooltip>
                ) : (
                    <span className="text-sm text-text-muted">{timeLabel}</span>
                );
            }
        },
        {
            key: "createdAt",
            title: "Created",
            sorter: true,
            sortOrder:
                sortBy === "createdAt" ? (sortDir === "asc" ? "ascend" : "descend") : null,
            render: (row: Task) => {
                const timestamp = row.createdAt;
                const timeLabel = timestamp
                    ? (isClient ? formatDate(timestamp) : formatDateFallback(timestamp))
                    : "—";
                const fullTimestamp = timestamp
                    ? (isClient ? formatDateTime(timestamp) : formatDateFallback(timestamp))
                    : "";
                return fullTimestamp ? (
                    <Tooltip title={fullTimestamp}>
                        <span className="text-sm text-text-primary">{timeLabel}</span>
                    </Tooltip>
                ) : (
                    <span className="text-sm text-text-muted">{timeLabel}</span>
                );
            }
        },
        {
            key: "actions",
            title: "",
            align: "right",
            render: (row: Task) => (
                <Tooltip title="View">
                    <Button
                        type="text"
                        icon={<EyeOutlined/>}
                        onClick={(event) => {
                            event.stopPropagation();
                            handleView(row.id ?? row._id);
                        }}
                    />
                </Tooltip>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    value={titleQuery}
                    onChange={(event) => {
                        setTitleQuery(event.target.value);
                        setPage(1);
                    }}
                    allowClear
                    placeholder="Search task title"
                    className="min-w-[220px] flex-1"
                />
                <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Due
          </span>
                    <DatePicker
                        value={dueFrom ? dayjs(dueFrom) : null}
                        onChange={(_, dateString) => {
                            setDueFrom(dateString ? String(dateString) : "");
                            setPage(1);
                        }}
                        className="min-w-[160px]"
                        allowClear
                        format="YYYY-MM-DD"
                    />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
            to
          </span>
                    <DatePicker
                        value={dueTo ? dayjs(dueTo) : null}
                        onChange={(_, dateString) => {
                            setDueTo(dateString ? String(dateString) : "");
                            setPage(1);
                        }}
                        className="min-w-[160px]"
                        allowClear
                        format="YYYY-MM-DD"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Created
          </span>
                    <DatePicker.RangePicker
                        value={
                            createdFrom || createdTo
                                ? [
                                    createdFrom ? dayjs(createdFrom) : null,
                                    createdTo ? dayjs(createdTo) : null
                                ]
                                : null
                        }
                        onChange={(dates) => {
                            const [start, end] = Array.isArray(dates) ? dates : [];
                            setCreatedFrom(start ? start.format("YYYY-MM-DD") : "");
                            setCreatedTo(end ? end.format("YYYY-MM-DD") : "");
                            setPage(1);
                        }}
                        className="min-w-[220px]"
                        allowClear
                        format="YYYY-MM-DD"
                    />
                </div>
                <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    maxTagCount="responsive"
                    placeholder="All Statuses"
                    value={statusFilter}
                    onChange={(values) => {
                        setStatusFilter(values);
                        setPage(1);
                    }}
                    options={STATUS_OPTIONS}
                    className="min-w-[180px]"
                />
                <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    maxTagCount="responsive"
                    placeholder="All Priorities"
                    value={priorityFilter}
                    onChange={(values) => {
                        setPriorityFilter(values);
                        setPage(1);
                    }}
                    options={PRIORITY_OPTIONS}
                    className="min-w-[180px]"
                />
                {hideDepartmentFilter || lockedDepartment ? null : (
                    <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        maxTagCount="responsive"
                        placeholder="All Departments"
                        value={departmentFilter}
                        onChange={(values) => {
                            setDepartmentFilter(values);
                            setPage(1);
                        }}
                        options={departmentOptions}
                        className="min-w-[200px]"
                    />
                )}
                {hideMemberFilter || lockedMemberIds ? null : (
                    <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        maxTagCount="responsive"
                        placeholder="All Team Members"
                        value={memberFilter}
                        onChange={(values) => {
                            setMemberFilter(values);
                            setPage(1);
                        }}
                        options={memberOptions}
                        className="min-w-[220px]"
                    />
                )}
                {showResetFilters || onReload ? (
                    <div className="ml-auto flex items-center gap-2">
                        {showResetFilters ? (
                            <Button
                                type="default"
                                onClick={handleResetFilters}
                                disabled={!hasResettableFilters}
                                className="rounded-full border-border-subtle"
                            >
                                Reset
                            </Button>
                        ) : null}
                        {onReload ? (
                            <Button
                                type="default"
                                onClick={onReload}
                                className="rounded-full border-border-subtle"
                            >
                                Reload
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <Table
                columns={columns}
                dataSource={tasks}
                rowKey={(record) => record.id ?? record._id ?? `${record.title}-${record.dueDate ?? ""}`}
                locale={{emptyText: "No tasks match the current filters."}}
                loading={loading}
                size="small"
                rowClassName={() => "cursor-pointer"}
                pagination={{
                    current: currentPage,
                    pageSize: currentPageSize,
                    total: totalTasks,
                    showSizeChanger: true,
                    pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
                    showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} tasks`,
                    onChange: (nextPage, nextPageSize) => {
                        const nextSize = nextPageSize ?? pageSize;
                        const nextPageValue = nextSize !== pageSize ? 1 : nextPage;
                        if (!useUrlState) {
                            onPageChange?.(nextPageValue, nextSize);
                            return;
                        }
                        if (nextPageValue !== page) setPage(nextPageValue);
                        if (nextSize !== pageSize) {
                            setPageSize(nextSize);
                        }
                    }
                }}
                onRow={(record) => ({
                    onClick: () => handleView(record.id ?? record._id)
                })}
                onChange={(pager, _filters, sorter) => {
                    const nextPage = pager.current ?? 1;
                    const nextPageSize = pager.pageSize ?? DEFAULT_PAGE_SIZE;
                    const nextPageValue = nextPageSize !== pageSize ? 1 : nextPage;
                    if (nextPageValue !== page) setPage(nextPageValue);
                    if (nextPageSize !== pageSize) {
                        setPageSize(nextPageSize);
                    }

                    const normalizedSorter = Array.isArray(sorter)
                        ? (sorter[0] as SorterResult<Task>)
                        : (sorter as SorterResult<Task>);

                    const sorterKey = typeof normalizedSorter?.columnKey === "string" ? normalizedSorter.columnKey : null;
                    const sorterOrder = normalizedSorter?.order;
                    if (
                        sorterOrder &&
                        (sorterKey === "title" ||
                            sorterKey === "dueDate" ||
                            sorterKey === "updatedAt" ||
                            sorterKey === "createdAt")
                    ) {
                        setSortBy(sorterKey);
                        setSortDir(sorterOrder === "ascend" ? "asc" : "desc");
                        setPage(1);
                    }
                    if (!useUrlState) {
                        const overridePage = sorterOrder ? 1 : nextPageValue;
                        const nextQuery = buildQuery({page: overridePage, pageSize: nextPageSize});
                        lastEmittedQueryKey.current = JSON.stringify(nextQuery);
                        onQueryChange?.(nextQuery);
                    }
                }}
            />
        </div>
    );
}
