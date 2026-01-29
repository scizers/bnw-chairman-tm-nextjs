import TeamPageClient from "@/components/team/TeamPageClient";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">People</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Team</h2>
        <p className="mt-2 text-sm text-text-muted">
          Track workload and performance across the executive support team.
        </p>
      </div>

      <TeamPageClient />
    </div>
  );
}
