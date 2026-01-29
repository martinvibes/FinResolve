"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, AlertCircle, Shield, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { parseCSV, calculateTransactionSummary } from "@/lib/parseStatement";
import {
  type UploadedTransaction,
  type SpendingCategory,
  CATEGORY_META,
} from "@/lib/types";
import { formatCurrency } from "@/lib/parseInput";

interface StatementUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (transactions: UploadedTransaction[]) => void;
}

type UploadStep = "upload" | "processing" | "preview" | "error";

export function StatementUploadModal({
  isOpen,
  onClose,
  onComplete,
}: StatementUploadModalProps) {
  const [step, setStep] = useState<UploadStep>("upload");
  const [transactions, setTransactions] = useState<UploadedTransaction[]>([]);
  const [summary, setSummary] = useState<ReturnType<
    typeof calculateTransactionSummary
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const validTypes = [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
    ];
    const isCSV = validTypes.includes(file.type) || file.name.endsWith(".csv");

    if (!isCSV && !file.name.endsWith(".pdf")) {
      setError("Please upload a CSV or PDF file");
      setStep("error");
      return;
    }

    if (file.name.endsWith(".pdf")) {
      setError(
        "PDF parsing is not yet available. Please export your statement as CSV from your bank's website.",
      );
      setStep("error");
      return;
    }

    setStep("processing");
    setError(null);

    try {
      const parsed = await parseCSV(file);

      if (parsed.length === 0) {
        throw new Error("No transactions found in the file");
      }

      setTransactions(parsed);
      setSummary(calculateTransactionSummary(parsed));
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setStep("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleConfirm = () => {
    onComplete(transactions.filter((t) => t.confirmed || true)); // Include all for now
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep("upload");
    setTransactions([]);
    setSummary(null);
    setError(null);
    onClose();
  };

  const updateCategory = (id: string, category: SpendingCategory) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, suggestedCategory: category } : t,
      ),
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Upload Bank Statement"
    >
      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Privacy Message */}
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl mb-6 border border-green-100">
                <Shield className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Your data stays private
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Files are processed locally in your browser. We never store
                    or transmit your bank statement.
                  </p>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
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
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Drag & drop your bank statement
                </p>
                <p className="text-xs text-slate-500">
                  or click to browse • CSV files supported
                </p>
              </div>

              {/* Skip Option */}
              <p className="text-center text-sm text-slate-500 mt-6">
                This is optional.{" "}
                <button
                  onClick={resetAndClose}
                  className="font-medium text-primary hover:underline"
                >
                  Skip for now
                </button>
              </p>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-slate-700 font-medium">
                Analyzing your transactions...
              </p>
              <p className="text-sm text-slate-500 mt-1">
                This happens locally in your browser
              </p>
            </motion.div>
          )}

          {step === "preview" && summary && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Here&apos;s what we found:
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {summary.transactionCount}
                    </p>
                    <p className="text-xs text-slate-500">Transactions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary.totalDebits)}
                    </p>
                    <p className="text-xs text-slate-500">Spent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalCredits)}
                    </p>
                    <p className="text-xs text-slate-500">Received</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  {summary.dateRange.start} to {summary.dateRange.end}
                </p>
              </div>

              {/* Transaction Preview */}
              <div className="max-h-64 overflow-y-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-slate-600 font-medium">
                        Description
                      </th>
                      <th className="text-left p-3 text-slate-600 font-medium">
                        Category
                      </th>
                      <th className="text-right p-3 text-slate-600 font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="p-3 truncate max-w-50">
                          {t.description}
                        </td>
                        <td className="p-3">
                          <select
                            value={t.suggestedCategory || "other"}
                            onChange={(e) =>
                              updateCategory(
                                t.id,
                                e.target.value as SpendingCategory,
                              )
                            }
                            className="text-xs bg-transparent border border-gray-200 rounded-lg px-2 py-1"
                          >
                            {Object.entries(CATEGORY_META).map(
                              ([key, meta]) => (
                                <option key={key} value={key}>
                                  {meta.emoji} {meta.label}
                                </option>
                              ),
                            )}
                          </select>
                        </td>
                        <td
                          className={`p-3 text-right font-medium ${
                            t.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {t.type === "credit" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length > 10 && (
                  <p className="text-center text-xs text-slate-500 py-2 bg-slate-50">
                    + {transactions.length - 10} more transactions
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetAndClose}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-slate-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Import Data
                </button>
              </div>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-slate-700 font-medium mb-2">
                Couldn&apos;t process that file
              </p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">{error}</p>
              <button
                onClick={() => setStep("upload")}
                className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
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
