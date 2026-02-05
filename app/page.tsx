"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthProfile } from "@/lib/auth/token";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const { role } = getAuthProfile();
    const nextPath = role === "sales_report" ? "/sales-reports" : "/dashboard";
    router.replace(nextPath);
  }, [router]);

  return null;
}
