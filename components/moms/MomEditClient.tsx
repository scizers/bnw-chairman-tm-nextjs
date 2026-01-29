"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MomForm, { buildMomPayload, MomFormState } from "@/components/moms/MomForm";
import { momsApi } from "@/lib/api";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import type { Mom } from "@/types/mom";

interface MomEditClientProps {
  momId: string;
}

const mapMomToForm = (mom: Mom): MomFormState => ({
  title: mom.title || "",
  meetingDate: mom.meetingDate ? mom.meetingDate.slice(0, 10) : "",
  attendees: mom.attendees?.join("\n") || "",
  rawNotes: mom.rawNotes || "",
  attachments: mom.attachments?.map((item) => item.fileUrl).join("\n") || "",
  aiSummary: mom.aiSummary || "",
  aiExtractedAt: mom.aiExtractedAt ? mom.aiExtractedAt.slice(0, 10) : "",
});

export default function MomEditClient({ momId }: MomEditClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<MomFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const mom = await momsApi.getById(momId);
        setForm(mapMomToForm(mom));
      } catch (err) {
        setError("Unable to load MOM.");
      }
    };
    void load();
  }, [momId]);

  const handleSubmit = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await momsApi.update(momId, buildMomPayload(form));
      const id = updated?.id ?? updated?._id ?? momId;
      router.push(`/moms/${id}`);
    } catch (err) {
      setError("Failed to update MOM.");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <ErrorState title="Unable to edit MOM" description={error} />;
  }

  if (!form) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  return (
    <MomForm
      value={form}
      onChange={setForm}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      submitLabel="Save MOM"
      loading={saving}
    />
  );
}
