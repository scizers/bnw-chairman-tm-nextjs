"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, PlusCircle, UserCircle2 } from "lucide-react";
import GlobalSearch from "@/components/common/GlobalSearch";
import { clearAuthToken } from "@/lib/auth/token";

export default function TopBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle bg-surface-base/60 px-6 py-4 backdrop-blur">
      <div className="flex min-w-[240px] flex-1 items-center gap-4">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-black shadow-soft transition hover:brightness-110"
        >
          <PlusCircle size={18} />
          Create Task
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-border-subtle px-3 py-2 text-sm text-text-muted hover:text-text-primary"
          >
            <UserCircle2 size={18} />
            Chairman
          </button>
          {open ? (
            <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-border-subtle bg-surface-card p-2 shadow-card">
              <button
                type="button"
                onClick={() => {
                  clearAuthToken();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-primary"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
