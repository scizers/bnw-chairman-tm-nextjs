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

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const { role } = getAuthProfile();
  const isSalesReport = role === "sales_report";
  const isAllowedSalesReportPath = pathname.startsWith("/sales-reports");
  const shouldRedirect = isSalesReport && !isAllowedSalesReportPath && !isAuthRoute;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/sales-reports");
    }
  }, [router, shouldRedirect]);

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
