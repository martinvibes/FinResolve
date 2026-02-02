import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found. Data will only be stored locally.",
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// Database types (matches our schema)
export interface DbProfile {
  id: string;
  user_id: string | null; // null for anonymous users, will be set when auth is added
  name: string | null;
  income_amount: number | null;
  income_confidence: string | null;
  income_is_estimate: boolean;
  income_frequency: string;
  income_source: string | null;
  has_completed_onboarding: boolean;
  data_completeness: number;
  created_at: string;
  updated_at: string;
}

export interface DbSpendingEntry {
  id: string;
  profile_id: string;
  category: string;
  amount: number;
  confidence: string;
  source: string;
  description: string | null;
  date: string | null;
  merchant_name: string | null;
  account_id: string | null;
  is_recurring: boolean;
  type: string;
  created_at: string;
}

export interface DbSpendingSummary {
  id: string;
  profile_id: string;
  category: string;
  total: number;
  confidence: string;
  transaction_count: number;
  updated_at: string;
}

export interface DbSavingsGoal {
  id: string;
  profile_id: string;
  name: string;
  target: number;
  current: number;
  deadline: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface DbAccount {
  id: string;
  profile_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_primary: boolean;
  created_at: string;
}

export interface DbBudget {
  id: string;
  profile_id: string;
  category: string;
  limit_amount: number;
  period: string;
  created_at: string;
}

export interface DbRecurringItem {
  id: string;
  profile_id: string;
  name: string;
  amount: number;
  frequency: string;
  next_due_date: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}
