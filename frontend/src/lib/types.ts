// ========================================
// Financial Data Types for FinResolve AI
// ========================================

// Confidence level for user-provided data
export type ConfidenceLevel = "high" | "medium" | "low";

// Source of the data
export type DataSource = "manual" | "upload" | "estimated";

// Spending categories
export type SpendingCategory =
  | "food"
  | "transport"
  | "utilities"
  | "housing"
  | "entertainment"
  | "shopping"
  | "health"
  | "education"
  | "savings"
  | "other";

// Individual spending entry
export interface SpendingEntry {
  id: string;
  category: SpendingCategory;
  amount: number;
  confidence: ConfidenceLevel;
  source: DataSource;
  description?: string;
  date?: string;
  merchantName?: string;
}

// Income information
export interface IncomeData {
  amount: number;
  confidence: ConfidenceLevel;
  isEstimate: boolean;
  frequency: "monthly" | "weekly" | "yearly";
  source?: string; // e.g., "salary", "freelance", etc.
}

// Savings goal
export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

// Monthly spending summary by category
export interface SpendingSummary {
  category: SpendingCategory;
  total: number;
  confidence: ConfidenceLevel;
  transactionCount: number;
}

// User's complete financial profile
export interface UserFinancialProfile {
  id: string;
  name?: string;
  income: IncomeData | null;
  monthlySpending: SpendingEntry[];
  spendingSummary: SpendingSummary[];
  goals: SavingsGoal[];
  hasCompletedOnboarding: boolean;
  lastUpdated: string;
  dataCompleteness: number; // 0-100 percentage
}

// Onboarding stages
export type OnboardingStage =
  | "welcome"
  | "income"
  | "expenses"
  | "goals"
  | "complete";

// Onboarding state
export interface OnboardingState {
  currentStage: OnboardingStage;
  collectedData: Partial<UserFinancialProfile>;
  messages: OnboardingMessage[];
  isProcessing: boolean;
}

// Message in onboarding chat
export interface OnboardingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    parsedData?: ParsedInput;
    stage?: OnboardingStage;
  };
}

// Parsed input from natural language
export interface ParsedInput {
  amount?: number;
  category?: SpendingCategory;
  confidence: ConfidenceLevel;
  originalText: string;
  hasModifier: boolean; // "about", "roughly", etc.
}

// Transaction from bank statement upload
export interface UploadedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  suggestedCategory?: SpendingCategory;
  confirmed: boolean;
}

// Upload preview state
export interface UploadPreviewState {
  fileName: string;
  transactions: UploadedTransaction[];
  totalCredits: number;
  totalDebits: number;
  dateRange: {
    start: string;
    end: string;
  };
  isProcessing: boolean;
}

// Chat message for main dashboard
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  confidence?: ConfidenceLevel;
  assumptions?: string[];
  richContent?: {
    type: "chart" | "breakdown" | "goal";
    data: unknown;
  };
}

// Default empty profile
export const createEmptyProfile = (): UserFinancialProfile => ({
  id: crypto.randomUUID(),
  income: null,
  monthlySpending: [],
  spendingSummary: [],
  goals: [],
  hasCompletedOnboarding: false,
  lastUpdated: new Date().toISOString(),
  dataCompleteness: 0,
});

// Category display names and colors
export const CATEGORY_META: Record<
  SpendingCategory,
  { label: string; color: string; emoji: string }
> = {
  food: { label: "Food & Dining", color: "#f97316", emoji: "🍔" },
  transport: { label: "Transportation", color: "#3b82f6", emoji: "🚗" },
  utilities: { label: "Utilities & Bills", color: "#8b5cf6", emoji: "💡" },
  housing: { label: "Housing & Rent", color: "#ec4899", emoji: "🏠" },
  entertainment: { label: "Entertainment", color: "#06b6d4", emoji: "🎬" },
  shopping: { label: "Shopping", color: "#10b981", emoji: "🛍️" },
  health: { label: "Health & Fitness", color: "#ef4444", emoji: "💊" },
  education: { label: "Education", color: "#f59e0b", emoji: "📚" },
  savings: { label: "Savings", color: "#22c55e", emoji: "💰" },
  other: { label: "Other", color: "#6b7280", emoji: "📦" },
};
