import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "antd/dist/reset.css";
import "./globals.css";
import AntdProvider from "@/components/providers/AntdProvider";
import AppShell from "@/components/layout/AppShell";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"]
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Chairman Office | Task Management",
  description: "Executive back office task management system"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">
        <AntdProvider>
          <AppShell>{children}</AppShell>
        </AntdProvider>
      </body>
    </html>
  );
}
