"use client";

import "antd/dist/reset.css";
import "./globals.css";
import AntdProvider from "@/components/providers/AntdProvider";
import AppShell from "@/components/layout/AppShell";
import type { ReactNode } from "react";

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AntdProvider>
          <AppShell>{children}</AppShell>
        </AntdProvider>
      </body>
    </html>
  );
}
