"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StatementUploadModal } from "@/components/modals/StatementUploadModal";
import { ReportModal } from "@/components/reports/ReportModal";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { CATEGORY_META } from "@/lib/types";
import { formatCurrency } from "@/lib/parseInput";
import { useAuth } from "@/contexts/AuthContext";
import { generateAIResponse } from "@/actions/ai";
import { getGreeting } from "@/lib/aiLogic";
import {
  type UploadedTransaction,
  type SpendingEntry,
  type LogExpensePayload,
  type LogIncomePayload,
  type LogTransferPayload,
  type UpdateGoalPayload,
  type CreateGoalPayload,
  type CreateBudgetPayload,
  type SpendingCategory,
} from "@/lib/types";

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
import { FinResolveScoreModal } from "@/components/dashboard/FinResolveScoreModal";
import { ChatPanel, type Message } from "@/components/chat/ChatPanel";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { MobileChatInput } from "@/components/chat/MobileChatInput";

const SUGGESTIONS = [
  "Where is my money going?",
  "Can I afford a $10k purchase?",
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
    addGoal,
    addBudget,
  } = useFinancial();
  const { user } = useAuth();

  // ... existing logic ...
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
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

    // 1. Check for specific category budget overruns (highest priority)
    const overBudgetCategories = (profile.budgets || [])
      .filter((b) => b.spent > b.limit)
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);

    if (overBudgetCategories.length > 0) {
      const top = overBudgetCategories[0];
      const meta = CATEGORY_META[top.category];
      const overAmount = top.spent - top.limit;
      return `Warning: You are ${formatCurrency(overAmount, profile.currency)} over your ${meta.label} budget! 🚨`;
    }

    // 2. Check for overall monthly budget
    if (budgetRemaining < 0) {
      return "You're over your total budget this month. Let's review your spending.";
    }

    // 3. Near end of month check
    if (daysRemaining <= 5 && budgetRemaining > 0) {
      return `${daysRemaining} days left - you're doing great with your savings!`;
    }

    // 4. Goal nudge
    if (profile.goals.length === 0) {
      return "Ready to set your first savings goal? I can help.";
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
        const actions = response.actions || [];

        for (const action of actions) {
          if (action.type === "LOG_EXPENSE") {
            const payload = action.payload as LogExpensePayload;
            const amountVal = (payload as any).amount;
            const amount =
              typeof amountVal === "string"
                ? parseFloat(amountVal.replace(/,/g, ""))
                : Number(amountVal);

            if (!amount || amount <= 0) {
              console.warn(
                "AI attempted to log expense with 0 or invalid amount",
              );
              continue;
            }

            // Add detailed entry
            addSpending({
              id: crypto.randomUUID(),
              category: payload.category,
              amount: amount,
              confidence: "high",
              source: "ai",
              description: payload.description,
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              accountId: payload.accountId,
              type: "expense",
            });
          } else if (action.type === "LOG_INCOME") {
            const payload = action.payload as LogIncomePayload;
            const amountVal = (payload as any).amount;
            const amount =
              typeof amountVal === "string"
                ? parseFloat(amountVal.replace(/,/g, ""))
                : Number(amountVal);

            if (!amount || amount <= 0) {
              console.warn(
                "AI attempted to log income with 0 or invalid amount",
              );
              continue;
            }

            addSpending({
              id: crypto.randomUUID(),
              category: payload.category, // e.g. 'gift', 'salary'
              amount: amount,
              confidence: "high",
              source: "ai",
              description: payload.description,
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              accountId: payload.accountId,
              type: "income",
            });
          } else if (action.type === "LOG_TRANSFER") {
            const payload = action.payload as LogTransferPayload;
            const amountVal = (payload as any).amount;
            const amount =
              typeof amountVal === "string"
                ? parseFloat(amountVal.replace(/,/g, ""))
                : Number(amountVal);

            addSpending({
              id: crypto.randomUUID(),
              category: "other", // Default category for transfer
              amount: amount,
              confidence: "high",
              source: "ai",
              description: payload.description || "Transfer",
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              accountId: payload.sourceAccountId,
              destinationAccountId: payload.destinationAccountId,
              type: "transfer",
            });
          } else if (action.type === "UPDATE_GOAL") {
            const payload = action.payload as UpdateGoalPayload;
            const amountVal = (payload as any).amount;
            const amount =
              typeof amountVal === "string"
                ? parseFloat(amountVal.replace(/,/g, ""))
                : Number(amountVal);

            // 1. Find Goal
            const goal = profile.goals.find(
              (g) =>
                g.id === payload.goalId ||
                g.name.toLowerCase().includes(payload.goalName.toLowerCase()),
            );

            if (goal) {
              // 2. Update Goal Value
              const newCurrent = goal.current + amount;
              updateGoal(goal.id, { current: newCurrent });

              // 3. Log as an 'Expense' (money moving from account to goal)
              // Note: addSpending already handles account balance deduction when accountId is provided
              addSpending({
                id: crypto.randomUUID(),
                category: "savings",
                amount: amount,
                confidence: "high",
                source: "ai",
                description: `Saved for ${goal.name}`,
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                accountId: payload.accountId,
                type: "expense",
              });
            }
          } else if (action.type === "CREATE_GOAL") {
            const payload = action.payload as CreateGoalPayload;
            const targetVal = (payload as any).target;
            const target =
              typeof targetVal === "string"
                ? parseFloat(targetVal.replace(/,/g, ""))
                : Number(targetVal);

            addGoal({
              id: crypto.randomUUID(),
              name: payload.name,
              target: target,
              current: 0,
              deadline: payload.deadline,
              priority: "medium",
              createdAt: new Date().toISOString(),
            });
          } else if (action.type === "CREATE_BUDGET") {
            const payload = action.payload as CreateBudgetPayload;
            addBudget({
              id: crypto.randomUUID(),
              category: payload.category,
              limit: payload.limit,
              period: "monthly",
              spent: 0,
            });
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
    setShowUploadModal(false);

    const msg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Great! I've imported ${transactions.length} transactions from your statement. Your spending data is now more accurate. Ask me anything about your finances!`,
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleAddTransaction = (data: {
    amount: string;
    category: string;
    description: string;
    accountId: string;
  }) => {
    addSpending({
      id: crypto.randomUUID(),
      category: data.category as SpendingCategory,
      amount: parseFloat(data.amount),
      confidence: "high",
      source: "manual",
      description: data.description || "Manual Expense",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      accountId: data.accountId,
      type: "expense",
    });

    const msg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `I've logged that expense of ${data.amount} for ${data.category}.`,
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
        onAddExpense={handleAddExpense}
        onAnalyze={handleAnalyze}
        onSaveNow={handleSaveNow}
        onUpload={() => setShowUploadModal(true)}
        onViewScore={() => setShowScoreModal(true)}
      />

      {/* Main Content: 70/30 Split on Desktop */}
      <div className="flex h-[calc(100vh-130px)]">
        {/* Left Panel - Data (70%) */}
        <div className="flex-1 lg:w-[70%] overflow-y-auto p-6 pb-24 lg:pb-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back, {profile.name || "User"}
                </p>
              </div>
              <div className="flex gap-2">
                <ReportModal />
                {/* <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="mr-2 h-4 w-4" /> Import Stats
                </Button> */}
                {/* <Button onClick={() => setIsAddTransactionOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button> */}
              </div>
            </div>
            {/* Account Overview */}
            <AccountCards />

            {/* Financial Pulse Cards */}
            <FinancialPulseCards />

            {/* Budget & Recurring Row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
              <BudgetProgress isPreview />
              <RecurringBills isPreview />
            </div>

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

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onAdd={handleAddTransaction}
      />

      {/* FinResolve Score Modal */}
      <FinResolveScoreModal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
      />
    </div>
  );
}
