"use client";

import { Bell, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancial } from "@/contexts/FinancialContext";
import Link from "next/link";

interface DashboardHeaderProps {
  aiNudge?: string;
}

export function DashboardHeader({ aiNudge }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { profile } = useFinancial();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = profile.name || user?.email?.split("@")[0] || "there";

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-slate-800">
          {getGreeting()}, {displayName}
        </h1>
        {aiNudge && (
          <p className="text-sm text-slate-500 mt-0.5">{aiNudge}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <Link
          href="/settings"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>
        <div className="ml-2 w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
      </div>
    </header>
  );
}
