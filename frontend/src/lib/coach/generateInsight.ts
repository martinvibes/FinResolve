import { opikClient } from "@/lib/opikClient";
import { type UserFinancialProfile } from "@/lib/types";

export interface SpendingInsight {
  type: "spending_spike" | "saving_opportunity" | "routine_check";
  message: string;
  amount?: number;
  category?: string;
  confidence: number;
}

export async function generateWeeklyInsight(
  profile: UserFinancialProfile,
): Promise<SpendingInsight> {
  const trace = opikClient.trace({
    name: "weekly-insight",
    tags: ["coach", "rule-based"],
    input: {
      totalSpending: profile.spendingSummary.reduce((a, b) => a + b.total, 0),
      income: profile.income?.amount,
    },
  });

  const span = trace.span({
    name: "analyze-spending-patterns",
    type: "tool",
  });

  let insight: SpendingInsight;

  // Simple rule-based logic for now
  // In Phase 4, we can connect this to an LLM for more nuance
  const totalSpending = profile.spendingSummary.reduce(
    (acc, curr) => acc + curr.total,
    0,
  );
  const income = profile.income?.amount || 0;
  const foodSpending =
    profile.spendingSummary.find((s) => s.category === "food")?.total || 0;

  try {
    if (income > 0 && totalSpending > income * 0.9) {
      insight = {
        type: "spending_spike",
        message: `You've used ${Math.round(
          (totalSpending / income) * 100,
        )}% of your monthly income already. Consider cutting back on non-essentials this week to stay safe.`,
        amount: totalSpending,
        confidence: 0.9,
      };
    } else if (foodSpending > 50000) {
      insight = {
        type: "saving_opportunity",
        message: `You've spent ₦${foodSpending.toLocaleString()} on food so far. Cooking at home twice more this week could save you ~₦8,000.`,
        category: "food",
        amount: foodSpending,
        confidence: 0.85,
      };
    } else {
      insight = {
        type: "routine_check",
        message:
          "Your spending looks healthy this week! You're on track to hit your savings goals if you maintain this pace.",
        confidence: 0.95,
      };
    }

    // Update span with output, then end it
    span.update({
      output: { ...insight } as Record<string, unknown>,
    });
    span.end();

    // Update trace with output, then end it
    trace.update({
      output: { ...insight } as Record<string, unknown>,
    });
    trace.end();

    await opikClient.flush();

    return insight;
  } catch (error) {
    console.error("Insight generation error", error);
    // Return safe fallback
    return {
      type: "routine_check",
      message: "Check back later for personalized insights.",
      confidence: 0,
    };
  }
}
