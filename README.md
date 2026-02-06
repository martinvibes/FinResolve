<p align="center">
  <img src="https://img.shields.io/badge/FinResolve-AI_Financial_Coach-4f46e5?style=for-the-badge&logo=money&logoColor=white" alt="FinResolve"/>
</p>

<h1 align="center">FinResolve</h1>

<p align="center">
  <strong>Your AI-Powered Financial Health Companion</strong>
</p>

<p align="center">
  <em>Stop guessing. Start knowing. Take control of your money with intelligent, conversational financial coaching.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.x-black?logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai" alt="OpenAI"/>
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?logo=tailwindcss" alt="Tailwind"/>
</p>

---

## The Problem

**Financial literacy is broken.**

Millions of people struggle with money—not because they're irresponsible, but because:

- Traditional budgeting apps feel like spreadsheets with a fresh coat of paint
- Financial advice is locked behind expensive advisors or buried in jargon
- People don't know what they don't know about their spending patterns
- Setting goals is easy; actually tracking and achieving them is hard
- Bank statements are cryptic, and categorizing transactions is tedious

**FinResolve exists to change that.**

---

## The Solution

FinResolve is a **chat-first AI financial health app** that makes managing money feel like talking to a knowledgeable friend—one who actually understands your finances, never judges, and is available 24/7.

### What Makes FinResolve Different

| Traditional Apps | FinResolve |
|-----------------|------------|
| Rigid forms and dropdowns | Natural language: *"I spent 5k on groceries"* |
| Manual categorization | AI auto-categorizes your transactions |
| Static dashboards | Dynamic insights that adapt to YOUR patterns |
| Generic advice | Personalized coaching based on your financial reality |
| Overwhelming data dumps | Actionable nudges at the right moment |

---

## Features

### Core Financial Management

**Smart Income & Expense Tracking**
- Log transactions in plain English: *"Paid ₦15,000 for electricity"*
- AI extracts amount, category, and context automatically
- Support for Nigerian currency notation (₦, NGN, "5k", "2.5m")
- Confidence levels for estimated vs. exact amounts

**Multi-Account Management**
- Track bank accounts, mobile money (OPay, PalmPay), cash, and crypto
- Real-time balance updates across all accounts
- Transfer tracking between accounts

**Intelligent Budgeting**
- Set spending limits by category (monthly, weekly, or yearly)
- Visual progress bars show budget health at a glance
- AI warns you before you overspend, not after

**Recurring Expense Tracking**
- Never forget a subscription or bill again
- Automatic reminders for upcoming payments
- Full visibility into your fixed costs

---

### AI-Powered Intelligence

**Conversational Financial Coach**
- Powered by GPT-4o for nuanced, context-aware responses
- Understands your full financial picture before responding
- Can execute actions: log expenses, update goals, create budgets—all through chat

**Natural Language Processing**
```
"I spent about 5k on lunch" → Logs ₦5,000 to Food (medium confidence)
"Exactly ₦25,000 for my phone bill" → Logs ₦25,000 to Utilities (high confidence)
"2.5m for the car deposit" → Logs ₦2,500,000 to Transport (high confidence)
```

**Proactive AI Nudges**
- *"You've used 80% of your food budget with 10 days left"*
- *"Great progress! You're ahead on your Emergency Fund goal"*
- *"Your spending today puts you over your daily safe-to-spend"*

**Weekly Insights**
- Rule-based pattern detection identifies spending spikes
- Highlights saving opportunities you might have missed
- Tracks week-over-week trends automatically

---

### FinResolve Score™

A **dynamic financial health score** (0-100) that gives you instant clarity on where you stand.

| Score Range | Rating | What It Means |
|-------------|--------|---------------|
| 85-100 | Excellent | Financial rockstar—keep it up |
| 70-84 | Strong | Solid foundation, room for optimization |
| 55-69 | Stable | Balanced but vulnerable to surprises |
| 40-54 | Needs Work | Time to tighten the belt |
| 0-39 | Critical | Urgent attention required |

**Score Breakdown:**
- **Spending Control (30%)** — Are you staying within budget?
- **Savings Consistency (25%)** — Are you building wealth consistently?
- **Goal Progress (25%)** — Are you hitting milestones on time?
- **Risk Alerts (20%)** — Are there red flags in your finances?

Each score comes with **AI-generated recommendations** to improve your financial health.

---

### Goals & Savings

**Smart Goal Tracking**
- Create savings goals with targets, deadlines, and priority levels
- Visual progress indicators show how close you are
- Deadline-aware scoring: ahead of schedule, on track, or behind

**Goal Templates**
- Emergency Fund (3-6 months of expenses)
- Home Down Payment
- New Vehicle
- Education/Courses
- Vacation
- Wedding
- Business Investment
- Custom Goals

---

### Bank Statement Import

**CSV Upload Support**
- Intelligent column detection (handles different bank formats)
- Auto-categorization of imported transactions
- Preview and review before finalizing import
- Bulk import saves hours of manual entry

---

### Onboarding That Actually Works

A **4-step wizard** gets you up and running in under 2 minutes:

1. **Welcome** — Tell us your name
2. **Income** — Set your monthly income
3. **Expenses** — Select your typical spending categories
4. **Goals** — Choose from common financial goals

No overwhelming forms. No 50-field profiles. Just what we need to start helping you.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library with latest features |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Smooth animations |
| **Recharts** | Beautiful data visualizations |
| **Lucide Icons** | Modern icon system |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database + Auth + Real-time |
| **Row-Level Security** | Database-level access control |
| **Server Actions** | Next.js server-side functions |

### AI & Intelligence
| Technology | Purpose |
|------------|---------|
| **OpenAI GPT-4o** | Primary conversational AI |
| **Google Gemini** | Fallback LLM |
| **Opik (Comet ML)** | LLM observability & tracing |
| **Custom NLP** | Nigerian currency & intent parsing |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Dashboard   │  │   Chat AI    │  │   Onboarding         │   │
│  │  - Pulse     │  │  - GPT-4o    │  │   - 4-Step Wizard    │   │
│  │  - Charts    │  │  - Actions   │  │   - Profile Setup    │   │
│  │  - Goals     │  │  - NLP Parse │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐   │
│  │              Context Providers (Auth + Financial)          │   │
│  └────────────────────────────┬──────────────────────────────┘   │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    Server Actions     │
                    │  (ai.ts, insights.ts) │
                    └───────────┬───────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
    ┌─────┴─────┐        ┌──────┴──────┐       ┌──────┴──────┐
    │  Supabase │        │   OpenAI    │       │    Opik     │
    │  Database │        │   GPT-4o    │       │  Tracing    │
    └───────────┘        └─────────────┘       └─────────────┘
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Protected routes (dashboard, goals, etc.)
│   │   ├── (auth)/             # Login & signup
│   │   ├── (marketing)/        # Landing page
│   │   └── (onboarding)/       # First-time user flow
│   │
│   ├── components/             # React components
│   │   ├── chat/               # AI chat interface
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── modals/             # Modal dialogs
│   │   ├── onboarding/         # Wizard steps
│   │   └── ui/                 # Reusable primitives
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── FinancialContext.tsx # Financial data state
│   │
│   ├── actions/                # Server-side actions
│   │   ├── ai.ts               # AI response generation
│   │   └── insights.ts         # Weekly analytics
│   │
│   └── lib/                    # Utilities
│       ├── scoreCalculation.ts # FinResolve Score algorithm
│       ├── parseInput.ts       # NLP for currency/categories
│       ├── parseStatement.ts   # CSV bank statement parser
│       ├── supabase.ts         # Database client
│       └── openaiClient.ts     # AI client
│
├── supabase-schema.sql         # Database schema
└── package.json                # Dependencies
```

---

## Database Schema

```sql
-- Core tables (simplified)

profiles           -- User financial profile
├── id             -- UUID (FK to auth.users)
├── name           -- Display name
├── monthly_income -- Income in Naira
├── has_completed_onboarding
└── data_completeness_score

spending_entries   -- Individual transactions
├── id
├── user_id
├── amount
├── category       -- food, transport, utilities, etc.
├── type           -- expense, income, transfer
├── description
├── source         -- manual, csv, ai
└── confidence     -- high, medium, low

savings_goals      -- Financial goals
├── id
├── user_id
├── name
├── target_amount
├── current_amount
├── deadline
└── priority       -- high, medium, low

accounts           -- Bank/mobile money accounts
├── id
├── user_id
├── name
├── type           -- bank, mobile_money, cash, crypto
└── balance

budgets            -- Spending limits
├── id
├── user_id
├── category
├── limit_amount
└── period         -- monthly, weekly, yearly

recurring_items    -- Subscriptions & bills
├── id
├── user_id
├── name
├── amount
├── category
├── frequency      -- daily, weekly, monthly, yearly
└── next_due_date
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account (free tier works)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/finresolve.git
   cd finresolve/frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL from `supabase-schema.sql` in the SQL editor
   - Apply RLS policies from `supabase-auth-policies.sql`

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## Usage

### Logging Expenses via Chat

Simply tell FinResolve what you spent:

```
You: I spent 5k on groceries today
AI:  Got it! I've logged ₦5,000 to Food. Your food budget is now at 65%.

You: Paid electricity bill - exactly ₦15,000
AI:  Logged ₦15,000 to Utilities. You have ₦35,000 left in this month's utilities budget.

You: Transferred 50k to savings
AI:  Nice! Logged ₦50,000 transfer to Savings. You're now 45% toward your Emergency Fund goal!
```

### Asking Questions

```
You: Can I afford a ₦200k vacation next month?
AI:  Based on your current savings rate and expenses, you'd need to save an additional
     ₦85,000 this month. That's possible if you cut dining out by 40%. Want me to
     create a temporary budget to help you track this?

You: How am I doing this month?
AI:  You're doing well! Here's your snapshot:
     • Spent ₦180,000 of ₦350,000 income (51%)
     • On track for Emergency Fund goal (ahead by 2 days!)
     • 3 categories under budget, 1 slightly over (Transport at 105%)
     Your FinResolve Score: 74 (Strong)
```

### Dashboard Overview

The dashboard provides a 70/30 split layout:
- **Left (70%)**: Financial data, charts, goals, budgets
- **Right (30%)**: AI chat panel

Key widgets:
- **Financial Pulse**: Income, spending, net worth at a glance
- **Spending Chart**: Category breakdown visualization
- **Trend Chart**: Daily/weekly spending patterns
- **Budget Progress**: Visual progress bars per category
- **Goal Tracker**: Progress toward savings goals
- **Recent Activity**: Latest transactions

---

## Spending Categories

FinResolve supports 18 spending categories:

| Category | Emoji | Description |
|----------|-------|-------------|
| Food | 🍔 | Groceries, restaurants, delivery |
| Transport | 🚗 | Fuel, Uber, public transit |
| Utilities | 💡 | Electricity, water, internet |
| Housing | 🏠 | Rent, mortgage, repairs |
| Entertainment | 🎬 | Movies, streaming, events |
| Shopping | 🛍️ | Clothing, electronics, general |
| Health | 💊 | Medical, gym, wellness |
| Education | 📚 | Courses, books, tuition |
| Savings | 💰 | Transfers to savings |
| Family | 👨‍👩‍👧 | Family support, gifts to family |
| Debt | 💳 | Loan payments, credit cards |
| Personal Care | 💅 | Grooming, self-care |
| Investment | 📈 | Stocks, crypto, business |
| Tax | 🏛️ | Tax payments |
| Salary | 💵 | Income from employment |
| Business | 💼 | Business expenses |
| Gift | 🎁 | Gifts to others |
| Other | 📦 | Miscellaneous |

---

## API Reference

### Server Actions

#### `generateAIResponse(messages, profile)`
Generates an AI response with financial context.

```typescript
const response = await generateAIResponse(
  [{ role: 'user', content: 'I spent 5k on food' }],
  userProfile
);
// Returns: { content: string, actions: AIAction[] }
```

#### `generateWeeklyInsight(profile)`
Generates rule-based weekly financial insights.

```typescript
const insight = await generateWeeklyInsight(userProfile);
// Returns: { title: string, body: string, type: 'tip' | 'warning' | 'celebration' }
```

### Context Hooks

#### `useAuth()`
```typescript
const { user, profile, signIn, signUp, signOut, loading } = useAuth();
```

#### `useFinancial()`
```typescript
const {
  profile,
  addSpending,
  updateGoal,
  addAccount,
  updateBudget,
  calculateScore
} = useFinancial();
```

---

## Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## Roadmap

### Near Term
- [ ] PDF bank statement parsing
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Push notifications for budget alerts

### Medium Term
- [ ] Multi-currency support
- [ ] Plaid integration for automatic bank sync
- [ ] Shared budgets (couples/families)
- [ ] Receipt scanning with OCR

### Long Term
- [ ] Investment tracking & portfolio analysis
- [ ] Tax optimization suggestions
- [ ] Financial planning simulations
- [ ] API for third-party integrations

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Acknowledgments

- **OpenAI** for GPT-4o powering the conversational AI
- **Supabase** for the incredible backend infrastructure
- **Vercel** for hosting and deployment
- **The open-source community** for the amazing tools that made this possible

---

<p align="center">
  <strong>Built with purpose. Designed for clarity. Powered by AI.</strong>
</p>

<p align="center">
  <em>FinResolve — Because your money deserves better.</em>
</p>
