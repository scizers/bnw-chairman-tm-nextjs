"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MomForm, { buildMomPayload, MomFormState } from "@/components/moms/MomForm";
import { momsApi } from "@/lib/api";
import ErrorState from "@/components/common/ErrorState";

const todayLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const defaultForm: MomFormState = {
  title: "",
  meetingDate: todayLocal(),
  attendees: [],
  rawNotes: "",
  attachments: [],
};

export default function MomCreateClient() {
  const router = useRouter();
  const [form, setForm] = useState<MomFormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await momsApi.create(buildMomPayload(form));
      const id = created?.id ?? created?._id;
      router.push(id ? `/moms/${id}` : "/moms");
    } catch (err) {
      setError("Failed to create MOM.");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <ErrorState title="Unable to create MOM" description={error} />;
  }

  return (
    <MomForm
      value={form}
      onChange={setForm}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      submitLabel="Create MOM"
      loading={saving}
    />
  );
}
