"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Plus } from "lucide-react";

interface GoalFormData {
  title: string;
  targetAmount: string;
  deadline: string;
  color: string;
}

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: GoalFormData) => void;
}

export function AddGoalModal({ isOpen, onClose, onAdd }: AddGoalModalProps) {
  const [data, setData] = useState<GoalFormData>({
    title: "",
    targetAmount: "",
    deadline: "",
    color: "bg-blue-500",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(data);
    onClose();
    setData({
      title: "",
      targetAmount: "",
      deadline: "",
      color: "bg-blue-500",
    }); // Reset
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Financial Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Title
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="e.g. New Car"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount ($)
            </label>
            <input
              type="number"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="e.g. 5000"
              value={data.targetAmount}
              onChange={(e) =>
                setData({ ...data, targetAmount: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="month"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={data.deadline}
              onChange={(e) => setData({ ...data, deadline: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Goal Color
          </label>
          <div className="flex gap-2">
            {[
              "bg-blue-500",
              "bg-emerald-500",
              "bg-purple-500",
              "bg-orange-500",
              "bg-rose-500",
            ].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setData({ ...data, color })}
                className={`w-8 h-8 rounded-full ${color} ${data.color === color ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                aria-label="Select color"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 mt-4"
        >
          <Plus className="w-5 h-5" />
          Create Goal
        </button>
      </form>
    </Modal>
  );
}
