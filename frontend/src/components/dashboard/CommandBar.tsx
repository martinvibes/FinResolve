"use client";

import { useState } from "react";
import { Search, Plus, TrendingUp, PiggyBank, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onSearch: (query: string) => void;
  onAddExpense: () => void;
  onAnalyze: () => void;
  onSaveNow: () => void;
  onUpload: () => void;
}

export function CommandBar({
  onSearch,
  onAddExpense,
  onAnalyze,
  onSaveNow,
  onUpload,
}: CommandBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery("");
    }
  };

  const quickActions = [
    {
      label: "+Expense",
      icon: Plus,
      onClick: onAddExpense,
      color: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    },
    {
      label: "Analyze",
      icon: TrendingUp,
      onClick: onAnalyze,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      label: "Save Now",
      icon: PiggyBank,
      onClick: onSaveNow,
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    {
      label: "Upload",
      icon: Upload,
      onClick: onUpload,
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
  ];

  return (
    <div className="px-6 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSubmit} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything or search..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                action.color
              )}
            >
              <action.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
