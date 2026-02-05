"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  ClipboardList,
  Building2,
  BarChart3
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import logo from "@/public/bnw-logo.png";
import { getAuthProfile } from "@/lib/auth/token";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/moms", label: "MOM", icon: ClipboardList },
  { href: "/sales-reports", label: "Sales Reports", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = getAuthProfile();
  const visibleNavItems =
    role === "sales_report"
      ? navItems
      : navItems.filter((item) => item.href !== "/sales-reports");

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-surface-card border-r border-border-subtle px-6 py-8">
      <Link href="/dashboard" className="mb-6 block hover:opacity-90">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12">
            <Image
              src={logo}
              alt="BNW logo"
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-text-muted">Chairman Office</p>
            <h1 className="mt-2 font-display text-2xl text-text-primary">Executive Desk</h1>
          </div>
        </div>
      </Link>
      <nav className="flex flex-col gap-3">
        {visibleNavItems.map((item) => {
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
