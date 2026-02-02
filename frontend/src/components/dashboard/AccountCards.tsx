"use client";

import { useState } from "react";
import {
  Plus,
  Wallet,
  Landmark,
  Banknote,
  Bitcoin,
  CreditCard,
} from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { formatCurrency } from "@/lib/parseInput";
import { cn } from "@/lib/utils";
import type { Account, AccountType } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export function AccountCards() {
  const { profile, addAccount, deleteAccount } = useFinancial();
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter accounts if necessary or show all
  const accounts = profile.accounts || [];

  // Calculate Net Worth
  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Accounts</h2>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={accounts.length >= 3}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-full transition-colors",
            accounts.length >= 3
              ? "text-slate-500 bg-slate-800/50 border-slate-700 cursor-not-allowed"
              : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
          )}
        >
          {accounts.length >= 3 ? (
            <span>Max 3 Accounts</span>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Add Account
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth Card */}
        <div className="p-5 rounded-2xl bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-24 h-24 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Net Worth</p>
          <p className="text-3xl font-bold text-white tracking-tight">
            {formatCurrency(netWorth)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 w-fit px-2 py-1 rounded-md border border-indigo-500/20">
            <span>Across {accounts.length} accounts</span>
          </div>
        </div>

        {/* Individual Account Cards */}
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onDelete={deleteAccount}
          />
        ))}

        {/* Empty State / Add Placeholders if few accounts */}
        {accounts.length === 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="p-5 rounded-2xl bg-slate-800/50 border border-dashed border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-all flex flex-col items-center justify-center text-slate-500 gap-2 h-full min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Add your first account</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <AddAccountModal
            onClose={() => setShowAddForm(false)}
            onAdd={addAccount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountCard({
  account,
  onDelete,
}: {
  account: Account;
  onDelete: (id: string) => void;
}) {
  const getIcon = (type: AccountType) => {
    switch (type) {
      case "bank":
        return <Landmark className="w-5 h-5 text-blue-400" />;
      case "mobile_money":
        return <CreditCard className="w-5 h-5 text-orange-400" />;
      case "cash":
        return <Banknote className="w-5 h-5 text-emerald-400" />;
      case "crypto":
        return <Bitcoin className="w-5 h-5 text-purple-400" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLabel = (type: string) => {
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-colors relative group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(account.id);
          }}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <span className="sr-only">Delete</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-slate-700/50 border border-slate-700">
          {getIcon(account.type)}
        </div>
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider border border-slate-700 px-1.5 py-0.5 rounded">
          {account.currency}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-300 truncate pr-6">
          {account.name}
        </h3>
        <p className="text-lg font-bold text-white mt-0.5">
          {formatCurrency(account.balance)}
        </p>
        <p className="text-xs text-slate-500 mt-1">{getLabel(account.type)}</p>
      </div>
    </div>
  );
}

function AddAccountModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (acc: Account) => void;
}) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType] = useState<AccountType>("bank");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    onAdd({
      id: crypto.randomUUID(),
      name,
      balance: Number(balance.replace(/[^0-9.-]+/g, "")),
      type,
      currency: "NGN",
      isPrimary: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Add New Account
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Account Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GTBank Savings"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-slate-600 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Current Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-sm">
                  ₦
                </span>
                <input
                  type="text"
                  value={balance}
                  onChange={(e) => {
                    // Remove existing non-numeric characters (except decimals if needed, but usually integers for simplicity or handle decimals carefully)
                    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
                    // Format with commas
                    if (rawValue) {
                      const numberValue = parseFloat(rawValue);
                      if (!isNaN(numberValue)) {
                        setBalance(numberValue.toLocaleString());
                      } else {
                        setBalance(rawValue);
                      }
                    } else {
                      setBalance("");
                    }
                  }}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Account Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none"
              >
                <option value="bank">Bank Account</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cash">Cash</option>
                <option value="crypto">Crypto Wallet</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
