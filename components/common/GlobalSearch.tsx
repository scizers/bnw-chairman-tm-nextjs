"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/team";
import { normalizeTasks, resolveTeamMemberId } from "@/lib/utils/task";

interface SearchDataset {
  tasks: Task[];
  team: TeamMember[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<SearchDataset>({ tasks: [], team: [] });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchDataset = async () => {
    if (loading || dataset.tasks.length || dataset.team.length) return;
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, teamRes] = await Promise.all([
        clientApi.get<Task[]>("/tasks"),
        clientApi.get<TeamMember[]>("/team-members")
      ]);
      setDataset({
        tasks: normalizeTasks(tasksRes.data ?? []),
        team: teamRes.data ?? []
      });
    } catch (err) {
      setError("Unable to load global search data.");
    } finally {
      setLoading(false);
    }
  };

  const results = useMemo(() => {
    if (!query.trim()) {
      return { tasks: [], team: [] };
    }
    const lower = query.toLowerCase();
    const tasks = dataset.tasks.filter((task) =>
      [task.title, task.description, task.assignedToName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lower))
    );
    const team = dataset.team.filter((member) =>
      [member.name, member.designation, member.department]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lower))
    );
    return { tasks, team };
  }, [dataset, query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm text-text-muted shadow-soft">
        <Search size={16} />
        <input
          type="search"
          placeholder="Search tasks, team, remarks..."
          value={query}
          onFocus={() => {
            setOpen(true);
            void fetchDataset();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            void fetchDataset();
          }}
          className="w-full bg-transparent text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>
      {open ? (
        <div className="absolute z-20 mt-3 w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-card">
          <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
            Global Search
          </div>
          {loading ? (
            <div className="px-4 pb-4 text-sm text-text-muted">Loading results...</div>
          ) : error ? (
            <div className="px-4 pb-4 text-sm text-rose-200">{error}</div>
          ) : query.trim().length < 2 ? (
            <div className="px-4 pb-4 text-sm text-text-muted">Type at least 2 characters.</div>
          ) : results.tasks.length || results.team.length ? (
            <div className="max-h-72 overflow-auto px-4 pb-4">
              {results.tasks.length ? (
                <div className="mb-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-muted">Tasks</p>
                  <div className="space-y-2">
                    {results.tasks.slice(0, 5).map((task, index) => (
                      <Link
                        key={task.id ?? task._id ?? `${task.title}-${index}`}
                        href={`/tasks/${task.id ?? task._id}`}
                        className="block rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-primary hover:bg-white/5"
                      >
                        <p className="font-semibold">{task.title}</p>
                        <p className="text-xs text-text-muted">{task.assignedToName || "Unassigned"}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {results.team.length ? (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-muted">Team</p>
                  <div className="space-y-2">
                    {results.team.slice(0, 5).map((member, index) => {
                      const memberId = resolveTeamMemberId(member);
                      return (
                      <Link
                        key={memberId || member.email || `${member.name}-${index}`}
                        href={`/team/${memberId}`}
                        className="block rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-primary hover:bg-white/5"
                      >
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-text-muted">{member.designation || "Team Member"}</p>
                      </Link>
                    );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="px-4 pb-4 text-sm text-text-muted">No matches found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
