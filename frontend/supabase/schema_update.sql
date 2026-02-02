-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create ACCOUNTS table
create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid, -- will link to auth.users in real usage
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'mobile_money', 'cash', 'crypto', 'other')),
  balance numeric not null default 0,
  currency text not null default 'NGN',
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create BUDGETS table
create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  category text not null,
  limit_amount numeric not null,
  period text not null default 'monthly',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Create RECURRING_ITEMS table
create table if not exists recurring_items (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  amount numeric not null,
  frequency text not null default 'monthly',
  next_due_date date,
  category text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Update SPENDING_ENTRIES table
alter table spending_entries 
add column if not exists account_id uuid references accounts(id),
add column if not exists is_recurring boolean default false,
add column if not exists type text default 'expense' check (type in ('expense', 'income', 'transfer'));

-- Output success message (optional, conceptual)
-- select 'Dashboard upgrade schema applied successfully' as message;
