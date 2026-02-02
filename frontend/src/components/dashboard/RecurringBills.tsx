"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";
import type { RecurringItem, SpendingCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export function RecurringBills() {
  const { profile, addRecurringItem, deleteRecurringItem } = useFinancial();
  const [showAddForm, setShowAddForm] = useState(false);

  const items = profile.recurringItems || [];

  // Sort by date (mock logic for now if no date)
  const sortedItems = [...items].sort((a, b) => {
    // Just sort by amount for now as improved sorting needs date parsing logic
    return b.amount - a.amount;
  });

  const totalMonthly = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 rounded-lg">
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            Subscriptions
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {sortedItems.map((item) => (
          <BillCard key={item.id} item={item} onDelete={deleteRecurringItem} />
        ))}

        {sortedItems.length === 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[120px]">
            <span className="text-sm">No recurring bills tracked.</span>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs text-purple-500 hover:underline"
            >
              Track Netflix, Rent, etc.
            </button>
          </div>
        )}

        {sortedItems.length > 0 && (
          <div className="p-3 bg-purple-50 rounded-xl flex justify-between items-center text-sm">
            <span className="font-medium text-purple-700">Total Monthly</span>
            <span className="font-bold text-purple-900">
              {formatCurrency(totalMonthly)}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <AddRecurringModal
            onClose={() => setShowAddForm(false)}
            onAdd={addRecurringItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BillCard({
  item,
  onDelete,
}: {
  item: RecurringItem;
  onDelete: (id: string) => void;
}) {
  const categoryMeta = CATEGORY_META[item.category] || CATEGORY_META.other;

  return (
    <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg">
          {categoryMeta.emoji}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{item.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="capitalize">{item.frequency}</span>
            {item.nextDueDate && (
              <span className="flex items-center gap-1 text-slate-400">
                &bull; Due {new Date(item.nextDueDate).getDate()}th
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-900">
          {formatCurrency(item.amount)}
        </span>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

function AddRecurringModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (r: RecurringItem) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<SpendingCategory>("entertainment");
  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "yearly">(
    "monthly",
  );
  const [date, setDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    onAdd({
      id: crypto.randomUUID(),
      name,
      amount: Number(amount.replace(/[^0-9.-]+/g, "")),
      category,
      frequency,
      nextDueDate: date || undefined,
      isActive: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Track Subscription
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Netflix"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">
                    ₦
                  </span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9.]/g, "");
                      if (rawValue) {
                        const numberValue = parseFloat(rawValue);
                        if (!isNaN(numberValue)) {
                          setAmount(numberValue.toLocaleString());
                        } else {
                          setAmount(rawValue);
                        }
                      } else {
                        setAmount("");
                      }
                    }}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as SpendingCategory)
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none"
              >
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.emoji} {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-lg shadow-purple-900/10"
              >
                Add Bill
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
