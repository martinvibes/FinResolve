"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StatementUploadModal } from "@/components/modals/StatementUploadModal";
import { useFinancial } from "@/contexts/FinancialContext";
import { useAuth } from "@/contexts/AuthContext";
import { generateAIResponse } from "@/actions/ai";
import { getGreeting } from "@/lib/aiLogic";
import { type UploadedTransaction, type SpendingEntry } from "@/lib/types";

// New components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CommandBar } from "@/components/dashboard/CommandBar";
import { FinancialPulseCards } from "@/components/dashboard/FinancialPulseCards";
import { AccountCards } from "@/components/dashboard/AccountCards";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { RecurringBills } from "@/components/dashboard/RecurringBills";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { PrimaryGoalWidget } from "@/components/dashboard/PrimaryGoalWidget";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ChatPanel, type Message } from "@/components/chat/ChatPanel";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { MobileChatInput } from "@/components/chat/MobileChatInput";

const SUGGESTIONS = [
  "Where is my money going?",
  "Can I afford a ₦50k purchase?",
  "How much can I save this month?",
  "Analyze my spending habits",
];

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
  const {
    profile,
    mergeUploadedData,
    isLoading,
    updateGoal,
    addSpending,
    addSpendingSummary,
  } = useFinancial();
  const { user } = useAuth();

  // ... existing logic ...
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const hasInitialized = useRef(false);

  // AI contextual nudge based on financial state
  const getAiNudge = () => {
    // ... existing logic ...
    const totalSpending = profile.spendingSummary.reduce(
      (s, c) => s + c.total,
      0,
    );
    const monthlyIncome = profile.income?.amount || 0;
    const budgetRemaining = monthlyIncome - totalSpending;
    const today = new Date();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const daysRemaining = daysInMonth - today.getDate();

    if (budgetRemaining < 0) {
      return "You're over budget this month. Let's talk about it.";
    }
    if (daysRemaining <= 5 && budgetRemaining > 0) {
      return `${daysRemaining} days left - you're doing great!`;
    }
    if (profile.goals.length === 0) {
      return "Ready to set a savings goal?";
    }
    return undefined;
  };

  // ... existing effects ...

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && user && !profile.hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [isLoading, user, profile.hasCompletedOnboarding, router]);

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
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const handleSend = (content: string) => {
    // ... existing handleSend ...
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    setTimeout(async () => {
      try {
        // Map messages to simple format for history
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await generateAIResponse(content, profile, history);

        // Handle AI Actions
        if (response.action) {
          const action = response.action;
          if (action.type === "LOG_EXPENSE") {
            const payload = action.payload;

            // Add detailed entry
            addSpending({
              id: Date.now().toString(),
              category: payload.category,
              amount: payload.amount,
              confidence: "high",
              source: "ai",
              description: payload.description,
              date: new Date().toISOString(),
              accountId: payload.accountId,
            });

            // Update summary
            addSpendingSummary(payload.category, payload.amount, "high");
          }
        }

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
    }, 100);
  };

  // ... other handlers ...
  const handleUploadComplete = (transactions: UploadedTransaction[]) => {
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

    const msg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Great! I've imported ${transactions.length} transactions from your statement. Your spending data is now more accurate. Ask me anything about your finances!`,
    };
    setMessages((prev) => [...prev, msg]);
  };

  // Command bar handlers
  const handleCommandSearch = (query: string) => {
    handleSend(query);
  };

  const handleAddExpense = () => {
    handleSend("I want to log an expense");
  };

  const handleAnalyze = () => {
    handleSend("Analyze my spending this month");
  };

  const handleSaveNow = () => {
    if (profile.goals.length > 0) {
      handleSend(
        `I want to save money towards my ${profile.goals[0].name} goal`,
      );
    } else {
      handleSend("Help me set up a savings goal");
    }
  };

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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <DashboardHeader aiNudge={getAiNudge()} />

      {/* Command Bar */}
      <CommandBar
        onSearch={handleCommandSearch}
        onAddExpense={handleAddExpense}
        onAnalyze={handleAnalyze}
        onSaveNow={handleSaveNow}
        onUpload={() => setShowUploadModal(true)}
      />

      {/* Main Content: 70/30 Split on Desktop */}
      <div className="flex h-[calc(100vh-130px)]">
        {/* Left Panel - Data (70%) */}
        <div className="flex-1 lg:w-[70%] overflow-y-auto p-6 pb-24 lg:pb-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Account Overview */}
            <AccountCards />

            {/* Financial Pulse Cards */}
            <FinancialPulseCards />

            {/* Budget & Recurring Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BudgetProgress />
              <RecurringBills />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[400px]">
                <TrendChart />
              </div>
              <div className="h-[400px]">
                <SpendingChart />
              </div>
            </div>

            {/* Bottom Row: Activity & Goal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivityFeed />
              <PrimaryGoalWidget />
            </div>
          </div>
        </div>

        {/* Right Panel - Chat (30%) - Desktop Only */}
        <div className="hidden lg:block w-[30%] min-w-[320px] max-w-[400px] border-l border-gray-200 h-full">
          <ChatPanel
            messages={messages}
            isTyping={isTyping}
            onSend={handleSend}
            suggestions={SUGGESTIONS}
          />
        </div>
      </div>

      {/* Mobile Chat Input */}
      <MobileChatInput
        onSend={handleSend}
        onOpenDrawer={() => setIsChatDrawerOpen(true)}
        disabled={isTyping}
      />

      {/* Mobile Chat Drawer */}
      <ChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        messages={messages}
        isTyping={isTyping}
        onSend={(msg) => {
          handleSend(msg);
        }}
        suggestions={SUGGESTIONS}
      />

      {/* Upload Modal */}
      <StatementUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onComplete={handleUploadComplete}
      />
    </div>
  );
}
