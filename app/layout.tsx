import "antd/dist/reset.css";
import "./globals.css";
import AntdProvider from "@/components/providers/AntdProvider";
import AppShell from "@/components/layout/AppShell";
import type { ReactNode } from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: {
    default: "Chairman Office",
    template: "%s · Chairman Office"
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/bnw-logo.png" />
      </head>
      <body className="antialiased">
        <AntdProvider>
          <AppShell>{children}</AppShell>
        </AntdProvider>
      </body>
    </html>
  );
}
