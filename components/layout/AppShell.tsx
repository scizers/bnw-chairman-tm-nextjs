"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { getAuthProfile } from "@/lib/auth/token";

interface AppShellProps {
  children: React.ReactNode;
}

const AUTH_ROUTES = new Set(["/login", "/forgot-password", "/reset-password"]);
const TITLE_SUFFIX = " · Chairman Office";
const EXACT_TITLES: Record<string, string> = {
  "/": "Chairman Office",
  "/dashboard": "Dashboard",
  "/sales-reports": "Daily Sales Reports",
  "/sales-reports/new": "New Daily Sales Report",
  "/sales-reports/monthly": "Sales Reports Monthly View",
  "/sales-reports/weekly": "Sales Reports Weekly View",
  "/sales-reports/calendar": "Sales Reports Monthly View",
  "/tasks": "Tasks",
  "/tasks/new": "New Task",
  "/tasks/my": "My Tasks",
  "/tasks/archive": "Archived Tasks",
  "/departments": "Departments",
  "/reports": "Reports",
  "/team": "Team",
  "/team/new": "New Team Member",
  "/users": "Users",
  "/audit-logs": "Audit Logs",
  "/timeline": "Timeline",
  "/settings": "Settings",
  "/moms": "MOMs",
  "/moms/new": "New MOM",
  "/login": "Login",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password"
};
const TITLE_PATTERNS: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/sales-reports\/[^/]+\/edit$/, title: "Edit Daily Sales Report" },
  { pattern: /^\/sales-reports\/[^/]+$/, title: "Daily Sales Report" },
  { pattern: /^\/tasks\/[^/]+\/edit$/, title: "Edit Task" },
  { pattern: /^\/tasks\/[^/]+$/, title: "Task Details" },
  { pattern: /^\/moms\/[^/]+\/edit$/, title: "Edit MOM" },
  { pattern: /^\/moms\/[^/]+$/, title: "MOM Details" },
  { pattern: /^\/team\/[^/]+\/edit$/, title: "Edit Team Member" },
  { pattern: /^\/team\/[^/]+$/, title: "Team Member" },
  { pattern: /^\/departments\/[^/]+$/, title: "Department" }
];

const resolvePageTitle = (pathname: string | null) => {
  if (!pathname) return "Chairman Office";
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const exact = EXACT_TITLES[normalized];
  if (exact) return exact;
  const match = TITLE_PATTERNS.find((entry) => entry.pattern.test(normalized));
  return match?.title ?? "Chairman Office";
};

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const { role, canAddUsers } = getAuthProfile();
  const isSalesReport = role === "sales_report";
  const isAllowedSalesReportPath = pathname.startsWith("/sales-reports");
  const isUsersPath = pathname.startsWith("/users");
  const isAuditLogsPath = pathname.startsWith("/audit-logs");
  const isTimelinePath = pathname.startsWith("/timeline");
  const shouldRedirectSalesReport =
    isSalesReport && !isAllowedSalesReportPath && !isAuthRoute;
  const shouldRedirectUsers =
    !isSalesReport &&
    !canAddUsers &&
    (isUsersPath || isAuditLogsPath || isTimelinePath) &&
    !isAuthRoute;
  const shouldRedirect = shouldRedirectSalesReport || shouldRedirectUsers;

  useEffect(() => {
    if (shouldRedirect) {
      const destination = shouldRedirectUsers ? "/dashboard" : "/sales-reports";
      router.replace(destination);
    }
  }, [router, shouldRedirect, shouldRedirectUsers]);

  useEffect(() => {
    const pageTitle = resolvePageTitle(pathname);
    document.title =
      pageTitle === "Chairman Office" ? pageTitle : `${pageTitle}${TITLE_SUFFIX}`;
  }, [pathname]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (shouldRedirect) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-surface-base">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}
