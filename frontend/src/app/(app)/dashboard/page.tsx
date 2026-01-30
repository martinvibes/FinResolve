"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage, type Role } from "@/components/chat/ChatMessage";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { StatementUploadModal } from "@/components/modals/StatementUploadModal";
import { TrendingUp, Wallet, Upload, MessageSquare } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { generateAIResponse } from "@/actions/ai";
import { getGreeting } from "@/lib/aiLogic";
import { formatCurrency } from "@/lib/parseInput";
import { type UploadedTransaction, type SpendingEntry } from "@/lib/types";

interface Message {
  id: string;
  role: Role;
  content: string;
  confidence?: "high" | "medium" | "low";
  assumptions?: string[];
}

const SUGGESTIONS = [
  "Where is my money going?",
  "Can I afford a ₦50k purchase?",
  "How much can I save this month?",
];

// Wrapper component to handle Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50/50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, mergeUploadedData, isLoading } = useFinancial();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && !profile.hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [isLoading, profile.hasCompletedOnboarding, router]);

  // Initialize with greeting
  useEffect(() => {
    if (
      !hasInitialized.current &&
      !isLoading &&
      profile.hasCompletedOnboarding
    ) {
      hasInitialized.current = true;
      const greeting = getGreeting(profile);
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: greeting,
        },
      ]);
    }
  }, [isLoading, profile]);

  // Check for upload param
  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setShowUploadModal(true);
      // Clear the param
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (content: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    // Generate AI response via Server Action (with Opik tracing)
    setTimeout(async () => {
      try {
        const response = await generateAIResponse(content, profile);
        console.log("🤖 AI Response:", response);
        const newAiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          confidence: response.confidence,
          assumptions: response.assumptions,
        };
        setMessages((prev) => [...prev, newAiMsg]);
      } catch (error) {
        console.error("Failed to get response", error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble thinking right now. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    }, 100); // Small delay to allow UI update before server call
  };

  const handleUploadComplete = (transactions: UploadedTransaction[]) => {
    // Convert transactions to spending entries
    const spendingEntries: SpendingEntry[] = transactions
      .filter((t) => t.type === "debit")
      .map((t) => ({
        id: t.id,
        category: t.suggestedCategory || "other",
        amount: t.amount,
        confidence: "high" as const,
        source: "upload" as const,
        description: t.description,
        date: t.date,
      }));

    mergeUploadedData(spendingEntries);
    setShowUploadModal(false);

    // Add confirmation message
    const msg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Great! I've imported ${transactions.length} transactions from your statement. 📊\n\nYour spending data is now more accurate. Ask me anything about your finances!`,
    };
    setMessages((prev) => [...prev, msg]);
  };

  // Calculate dashboard stats
  const totalSpending = profile.spendingSummary.reduce(
    (sum, s) => sum + s.total,
    0,
  );
  const monthlyIncome = profile.income?.amount || 0;
  const budgetRemaining = monthlyIncome - totalSpending;
  const totalSaved = profile.goals.reduce((sum, g) => sum + g.current, 0);

  // Show loading or onboarding redirect
  if (isLoading || !profile.hasCompletedOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50/50">
      {/* Chat Section (Main) */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header Area */}
        <header className="px-6 py-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">
            Financial Coach
          </h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Statement</span>
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <EmptyState onSuggest={handleSend} />
            ) : (
              messages.map((msg) => (
                <div key={msg.id}>
                  <ChatMessage role={msg.role} content={msg.content} />
                  {msg.assumptions && msg.assumptions.length > 0 && (
                    <div className="ml-12 mt-1 text-xs text-slate-400 italic">
                      ⚠️ {msg.assumptions.join(", ")}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-3 p-4">
                <div className="flex bg-primary/10 w-8 h-8 rounded-full items-center justify-center">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-linear-to-t from-white via-white to-transparent pb-8">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            <SuggestedQuestions questions={SUGGESTIONS} onSelect={handleSend} />
            <ChatInput onSend={handleSend} disabled={isTyping} />
          </div>
        </div>
      </div>

      {/* Dashboard Section (Right Sidebar - Desktop Only) */}
      <div className="hidden xl:block w-96 border-l border-border bg-white h-full overflow-y-auto p-6 space-y-8">
        <div>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-4">
            Daily Snapshot
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  Budget Left
                </span>
              </div>
              <p className="text-xl font-bold text-green-800">
                {budgetRemaining > 0 ? formatCurrency(budgetRemaining) : "—"}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Saved</span>
              </div>
              <p className="text-xl font-bold text-blue-800">
                {totalSaved > 0 ? formatCurrency(totalSaved) : "—"}
              </p>
            </div>
          </div>

          {profile.spendingSummary.length > 0 ? (
            <div className="h-64">
              <SpendingChart />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl">
              <p className="text-sm text-slate-400 text-center px-4">
                Tell me about your spending to see charts here
              </p>
            </div>
          )}
        </div>

        <div className="mt-28">
          <h2 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-4">
            Active Goals
          </h2>
          <div className="space-y-4">
            {profile.goals.length > 0 ? (
              profile.goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  title={goal.name}
                  target={goal.target}
                  current={goal.current}
                  deadline={goal.deadline || undefined}
                  color={
                    goal.priority === "high"
                      ? "bg-emerald-500"
                      : goal.priority === "medium"
                        ? "bg-blue-500"
                        : "bg-slate-500"
                  }
                />
              ))
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl text-center">
                <p className="text-sm text-slate-500">
                  Tell me what you&apos;re saving for!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <StatementUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onComplete={handleUploadComplete}
      />
    </div>
  );
}

// Empty state component
function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        Hey! Let&rsquo;s talk about your money
      </h2>
      <p className="text-slate-500 max-w-md mb-8">
        Ask me anything about your finances. I&apos;ll help you understand where
        your money goes and how to make it work better for you.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          "Where does my money go?",
          "Help me budget",
          "Am I saving enough?",
        ].map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
