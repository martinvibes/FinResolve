-- FinResolve Database Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Profiles table (main user financial profile)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  income_amount DECIMAL(15, 2),
  income_confidence TEXT CHECK (income_confidence IN ('high', 'medium', 'low')),
  income_is_estimate BOOLEAN DEFAULT false,
  income_frequency TEXT DEFAULT 'monthly' CHECK (income_frequency IN ('monthly', 'weekly', 'yearly')),
  income_source TEXT,
  has_completed_onboarding BOOLEAN DEFAULT false,
  data_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spending entries (individual transactions)
CREATE TABLE spending_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'utilities', 'housing', 'entertainment', 'shopping', 'health', 'education', 'savings', 'other')),
  amount DECIMAL(15, 2) NOT NULL,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'upload', 'estimated')),
  description TEXT,
  date DATE,
  merchant_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spending summaries (aggregated by category)
CREATE TABLE spending_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'utilities', 'housing', 'entertainment', 'shopping', 'health', 'education', 'savings', 'other')),
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  transaction_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, category)
);

-- Savings goals
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target DECIMAL(15, 2) NOT NULL,
  current DECIMAL(15, 2) DEFAULT 0,
  deadline DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_spending_entries_profile ON spending_entries(profile_id);
CREATE INDEX idx_spending_summaries_profile ON spending_summaries(profile_id);
CREATE INDEX idx_savings_goals_profile ON savings_goals(profile_id);
CREATE INDEX idx_profiles_user ON profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for now, allow all - will be restricted when auth is added)
-- These policies allow anyone to access data (for development)
-- We'll update these when we add authentication

CREATE POLICY "Allow all access to profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all access to spending_entries" ON spending_entries FOR ALL USING (true);
CREATE POLICY "Allow all access to spending_summaries" ON spending_summaries FOR ALL USING (true);
CREATE POLICY "Allow all access to savings_goals" ON savings_goals FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spending_summaries_updated_at BEFORE UPDATE ON spending_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

