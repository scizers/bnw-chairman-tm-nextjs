"use client";

import TeamMemberCreateClient from "@/components/team/TeamMemberCreateClient";

export default function TeamMemberCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">People</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Add Team Member</h2>
        <p className="mt-2 text-sm text-text-muted">
          Create a new team member profile to assign tasks.
        </p>
      </div>

      <TeamMemberCreateClient />
    </div>
  );
}
