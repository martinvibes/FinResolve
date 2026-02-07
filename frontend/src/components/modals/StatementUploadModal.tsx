"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Check,
  AlertCircle,
  ChevronRight,
  Wallet,
  Building2,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { parseCSV, calculateTransactionSummary } from "@/lib/parseStatement";
import { parsePDFStatement } from "@/actions/parse-pdf";
import {
  type UploadedTransaction,
  type SpendingCategory,
  type SpendingEntry,
  CATEGORY_META,
} from "@/lib/types";
import { formatCurrency } from "@/lib/parseInput";
import { useFinancial } from "@/contexts/FinancialContext";
import { categorizeTransactionsAI } from "@/actions/ai-categorize";
import { toast } from "sonner";

interface StatementUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (transactions: UploadedTransaction[]) => void;
}

type UploadStep =
  | "account-select"
  | "upload"
  | "processing"
  | "ai-analyzing"
  | "preview"
  | "error";

export function StatementUploadModal({
  isOpen,
  onClose,
  onComplete, // Kept for prop compatibility, but we might use context directly
}: StatementUploadModalProps) {
  const { profile, addTransactions } = useFinancial();
  const currency = profile.currency;
  const accounts = profile.accounts;

  const [step, setStep] = useState<UploadStep>("account-select");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [transactions, setTransactions] = useState<UploadedTransaction[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select if only one account exists (UX Enhancement)
  useEffect(() => {
    if (isOpen && step === "account-select" && accounts.length === 1) {
      setSelectedAccountId(accounts[0].id);
      setStep("upload");
    }
  }, [isOpen, step, accounts]);

  // Summary derived from current transactions state
  const summary = useMemo(
    () => calculateTransactionSummary(transactions),
    [transactions],
  );

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
    setStep("upload");
  };

  const handleFile = useCallback(
    async (file: File) => {
      // 1. Basic Validation
      const validTypes = [
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "application/pdf",
      ];
      const isCSV = file.type.includes("csv") || file.name.endsWith(".csv");
      const isPDF = file.type.includes("pdf") || file.name.endsWith(".pdf");

      if (!isCSV && !isPDF) {
        const msg = "Please upload a CSV or PDF file.";
        setError(msg);
        toast.error(msg);
        setStep("error");
        return;
      }

      setStep("processing");
      setError(null);
      toast.info("Reading file...", { duration: 2000 });

      try {
        let parsed: UploadedTransaction[] = [];

        if (isPDF) {
          // Process PDF via Server Action
          const formData = new FormData();
          formData.append("file", file);
          const result = await parsePDFStatement(formData);
          if (!result.success) {
            throw new Error(result.error || "Failed to parse PDF");
          }
          parsed = result.transactions || [];
        } else {
          // Process CSV locally
          parsed = await parseCSV(file);
        }

        if (parsed.length === 0)
          throw new Error("No transactions found in file");

        setStep("ai-analyzing");
        toast.info(`Analyzing ${parsed.length} transactions with AI...`);

        // 3. AI Categorization (runs for both CSV and PDF results)
        const aiResults = await categorizeTransactionsAI(
          parsed.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
          })),
        );

        // 4. Merge AI results & Check Duplicates
        const existingTransactions = profile.monthlySpending;
        const enhancedTransactions = parsed.map((t) => {
          const aiMatch = aiResults.find((r) => r.id === t.id);

          // Check for duplicates
          const isDuplicate = existingTransactions.some((existing) => {
            if (existing.amount !== t.amount) return false;
            if (existing.date?.split("T")[0] !== t.date) return false;
            const d1 = existing.description?.toLowerCase() || "";
            const d2 = t.description.toLowerCase();
            return d1.includes(d2) || d2.includes(d1);
          });

          return {
            ...t,
            merchantName: aiMatch?.merchantName,
            suggestedCategory: aiMatch?.category || "other",
            confidence: aiMatch?.confidence || "low",
            isDuplicate,
            confirmed: !isDuplicate, // Uncheck if duplicate
          };
        });

        setTransactions(enhancedTransactions);
        setStep("preview");
        toast.success("Analysis complete! Review your transactions.");
      } catch (err) {
        console.error(err);
        const msg =
          err instanceof Error ? err.message : "Failed to process file";
        setError(msg);
        toast.error(msg);
        setStep("error");
      }
    },
    [profile.monthlySpending],
  );

  const handleConfirm = () => {
    if (!selectedAccountId) {
      toast.error("No account selected");
      return;
    }

    const finalEntries: SpendingEntry[] = transactions
      .filter((t) => t.confirmed !== false) // Default true if undefined
      .map((t) => ({
        id: crypto.randomUUID(), // New ID for system
        accountId: selectedAccountId,
        // accountId: selectedAccountId,
        category: t.suggestedCategory || "other",
        amount: t.amount,
        type: t.type === "credit" ? "income" : "expense",
        date: t.date,
        description: t.merchantName || t.description, // Use AI Merchant Name if available
        confidence: "high", // Confirmed by user
        source: "upload",
      }));

    addTransactions(finalEntries);
    onComplete(transactions); // Notify parent if needed
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep("account-select");
    setTransactions([]);
    setError(null);
    setSelectedAccountId("");
    onClose();
  };

  const updateCategory = (id: string, category: SpendingCategory) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, suggestedCategory: category } : t,
      ),
    );
  };

  const toggleTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, confirmed: !t.confirmed } : t)),
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Import Transactions"
      className="max-w-4xl max-h-[90vh]"
    >
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {step === "account-select" && (
            <motion.div
              key="account-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Where should these go?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Select the account that matches this statement.
              </p>

              <div className="grid gap-3">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleAccountSelect(acc.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      {acc.type === "cash" ? (
                        <Wallet className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{acc.name}</p>
                      <p className="text-xs text-slate-500">
                        Balance: {formatCurrency(acc.balance, currency)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                  className="hidden"
                />
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Upload Statement (CSV or PDF)
                </p>
                <p className="text-xs text-slate-500">
                  Drag & drop or click to browse
                </p>
              </div>
              <button
                onClick={() => setStep("account-select")}
                className="mt-6 text-sm text-slate-500 hover:text-slate-800"
              >
                ← Back to Account Selection
              </button>
            </motion.div>
          )}

          {(step === "processing" || step === "ai-analyzing") && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <div className="relative w-16 h-16 mx-auto mb-6">
                {/* Double spinner effect */}
                <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin-slow"></div>
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-yellow-500 animate-pulse" />
              </div>

              <h3 className="text-lg font-medium text-slate-800 mb-2">
                {step === "processing"
                  ? "Reading File..."
                  : "AI Analysis in Progress"}
              </h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                {step === "processing"
                  ? "We are parsing your statement data."
                  : "FinResolve AI is cleaning merchant names and categorizing transactions..."}
              </p>
            </motion.div>
          )}

          {step === "preview" && summary && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Income
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    +{formatCurrency(summary.totalCredits, currency)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Spent
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    -{formatCurrency(summary.totalDebits, currency)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Net</p>
                  <p
                    className={`text-lg font-bold ${summary.netAmount >= 0 ? "text-slate-800" : "text-slate-800"}`}
                  >
                    {summary.netAmount >= 0 ? "+" : ""}
                    {formatCurrency(summary.netAmount, currency)}
                  </p>
                </div>
              </div>

              {/* Action Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    Transactions Found
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    {transactions.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const allSelected = transactions.every(
                      (t) => t.confirmed !== false,
                    );
                    setTransactions((prev) =>
                      prev.map((t) => ({ ...t, confirmed: !allSelected })),
                    );
                  }}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {transactions.every((t) => t.confirmed !== false)
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl mb-6 shadow-sm bg-white scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 min-h-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-4 w-10">
                        <div className="sr-only">Selection</div>
                      </th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Merchant</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...transactions]
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => toggleTransaction(t.id)}
                          className={`group hover:bg-slate-50/80 transition-all cursor-pointer ${
                            t.confirmed === false
                              ? "opacity-40 grayscale bg-slate-50"
                              : ""
                          }`}
                        >
                          <td className="p-4">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                t.confirmed !== false
                                  ? "bg-primary border-primary text-white"
                                  : "border-slate-300 bg-white group-hover:border-primary/50"
                              }`}
                            >
                              {t.confirmed !== false && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                            {new Date(t.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Merchant Avatar */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  t.type === "credit"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {(t.merchantName || t.description)
                                  .substring(0, 1)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 flex items-center gap-2 truncate">
                                  <span className="truncate">
                                    {t.merchantName || t.description}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {t.merchantName &&
                                    t.merchantName !== t.description && (
                                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                        {t.description}
                                      </span>
                                    )}
                                  {t.isDuplicate && (
                                    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 rounded-full font-medium">
                                      Duplicate
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className="p-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative group/select">
                              <select
                                value={t.suggestedCategory || "other"}
                                onChange={(e) =>
                                  updateCategory(
                                    t.id,
                                    e.target.value as SpendingCategory,
                                  )
                                }
                                className="appearance-none bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700 border-none rounded-lg py-1.5 pl-3 pr-8 w-full cursor-pointer focus:ring-2 focus:ring-primary/20"
                              >
                                {Object.entries(CATEGORY_META).map(
                                  ([key, meta]) => (
                                    <option key={key} value={key}>
                                      {meta.emoji} {meta.label}
                                    </option>
                                  ),
                                )}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight className="w-3 h-3 rotate-90" />
                              </div>
                            </div>
                          </td>
                          <td
                            className={`p-4 text-right font-bold tabular-nums ${
                              t.type === "credit"
                                ? "text-green-600"
                                : "text-slate-900"
                            }`}
                          >
                            {t.type === "credit" ? "+" : ""}
                            {formatCurrency(t.amount, currency)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={resetAndClose}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Check className="w-5 h-5" />
                  Confirm (
                  {String(
                    transactions.filter((t) => t.confirmed !== false).length,
                  )}
                  )
                </button>
              </div>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Import Failed
              </h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
                {error}
              </p>
              <button
                onClick={() => setStep("upload")}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
