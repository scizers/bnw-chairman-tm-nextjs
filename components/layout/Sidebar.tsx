"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  ClipboardList,
  Building2,
  BarChart3,
  UserRound,
  History,
  Clock,
  type LucideIcon
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import logo from "@/public/bnw-logo.png";
import { getAuthProfile } from "@/lib/auth/token";

type NavChild = {
  href: string;
  label: string;
};

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroupItem = {
  label: string;
  icon: LucideIcon;
  children: NavChild[];
};

type NavItem = NavLinkItem | NavGroupItem;

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Tasks",
    icon: ListTodo,
    children: [
      { href: "/tasks", label: "All Tasks" },
      { href: "/tasks/archive", label: "Archive Tasks" }
    ]
  },
  { href: "/moms", label: "MOM", icon: ClipboardList },
  {
    label: "Sales Reports",
    icon: BarChart3,
    children: [
      { href: "/sales-reports", label: "All Sales Reports" },
      { href: "/sales-reports/monthly", label: "Monthly View" },
      { href: "/sales-reports/weekly", label: "Weekly View" }
    ]
  },
  { href: "/users", label: "Users", icon: UserRound },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/audit-logs", label: "Audit Logs", icon: History },
  { href: "/team", label: "Team", icon: Users },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings }
];

const isNavLink = (item: NavItem): item is NavLinkItem => "href" in item;

export default function Sidebar() {
  const pathname = usePathname();
  const [authProfile, setAuthProfile] = useState<{
    role?: string;
    canAddUsers?: boolean;
  }>({});

  useEffect(() => {
    setAuthProfile(getAuthProfile());
  }, []);

  const { role, canAddUsers } = authProfile;

  const visibleNavItems = useMemo(() => {
    if (role === "sales_report") {
      return navItems.filter(
        (item): item is NavGroupItem =>
          !isNavLink(item) && item.label === "Sales Reports"
      );
    }
    if (canAddUsers === false) {
      return navItems.filter(
        (item) =>
          !isNavLink(item) ||
          (item.href !== "/users" && item.href !== "/audit-logs" && item.href !== "/timeline")
      );
    }
    return navItems;
  }, [role, canAddUsers]);

  const homeHref = role === "sales_report" ? "/sales-reports" : "/dashboard";

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 flex-shrink-0 bg-surface-card border-r border-border-subtle px-6 py-8">
      <Link href={homeHref} className="mb-6 block hover:opacity-90">
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
          const Icon = item.icon;
          if (!isNavLink(item)) {
            const isChildActive = (href: string) => {
              if (pathname === href) return true;
              if (href === "/tasks") {
                return (
                  pathname.startsWith("/tasks/") &&
                  !pathname.startsWith("/tasks/my") &&
                  !pathname.startsWith("/tasks/archive")
                );
              }
              if (href === "/sales-reports") {
                return (
                  pathname === "/sales-reports" ||
                  (pathname.startsWith("/sales-reports/") &&
                    !pathname.startsWith("/sales-reports/calendar") &&
                    !pathname.startsWith("/sales-reports/monthly") &&
                    !pathname.startsWith("/sales-reports/weekly"))
                );
              }
              if (href === "/sales-reports/monthly") {
                return (
                  pathname === "/sales-reports/monthly" ||
                  pathname.startsWith("/sales-reports/monthly/") ||
                  pathname === "/sales-reports/calendar" ||
                  pathname.startsWith("/sales-reports/calendar/")
                );
              }
              if (href === "/sales-reports/weekly") {
                return (
                  pathname === "/sales-reports/weekly" ||
                  pathname.startsWith("/sales-reports/weekly/")
                );
              }
              return pathname.startsWith(`${href}/`);
            };
            const childActive = item.children.some((child) => isChildActive(child.href));
            return (
              <div key={item.label} className="space-y-2">
                <div
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                    childActive
                      ? "bg-brand-primary/15 text-brand-primary shadow-soft"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                <div className="ml-9 flex flex-col gap-2">
                  {item.children.map((child) => {
                    const active = isChildActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          "rounded-lg px-3 py-2 text-xs transition",
                          active
                            ? "bg-brand-primary/20 text-brand-primary"
                            : "text-text-muted hover:text-text-primary hover:bg-white/5"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
