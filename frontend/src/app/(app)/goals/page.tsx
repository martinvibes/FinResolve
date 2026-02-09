"use client";

import { useState } from "react";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { Plus, Trophy } from "lucide-react";
import { AddGoalModal } from "@/components/modals/AddGoalModal";
import { useFinancial } from "@/contexts/FinancialContext";

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addGoal, profile } = useFinancial();

  const handleAddGoal = (data: {
    title: string;
    targetAmount: string;
    deadline: string;
    color: string;
  }) => {
    addGoal({
      id: crypto.randomUUID(),
      name: data.title,
      target: parseFloat(data.targetAmount),
      current: 0,
      deadline: data.deadline,
      priority: "medium",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Financial Goals</h1>
          <p className="text-gray-500 mt-1">
            Track your dreams and big purchases.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Goal
        </button>
      </div>

      <AddGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddGoal}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profile.goals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No goals yet. Create your first goal to start tracking!</p>
          </div>
        ) : (
          profile.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} color="bg-blue-500" />
          ))
        )}
      </div>

      {/* Completed/Gamification Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Achievements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
              🚀
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                Started Journey
              </h4>
              <p className="text-xs text-gray-500">Created account</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
              🌟
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                First Million
              </h4>
              <p className="text-xs text-gray-500">Save ₦1,000,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
