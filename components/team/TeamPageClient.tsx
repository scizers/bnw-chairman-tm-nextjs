"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import TeamTableClient from "@/components/team/TeamTableClient";
import { teamMembersApi } from "@/lib/api";
import type { TeamMember } from "@/types/team";
import type { TeamMemberListMeta, TeamMemberListQuery } from "@/lib/api/teamMembers";

export default function TeamPageClient() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pagination, setPagination] = useState<TeamMemberListMeta | null>(null);
  const [query, setQuery] = useState<TeamMemberListQuery>({
    sortBy: "createdAt",
    sortDir: "desc",
    page: 1,
    pageSize: 20
  });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = useMemo(() => JSON.stringify(query), [query]);
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await teamMembersApi.listPaged(queryRef.current);
      setTeamMembers(response?.data ?? []);
      setPagination(response?.meta ?? null);
    } catch (err) {
      setError("Unable to load team data.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(timer);
  }, [queryKey, load]);

  if (loading && !hasLoaded) {
    return (
      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Team feed unavailable" description={error} onRetry={load} />;
  }

  const hasActiveFilters = Boolean(query.name?.trim()) || Boolean(query.designation?.trim());

  if (!teamMembers.length && !hasActiveFilters) {
    return (
      <EmptyState
        title="No team members"
        description="Add team members to monitor tasks."
      />
    );
  }

  return (
    <TeamTableClient
      teamMembers={teamMembers}
      pagination={pagination ?? undefined}
      loading={loading}
      query={query}
      onQueryChange={(nextQuery) => {
        const nextKey = JSON.stringify(nextQuery);
        setQuery((prev) => (JSON.stringify(prev) === nextKey ? prev : nextQuery));
      }}
    />
  );
}
