import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "BCOS Platform — Business Context Operating System",
  description:
    "Knowledge Management & Context Serving Platform for AI Agents and Humans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <main className="flex-1 ml-64 min-h-screen">
            <div className="p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
