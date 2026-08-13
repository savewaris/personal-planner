import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers, SidebarNav, Navbar } from "@/components/layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Planner — Quick To-Do App",
  description: "Ultra-fast personal to-do list with chat-style task creation.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Planner",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} light h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full text-slate-900 font-sans transition-colors duration-200" style={{ backgroundColor: "var(--background)" }}>
        <Providers>
          <div className="flex min-h-screen w-full text-slate-900 bg-grid relative" style={{ backgroundColor: "var(--background)" }}>
            {/* Left Sidebar Navigation */}
            <SidebarNav />

            {/* Background Ambient Glow Blobs */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Main Content Area — Full Screen */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 pb-16 md:pb-0">
              <Navbar />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
