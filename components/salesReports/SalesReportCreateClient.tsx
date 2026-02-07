"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import SalesReportForm, {
  buildSalesReportPayload,
  type SalesReportFormState
} from "@/components/salesReports/SalesReportForm";
import { salesReportsApi, teamMembersApi } from "@/lib/api";
import type { SalesReportDirector, SalesReportSalesHead } from "@/types/salesReport";
import type { TeamMember } from "@/types/team";

const todayLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type SalesReportPrefill = {
  salesHeads?: SalesReportSalesHead[];
};

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

const createPrefillDirector = (director?: SalesReportDirector): SalesReportDirector => ({
  directorId: director?.directorId ?? "",
  directorName: director?.directorName ?? "",
  clientId: createClientId(),
  metrics: {
    activeTeamMembers: normalizeNumber(director?.metrics?.activeTeamMembers),
    clientMeetings: 0,
    cpMeetingsHeadOffice: 0,
    cpMeetingsChannelPartner: 0,
    salesAchievedAED: 0
  }
});

const createPrefillSalesHead = (head?: SalesReportSalesHead): SalesReportSalesHead => {
  const directors =
    head?.directors && head.directors.length
      ? head.directors.map((director) => createPrefillDirector(director))
      : [createPrefillDirector()];

  return {
    salesHeadId: head?.salesHeadId ?? "",
    salesHeadName: head?.salesHeadName ?? "",
    totalSalesAED: 0,
    directors
  };
};

const emptyFormState = (): SalesReportFormState => ({
  reportDate: todayLocal(),
  remarks: "",
  salesHeads: [
    {
      salesHeadId: "",
      salesHeadName: "",
      totalSalesAED: 0,
      directors: [
        {
          directorId: "",
          directorName: "",
          clientId: createClientId(),
          metrics: {
            activeTeamMembers: 0,
            clientMeetings: 0,
            cpMeetingsHeadOffice: 0,
            cpMeetingsChannelPartner: 0,
            salesAchievedAED: 0
          }
        }
      ]
    }
  ]
});

const buildPrefilledState = (prefill?: SalesReportPrefill): SalesReportFormState => {
  const base = emptyFormState();
  const salesHeads = prefill?.salesHeads;
  if (!salesHeads || !salesHeads.length) return base;
  return {
    ...base,
    salesHeads: salesHeads.map((head) => createPrefillSalesHead(head))
  };
};

export default function SalesReportCreateClient() {
  const router = useRouter();
  const [form, setForm] = useState<SalesReportFormState>(emptyFormState());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadTeam = async () => {
      setLoadingTeam(true);
      try {
        const team = await teamMembersApi.list();
        if (!active) return;
        setTeamMembers(team ?? []);
      } catch {
        if (!active) return;
        setTeamMembers([]);
      } finally {
        if (active) setLoadingTeam(false);
      }
    };
    void loadTeam();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPrefill = async () => {
      setLoadingPrefill(true);
      try {
        const prefill = await salesReportsApi.prefill();
        if (!active) return;
        setForm(buildPrefilledState(prefill));
      } catch {
        if (!active) return;
        setForm(emptyFormState());
      } finally {
        if (active) setLoadingPrefill(false);
      }
    };
    void loadPrefill();
    return () => {
      active = false;
    };
  }, []);

  const isReady = !loadingTeam && !loadingPrefill;

  const handleSubmit = async () => {
    if (!form.reportDate) return;
    setSaving(true);
    setSaveError(null);
    try {
      await salesReportsApi.create(buildSalesReportPayload(form));
      router.push("/sales-reports?saved=1");
    } catch (err) {
      const apiMessage =
        typeof (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message === "string"
          ? (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message
          : null;
      setSaveError(apiMessage || "Failed to save daily sales report.");
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {saveError ? (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {saveError}
        </div>
      ) : null}
      <SalesReportForm
        value={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        teamMembers={teamMembers}
        submitLabel={saving ? "Saving..." : "Save Report"}
        loading={saving}
      />
    </div>
  );
}
