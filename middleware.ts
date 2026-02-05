import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as { role?: string } | null;
  } catch {
    return null;
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (!token && !isPublic && !isAsset) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    const role = decodeJwtPayload(token)?.role;
    if (
      role === "sales_report" &&
      !isPublic &&
      !isAsset &&
      !pathname.startsWith("/sales-reports")
    ) {
      const salesReportUrl = request.nextUrl.clone();
      salesReportUrl.pathname = "/sales-reports";
      return NextResponse.redirect(salesReportUrl);
    }

    if (pathname === "/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === "sales_report" ? "/sales-reports" : "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
