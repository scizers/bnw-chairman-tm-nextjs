"use client";

import UsersPageClient from "@/components/users/UsersPageClient";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Administration</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Users</h2>
          <p className="mt-2 text-sm text-text-muted">
            Manage access, roles, and account status across the back office.
          </p>
        </div>
      </div>

      <UsersPageClient />
    </div>
  );
}
