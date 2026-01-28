"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, Users, Settings } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-surface-card border-r border-border-subtle px-6 py-8">
      <Link href="/dashboard" className="mb-10 block hover:opacity-90">
        <p className="text-sm uppercase tracking-[0.3em] text-text-muted">Chairman Office</p>
        <h1 className="font-display text-2xl text-text-primary mt-2">Executive Desk</h1>
      </Link>
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                active
                  ? "bg-brand-primary/15 text-brand-primary shadow-soft"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-8 text-xs text-text-muted">
        Confidential · ChairmanTM
      </div>
    </aside>
  );
}
