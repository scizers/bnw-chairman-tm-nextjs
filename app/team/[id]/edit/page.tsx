"use client";

import { useParams } from "next/navigation";
import TeamMemberEditClient from "@/components/team/TeamMemberEditClient";

export default function TeamMemberEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Team Member</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Edit Profile</h2>
        <p className="mt-2 text-sm text-text-muted">
          Update role details and contact information.
        </p>
      </div>

      <TeamMemberEditClient teamMemberId={id} />
    </div>
  );
}
