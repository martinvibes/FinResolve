"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";
import { type SavingsGoal, type Account, type CurrencyCode } from "@/lib/types";

interface SaveToGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal;
}

export function SaveToGoalModal({
  isOpen,
  onClose,
  goal,
}: SaveToGoalModalProps) {
  const { profile, updateGoal, addSpending } = useFinancial();
  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(
    profile.accounts.find((a) => a.isPrimary)?.id ||
      profile.accounts[0]?.id ||
      "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const currency = profile.currency;

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (numAmount > 0 && selectedAccountId) {
      setIsSaving(true);

      // 1. Log the 'expense' (transfer to savings)
      addSpending({
        id: crypto.randomUUID(),
        category: "savings",
        amount: numAmount,
        confidence: "high",
        source: "manual",
        description: `Saved for ${goal.name}`,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        accountId: selectedAccountId,
        type: "expense",
      });

      // 2. Update Goal progress
      updateGoal(goal.id, {
        current: goal.current + numAmount,
      });

      await new Promise((r) => setTimeout(r, 800)); // Give user a moment to feel the success
      setIsSaving(false);
      setAmount("");
      onClose();
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Save for ${goal.name}`}>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Deduct from
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-4 py-2.5 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm"
          >
            {profile.accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatCurrency(acc.balance, currency)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Amount to Save
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              $
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
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-slate-800 border border-double border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-2">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => setAmount(quickAmount.toLocaleString())}
              className="flex-1 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              +{formatCurrency(quickAmount, currency, true)}
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!amount || !selectedAccountId || isSaving}
            className={cn(
              "flex-1 py-3 text-sm font-bold text-white rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20",
              amount && selectedAccountId && !isSaving
                ? "bg-primary hover:bg-primary/95"
                : "bg-slate-300 cursor-not-allowed",
            )}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
