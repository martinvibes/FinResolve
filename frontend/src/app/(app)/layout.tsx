"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useFinancial } from "@/contexts/FinancialContext";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoading, profile } = useFinancial();

  // If loading the initial profile, show a full-screen loader
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Initializing your space...</p>
        </div>
      </div>
    );
  }

  // If not loading, we render the children.
  // If they haven't completed onboarding, the child (Dashboard) will handle the redirect.
  // We hide the Sidebar here to prevent it from flashing during that redirect.
  const showSidebar = profile.hasCompletedOnboarding;

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <main
        className={cn(
          "flex-1 transition-all duration-300 relative",
          showSidebar ? "md:ml-64" : "md:ml-0",
        )}
      >
        {children}
      </main>
    </div>
  );
}
