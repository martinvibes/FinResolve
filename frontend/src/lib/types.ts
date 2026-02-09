// ========================================
// Financial Data Types for FinResolve AI
// ========================================

// Supported currencies
export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "NGN"
  | "INR"
  | "KES"
  | "ZAR"
  | "CAD"
  | "AUD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  flag: string;
}

// Currency configurations - USD first as default for global hackathon
export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
    flag: "🇺🇸",
  },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", flag: "🇪🇺" },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
    flag: "🇬🇧",
  },
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
    locale: "en-NG",
    flag: "🇳🇬",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    locale: "en-IN",
    flag: "🇮🇳",
  },
  KES: {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
    locale: "en-KE",
    flag: "🇰🇪",
  },
  ZAR: {
    code: "ZAR",
    symbol: "R",
    name: "South African Rand",
    locale: "en-ZA",
    flag: "🇿🇦",
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    locale: "en-CA",
    flag: "🇨🇦",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    locale: "en-AU",
    flag: "🇦🇺",
  },
};

// Default currency for new users
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

// Confidence level for user-provided data
export type ConfidenceLevel = "high" | "medium" | "low";

// Source of the data
export type DataSource = "manual" | "upload" | "estimated" | "ai";

// Account Types
export type AccountType = "bank" | "mobile_money" | "cash" | "crypto" | "other";

// Financial Account
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isPrimary: boolean;
}

// Budget for a category
export interface Budget {
  id: string;
  category: SpendingCategory;
  limit: number;
  period: "monthly" | "weekly" | "yearly";
  spent: number; // Calculated on frontend or query
}

// Recurring Payment / Subscription
export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "weekly" | "yearly";
  nextDueDate?: string;
  category: SpendingCategory;
  isActive: boolean;
}

// Spending categories
export type SpendingCategory =
  | "food"
  | "transport"
  | "utilities"
  | "data_airtime"
  | "housing"
  | "entertainment"
  | "shopping"
  | "health"
  | "education"
  | "savings"
  | "family"
  | "debt"
  | "personal_care"
  | "investment"
  | "tax"
  | "salary"
  | "business"
  | "gift"
  | "travel"
  | "insurance"
  | "subscriptions"
  | "charity"
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
  accountId?: string;
  isRecurring?: boolean;
  type?: "expense" | "income" | "transfer";
  createdAt?: string;
  destinationAccountId?: string;
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
  currency: CurrencyCode; // User's preferred currency
  income: IncomeData | null;
  accounts: Account[]; // NEW
  budgets: Budget[]; // NEW
  recurringItems: RecurringItem[]; // NEW
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
  merchantName?: string;
  confidence?: ConfidenceLevel;
  isDuplicate?: boolean;
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
    startYear?: number;
    endYear?: number;
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

// AI Action types
export type AIActionType =
  | "LOG_EXPENSE"
  | "LOG_INCOME"
  | "UPDATE_GOAL"
  | "LOG_TRANSFER"
  | "CREATE_GOAL"
  | "CREATE_ACCOUNT"
  | "CREATE_BUDGET";

export interface AIAction {
  type: AIActionType;
  payload:
    | LogExpensePayload
    | LogIncomePayload
    | LogTransferPayload
    | UpdateGoalPayload
    | CreateGoalPayload
    | CreateBudgetPayload
    | CreateAccountPayload;
}

export interface CreateBudgetPayload {
  category: SpendingCategory;
  limit: number;
}

export interface LogExpensePayload {
  amount: number;
  category: SpendingCategory;
  description: string;
  accountId?: string;
}

export interface LogIncomePayload {
  amount: number;
  category: SpendingCategory;
  description: string;
  accountId?: string;
}

export interface LogTransferPayload {
  amount: number;
  sourceAccountId: string;
  destinationAccountId: string;
  description?: string;
}

export interface UpdateGoalPayload {
  amount: number;
  goalName: string; // AI tries to fuzzy match this
  goalId?: string;
  accountId?: string;
}

export interface CreateGoalPayload {
  name: string;
  target: number;
  deadline?: string;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  balance: number;
}

// Default empty profile
export const createEmptyProfile = (): UserFinancialProfile => ({
  id: crypto.randomUUID(),
  currency: DEFAULT_CURRENCY,
  income: null,
  accounts: [],
  budgets: [],
  recurringItems: [],
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
  data_airtime: { label: "Data & Airtime", color: "#6366f1", emoji: "📱" },
  housing: { label: "Housing & Rent", color: "#ec4899", emoji: "🏠" },
  entertainment: { label: "Entertainment", color: "#06b6d4", emoji: "🎬" },
  shopping: { label: "Shopping", color: "#10b981", emoji: "🛍️" },
  health: { label: "Health & Fitness", color: "#ef4444", emoji: "💊" },
  education: { label: "Education", color: "#f59e0b", emoji: "📚" },
  savings: { label: "Savings", color: "#22c55e", emoji: "💰" },
  family: { label: "Family & Kids", color: "#f472b6", emoji: "👨‍👩‍👧" },
  debt: { label: "Debt Repayment", color: "#ef4444", emoji: "💳" },
  personal_care: { label: "Personal Care", color: "#f472b6", emoji: "💄" },
  investment: { label: "Investment", color: "#6366f1", emoji: "📈" },
  tax: { label: "Taxes", color: "#64748b", emoji: "🏛️" },
  salary: { label: "Salary / Income", color: "#16a34a", emoji: "💸" },
  business: { label: "Business Income", color: "#0891b2", emoji: "💼" },
  gift: { label: "Gifts", color: "#db2777", emoji: "🎁" },
  travel: { label: "Travel", color: "#8b5cf6", emoji: "✈️" },
  insurance: { label: "Insurance", color: "#94a3b8", emoji: "🛡️" },
  subscriptions: { label: "Subscriptions", color: "#f59e0b", emoji: "🔄" },
  charity: { label: "Charity & Donations", color: "#14b8a6", emoji: "🤲" },
  other: { label: "Other", color: "#6b7280", emoji: "📦" },
};
