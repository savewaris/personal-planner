import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Planner — Personal Productivity Suite",
  description:
    "Centralize your life into distinct workspace contexts, manage tasks with Dual-View Kanban & List, and build daily habits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full text-zinc-100 font-sans transition-colors duration-200" style={{ backgroundColor: "var(--background)" }}>
        <Providers>
          <div className="flex min-h-screen w-full text-zinc-100 bg-grid relative" style={{ backgroundColor: "var(--background)" }}>
            {/* Background Ambient Glow Blobs */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 relative z-10">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
