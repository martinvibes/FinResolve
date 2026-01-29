"use client";

import { useEffect, useState } from "react";
import { useFinancial } from "@/contexts/FinancialContext";
import { WeeklyInsight } from "@/components/coach/WeeklyInsight";
import { type SpendingInsight } from "@/lib/coach/generateInsight";
import { getWeeklyInsightAction } from "@/actions/insights";
import { Loader2 } from "lucide-react";

export default function InsightsPage() {
  const { profile, isLoading } = useFinancial();
  const [insight, setInsight] = useState<SpendingInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    async function loadInsight() {
      if (profile && profile.hasCompletedOnboarding) {
        try {
          const result = await getWeeklyInsightAction(profile);
          setInsight(result);
        } catch (error) {
          console.error("Failed to load insight", error);
        } finally {
          setLoadingInsight(false);
        }
      }
    }

    if (!isLoading) {
      loadInsight();
    }
  }, [profile, isLoading]);

  // Temporary UI placeholder until Server Action is wired
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Weekly Insights</h1>
        <p className="text-slate-500">Your personal financial coach check-in</p>
      </header>

      <div className="bg-gradient-to-r from-primary/10 to-blue-50 p-8 rounded-3xl mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">
          Hello, {profile.name || "friend"}! 👋
        </h2>
        <p className="text-slate-700 max-w-2xl">
          I&rsquo;ve analyzed your spending patterns for this week. Here&#39;s
          what I found...
        </p>
      </div>

      {loadingInsight ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : insight ? (
        <WeeklyInsight
          insight={insight}
          onAccept={() => console.log("Accepted")}
          onReject={() => console.log("Rejected")}
        />
      ) : (
        <p>No insights available yet.</p>
      )}
    </div>
  );
}
