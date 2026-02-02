"use client";

import { useState } from "react";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ArrowDown, ArrowUp, Zap, Plus } from "lucide-react";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import { useFinancial } from "@/contexts/FinancialContext";
import type { SpendingCategory } from "@/lib/types";

export default function AnalysisPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addSpending } = useFinancial();

  const handleAddTransaction = (data: { amount: string; category: string; description: string }) => {
    addSpending({
      id: crypto.randomUUID(),
      category: data.category.toLowerCase() as SpendingCategory,
      amount: parseFloat(data.amount),
      confidence: "high",
      source: "manual",
      description: data.description || undefined,
      date: new Date().toISOString(),
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Financial Analysis
          </h1>
          <p className="text-gray-500 mt-1">
            Deep dive into your spending habits.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
          <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTransaction}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Spent</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800">₦230,000</h3>
            <span className="flex items-center text-rose-500 text-sm font-medium bg-rose-50 px-2 py-1 rounded-lg">
              <ArrowUp className="w-3 h-3 mr-1" />
              12%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Money Saved</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800">₦50,000</h3>
            <span className="flex items-center text-emerald-500 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUp className="w-3 h-3 mr-1" />
              5%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">
            Upcoming Bills
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800">₦12,500</h3>
            <span className="flex items-center text-gray-500 text-sm font-medium">
              Due within 7 days
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[400px]">
          <TrendChart />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 h-[400px]">
          <SpendingChart />
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-2 rounded-full">
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
            <h3 className="text-xl font-bold">Smart Insight</h3>
          </div>
          <p className="text-indigo-100 max-w-2xl text-lg leading-relaxed">
            You've spent more on <strong>Food</strong> this week than usual.
            Consider cooking at home this weekend to stay on track with your
            <strong> MacBook Goal</strong>. You can save approximately
            <strong> ₦15,000</strong> by doing so!
          </p>
          <button className="mt-6 bg-white text-indigo-900 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
            View Detailed Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
