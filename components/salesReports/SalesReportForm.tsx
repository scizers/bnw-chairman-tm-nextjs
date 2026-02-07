"use client";

import { useMemo } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Select, Table } from "antd";
import { Trash2 } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { TeamMember } from "@/types/team";
import type {
  DailySalesReport,
  SalesReportDirector,
  SalesReportDirectorMetrics,
  SalesReportGrandTotals,
  SalesReportSalesHead
} from "@/types/salesReport";
import { resolveTeamMemberId } from "@/lib/utils/task";

const EMPTY_METRICS: SalesReportDirectorMetrics = {
  activeTeamMembers: 0,
  clientMeetings: 0,
  cpMeetingsHeadOffice: 0,
  cpMeetingsChannelPartner: 0,
  salesAchievedAED: 0
};

const EMPTY_TOTALS: SalesReportGrandTotals = {
  activeTeamMembers: 0,
  clientMeetings: 0,
  cpMeetingsHeadOffice: 0,
  cpMeetingsChannelPartner: 0,
  salesAchievedAED: 0
};

export interface SalesReportFormState {
  reportDate: string;
  remarks: string;
  salesHeads: SalesReportSalesHead[];
}

interface SalesReportFormProps {
  value: SalesReportFormState;
  onChange: (next: SalesReportFormState) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  teamMembers: TeamMember[];
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number(value)
  );
};

const formatCurrency = (value?: string | number) => {
  if (value === undefined || value === null || value === "") return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numeric);
};

const parseCurrency = (value?: string) => value?.replace(/[^\d.-]/g, "") ?? "";

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const disableFutureDates = (current: dayjs.Dayjs | null) => {
  if (!current) return false;
  return current.isAfter(dayjs().endOf("day"));
};

const createDirector = (): SalesReportDirector => ({
  directorId: "",
  directorName: "",
  clientId: createClientId(),
  metrics: { ...EMPTY_METRICS }
});

const createSalesHead = (): SalesReportSalesHead => ({
  salesHeadId: "",
  salesHeadName: "",
  totalSalesAED: 0,
  directors: [createDirector()]
});

const computeTotals = (salesHeads: SalesReportSalesHead[]) => {
  const totals = { ...EMPTY_TOTALS };
  const headTotals: number[] = [];

  salesHeads.forEach((head, index) => {
    let headSales = 0;
    head.directors?.forEach((director) => {
      const metrics = director.metrics || EMPTY_METRICS;
      const activeTeamMembers = normalizeNumber(metrics.activeTeamMembers);
      const clientMeetings = normalizeNumber(metrics.clientMeetings);
      const cpMeetingsHeadOffice = normalizeNumber(metrics.cpMeetingsHeadOffice);
      const cpMeetingsChannelPartner = normalizeNumber(metrics.cpMeetingsChannelPartner);
      const salesAchievedAED = normalizeNumber(metrics.salesAchievedAED);

      totals.activeTeamMembers += activeTeamMembers;
      totals.clientMeetings += clientMeetings;
      totals.cpMeetingsHeadOffice += cpMeetingsHeadOffice;
      totals.cpMeetingsChannelPartner += cpMeetingsChannelPartner;
      totals.salesAchievedAED += salesAchievedAED;

      headSales += salesAchievedAED;
    });
    headTotals[index] = headSales;
  });

  return { totals, headTotals };
};

export const buildSalesReportPayload = (state: SalesReportFormState): Partial<DailySalesReport> => {
  const totals = { ...EMPTY_TOTALS };
  const salesHeads = (state.salesHeads || []).map((head) => {
    let headSales = 0;
    const directors = (head.directors || []).map((director) => {
      const metrics = director.metrics || EMPTY_METRICS;
      const normalizedMetrics = {
        activeTeamMembers: normalizeNumber(metrics.activeTeamMembers),
        clientMeetings: normalizeNumber(metrics.clientMeetings),
        cpMeetingsHeadOffice: normalizeNumber(metrics.cpMeetingsHeadOffice),
        cpMeetingsChannelPartner: normalizeNumber(metrics.cpMeetingsChannelPartner),
        salesAchievedAED: normalizeNumber(metrics.salesAchievedAED)
      };

      totals.activeTeamMembers += normalizedMetrics.activeTeamMembers;
      totals.clientMeetings += normalizedMetrics.clientMeetings;
      totals.cpMeetingsHeadOffice += normalizedMetrics.cpMeetingsHeadOffice;
      totals.cpMeetingsChannelPartner += normalizedMetrics.cpMeetingsChannelPartner;
      totals.salesAchievedAED += normalizedMetrics.salesAchievedAED;
      headSales += normalizedMetrics.salesAchievedAED;

      return {
        directorId: director.directorId || undefined,
        directorName: director.directorName?.trim() || undefined,
        metrics: normalizedMetrics
      };
    });

    return {
      salesHeadId: head.salesHeadId || undefined,
      salesHeadName: head.salesHeadName?.trim() || undefined,
      totalSalesAED: headSales,
      directors
    };
  });

  return {
    reportDate: state.reportDate,
    remarks: state.remarks?.trim() || undefined,
    salesHeads,
    grandTotals: totals
  };
};

export default function SalesReportForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  teamMembers,
  submitLabel = "Save",
  loading,
  disabled
}: SalesReportFormProps) {
  const teamOptions = useMemo(
    () =>
      teamMembers
        .map((member) => ({
          value: resolveTeamMemberId(member),
          label: member.name
        }))
        .filter((option) => option.value && option.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [teamMembers]
  );

  const { totals, headTotals } = useMemo(
    () => computeTotals(value.salesHeads || []),
    [value.salesHeads]
  );

  const hasSalesHead = (value.salesHeads || []).some((head) => Boolean(head.salesHeadId));
  const hasDirector = (value.salesHeads || []).some((head) =>
    (head.directors || []).some((director) => Boolean(director.directorId))
  );
  const canSubmit = Boolean(value.reportDate) && hasSalesHead && hasDirector;
  const isLocked = Boolean(disabled || loading);

  const updateSalesHead = (index: number, updates: Partial<SalesReportSalesHead>) => {
    const nextHeads = [...value.salesHeads];
    const current = nextHeads[index] || createSalesHead();
    nextHeads[index] = { ...current, ...updates };
    onChange({ ...value, salesHeads: nextHeads });
  };

  const removeSalesHead = (index: number) => {
    const nextHeads = value.salesHeads.filter((_, idx) => idx !== index);
    onChange({ ...value, salesHeads: nextHeads.length ? nextHeads : [createSalesHead()] });
  };

  const addSalesHead = () => {
    onChange({ ...value, salesHeads: [...value.salesHeads, createSalesHead()] });
  };

  const updateDirector = (
    headIndex: number,
    directorIndex: number,
    updates: Partial<SalesReportDirector>
  ) => {
    const nextHeads = [...value.salesHeads];
    const head = nextHeads[headIndex] || createSalesHead();
    const directors = head.directors ? [...head.directors] : [];
    const currentDirector = directors[directorIndex] || createDirector();
    const clientId = currentDirector.clientId ?? createClientId();
    directors[directorIndex] = { ...currentDirector, ...updates, clientId };
    nextHeads[headIndex] = { ...head, directors };
    onChange({ ...value, salesHeads: nextHeads });
  };

  const updateDirectorMetric = (
    headIndex: number,
    directorIndex: number,
    metric: keyof SalesReportDirectorMetrics,
    nextValue: number | string | null
  ) => {
    const numericValue = typeof nextValue === "string" ? Number(nextValue) : nextValue;
    const normalized = Number.isFinite(numericValue) ? Number(numericValue) : 0;
    const nextHeads = [...value.salesHeads];
    const head = nextHeads[headIndex] || createSalesHead();
    const directors = head.directors ? [...head.directors] : [];
    const currentDirector = directors[directorIndex] || createDirector();
    const metrics = { ...EMPTY_METRICS, ...currentDirector.metrics, [metric]: normalized };
    directors[directorIndex] = {
      ...currentDirector,
      clientId: currentDirector.clientId ?? createClientId(),
      metrics
    };
    nextHeads[headIndex] = { ...head, directors };
    onChange({ ...value, salesHeads: nextHeads });
  };

  const addDirector = (headIndex: number) => {
    const nextHeads = [...value.salesHeads];
    const head = nextHeads[headIndex] || createSalesHead();
    const directors = head.directors ? [...head.directors, createDirector()] : [createDirector()];
    nextHeads[headIndex] = { ...head, directors };
    onChange({ ...value, salesHeads: nextHeads });
  };

  const removeDirector = (headIndex: number, directorIndex: number) => {
    const nextHeads = [...value.salesHeads];
    const head = nextHeads[headIndex] || createSalesHead();
    const directors = (head.directors || []).filter((_, idx) => idx !== directorIndex);
    nextHeads[headIndex] = {
      ...head,
      directors: directors.length ? directors : [createDirector()]
    };
    onChange({ ...value, salesHeads: nextHeads });
  };

  return (
    <div className="rounded-xl bg-surface-card p-6 shadow-card space-y-6">
      <Form layout="vertical" disabled={isLocked}>
        <div className="grid gap-4 md:grid-cols-3">
          <Form.Item
            label={<span className="text-xs uppercase tracking-[0.2em] text-text-muted">Report Date</span>}
          >
            <DatePicker
              value={value.reportDate ? dayjs(value.reportDate) : null}
              onChange={(_, dateString) =>
                onChange({
                  ...value,
                  reportDate: dateString ? String(dateString) : ""
                })
              }
              className="w-full"
              format="YYYY-MM-DD"
              allowClear
              disabledDate={disableFutureDates}
            />
          </Form.Item>
          <Form.Item
            className="md:col-span-3"
            label={<span className="text-xs uppercase tracking-[0.2em] text-text-muted">Remarks</span>}
          >
            <Input.TextArea
              value={value.remarks}
              onChange={(event) =>
                onChange({ ...value, remarks: event.target.value })
              }
              rows={3}
            />
          </Form.Item>
        </div>
      </Form>

      <div className="space-y-6">
        {value.salesHeads.map((head, headIndex) => {
          const headTotal = headTotals[headIndex] ?? 0;
          const directorColumns: ColumnsType<SalesReportDirector> = [
            {
              key: "director",
              title: "Director",
              render: (_value, row, rowIndex) => (
                <Select
                  value={row.directorId || undefined}
                  placeholder="Select director"
                  options={teamOptions}
                  disabled={isLocked}
                  showSearch
                  optionFilterProp="label"
                  onChange={(directorId) => {
                    const selected = teamMembers.find(
                      (member) => resolveTeamMemberId(member) === directorId
                    );
                    updateDirector(headIndex, rowIndex, {
                      directorId,
                      directorName: selected?.name || ""
                    });
                  }}
                />
              )
            },
            {
              key: "activeTeamMembers",
              title: "Active Team #",
              render: (_value, row, rowIndex) => (
                <InputNumber
                  min={0}
                  value={row.metrics?.activeTeamMembers ?? 0}
                  disabled={isLocked}
                  onChange={(value) =>
                    updateDirectorMetric(headIndex, rowIndex, "activeTeamMembers", value)
                  }
                  className="w-full"
                />
              )
            },
            {
              key: "clientMeetings",
              title: "Client Meetings",
              render: (_value, row, rowIndex) => (
                <InputNumber
                  min={0}
                  value={row.metrics?.clientMeetings ?? 0}
                  disabled={isLocked}
                  onChange={(value) =>
                    updateDirectorMetric(headIndex, rowIndex, "clientMeetings", value)
                  }
                  className="w-full"
                />
              )
            },
            {
              key: "cpMeetingsHeadOffice",
              title: "CP Meetings (HO)",
              render: (_value, row, rowIndex) => (
                <InputNumber
                  min={0}
                  value={row.metrics?.cpMeetingsHeadOffice ?? 0}
                  disabled={isLocked}
                  onChange={(value) =>
                    updateDirectorMetric(
                      headIndex,
                      rowIndex,
                      "cpMeetingsHeadOffice",
                      value
                    )
                  }
                  className="w-full"
                />
              )
            },
            {
              key: "cpMeetingsChannelPartner",
              title: "CP Meetings (Channel)",
              render: (_value, row, rowIndex) => (
                <InputNumber
                  min={0}
                  value={row.metrics?.cpMeetingsChannelPartner ?? 0}
                  disabled={isLocked}
                  onChange={(value) =>
                    updateDirectorMetric(
                      headIndex,
                      rowIndex,
                      "cpMeetingsChannelPartner",
                      value
                    )
                  }
                  className="w-full"
                />
              )
            },
            {
              key: "salesAchievedAED",
              title: "Sales (AED)",
              render: (_value, row, rowIndex) => (
                <InputNumber
                  min={0}
                  value={row.metrics?.salesAchievedAED ?? 0}
                  formatter={formatCurrency}
                  parser={parseCurrency}
                  disabled={isLocked}
                  onChange={(value) =>
                    updateDirectorMetric(headIndex, rowIndex, "salesAchievedAED", value)
                  }
                  className="w-full"
                />
              )
            },
            {
              key: "actions",
              title: "Actions",
              align: "right",
              render: (_value, _row, rowIndex) => (
                <Button
                  type="text"
                  danger
                  aria-label="Remove director"
                  disabled={isLocked}
                  onClick={() => removeDirector(headIndex, rowIndex)}
                  icon={<Trash2 size={16} />}
                />
              )
            }
          ];

          return (
            <div
              key={`sales-head-${headIndex}`}
              className="rounded-xl border border-border-subtle p-4 space-y-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[220px] flex-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Sales Head
                  </label>
                  <Select
                    value={head.salesHeadId || undefined}
                    placeholder="Select sales head"
                    options={teamOptions}
                    disabled={isLocked}
                    showSearch
                    optionFilterProp="label"
                    onChange={(salesHeadId) => {
                      const selected = teamMembers.find(
                        (member) => resolveTeamMemberId(member) === salesHeadId
                      );
                      updateSalesHead(headIndex, {
                        salesHeadId,
                        salesHeadName: selected?.name || ""
                      });
                    }}
                    className="mt-2 w-full"
                  />
                </div>
                <div className="min-w-[160px]">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Sales Head Total (AED)
                  </p>
                  <p className="mt-2 text-lg font-semibold text-text-primary">
                    {formatNumber(headTotal)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Button
                    type="text"
                    danger
                    aria-label="Remove sales head"
                    disabled={isLocked}
                    onClick={() => removeSalesHead(headIndex)}
                    icon={<Trash2 size={16} />}
                  />
                </div>
              </div>

              <Table
                columns={directorColumns}
                dataSource={head.directors}
                rowKey={(record) =>
                  record.clientId ||
                  record.directorId ||
                  `${headIndex}-${record.directorName || "director"}`
                }
                pagination={false}
              />

              <div className="flex justify-end">
                <Button
                  type="dashed"
                  onClick={() => addDirector(headIndex)}
                  disabled={isLocked}
                >
                  Add Director
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-muted/30 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Grand Totals</p>
        <div className="mt-2 grid gap-1 md:grid-cols-5 md:gap-x-1">
          <div>
            <p className="text-xs text-text-muted">Team Members</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatNumber(totals.activeTeamMembers)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Client Meetings</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatNumber(totals.clientMeetings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">CP Meetings (HO)</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatNumber(totals.cpMeetingsHeadOffice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">CP Meetings (Channel)</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatNumber(totals.cpMeetingsChannelPartner)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Sales (AED)</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatNumber(totals.salesAchievedAED)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onCancel ? (
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        ) : null}
        {!hasSalesHead || !hasDirector ? (
          <div className="text-xs text-rose-300">
            {!hasSalesHead ? "Select at least one sales head." : null}
            {!hasSalesHead && !hasDirector ? " " : null}
            {!hasDirector ? "Select at least one director." : null}
          </div>
        ) : null}
        <Button
          type="primary"
          onClick={onSubmit}
          loading={loading}
          disabled={!canSubmit || isLocked}
        >
          {submitLabel}
        </Button>
        <Button type="dashed" onClick={addSalesHead} disabled={isLocked}>
          Add Sales Head
        </Button>
      </div>
    </div>
  );
}
