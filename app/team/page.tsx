import Link from "next/link";
import TeamPageClient from "@/components/team/TeamPageClient";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">People</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Team</h2>
        <p className="mt-2 text-sm text-text-muted">
          Track workload and performance across the executive support team.
        </p>
        </div>
        <Link
          href="/team/new"
          className="rounded-full bg-brand-primary px-5 py-2 text-xs font-semibold text-black shadow-soft transition hover:brightness-110"
        >
          Add Team Member
        </Link>
      </div>

      <TeamPageClient />
    </div>
  );
}
