import {
  type SpendingCategory,
  type ConfidenceLevel,
  type ParsedInput,
} from "./types";

// ========================================
// Natural Language Parser for Financial Input
// ========================================

// Currency patterns (₦, NGN, Naira, etc.)
const CURRENCY_PATTERNS = [
  /₦\s*([\d,]+(?:\.\d{2})?)\s*(k|m|million|thousand)?/gi,
  /NGN\s*([\d,]+(?:\.\d{2})?)\s*(k|m|million|thousand)?/gi,
  /naira\s*([\d,]+(?:\.\d{2})?)\s*(k|m|million|thousand)?/gi,
  /([\d,]+(?:\.\d{2})?)\s*(k|m|million|thousand)?\s*(?:naira|NGN|₦)/gi,
  /([\d,]+(?:\.\d{2})?)\s*(k|m|million|thousand)/gi, // Just numbers with k/m
  /([\d,]+(?:\.\d{2})?)/g, // Plain numbers as fallback
];

// Confidence modifiers
const LOW_CONFIDENCE_WORDS = [
  "about",
  "around",
  "roughly",
  "maybe",
  "approximately",
  "like",
  "probably",
  "ish",
];
const HIGH_CONFIDENCE_WORDS = ["exactly", "precisely", "specifically"];

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<SpendingCategory, string[]> = {
  food: [
    "food",
    "eating",
    "restaurant",
    "groceries",
    "cooking",
    "lunch",
    "dinner",
    "breakfast",
    "snacks",
    "drinks",
    "cafe",
    "coffee",
  ],
  transport: [
    "transport",
    "uber",
    "bolt",
    "taxi",
    "bus",
    "fuel",
    "petrol",
    "diesel",
    "gas",
    "car",
    "ride",
    "commute",
    "fare",
  ],
  utilities: [
    "utilities",
    "electricity",
    "power",
    "nepa",
    "water",
    "internet",
    "data",
    "airtime",
    "phone",
    "cable",
    "tv",
    "dstv",
    "gotv",
  ],
  housing: [
    "rent",
    "housing",
    "accommodation",
    "apartment",
    "house",
    "landlord",
    "flat",
  ],
  entertainment: [
    "entertainment",
    "movies",
    "cinema",
    "games",
    "spotify",
    "netflix",
    "fun",
    "party",
    "outing",
    "hangout",
  ],
  shopping: [
    "shopping",
    "clothes",
    "shoes",
    "fashion",
    "accessories",
    "amazon",
    "jumia",
    "mall",
  ],
  health: [
    "health",
    "hospital",
    "doctor",
    "medicine",
    "drugs",
    "pharmacy",
    "gym",
    "fitness",
    "medical",
  ],
  education: [
    "education",
    "school",
    "books",
    "courses",
    "training",
    "tuition",
    "fees",
    "learning",
  ],
  savings: [
    "savings",
    "save",
    "saving",
    "invest",
    "investment",
    "emergency fund",
  ],
  other: ["other", "miscellaneous", "misc"],
};

/**
 * Parse a natural language financial amount
 * Examples: "₦120k", "about 50,000", "roughly 80k per month"
 */
export function parseAmount(text: string): {
  amount: number | null;
  confidence: ConfidenceLevel;
} {
  const lowerText = text.toLowerCase();

  // Determine confidence from modifiers
  let confidence: ConfidenceLevel = "medium";
  if (LOW_CONFIDENCE_WORDS.some((word) => lowerText.includes(word))) {
    confidence = "low";
  } else if (HIGH_CONFIDENCE_WORDS.some((word) => lowerText.includes(word))) {
    confidence = "high";
  }

  // Try each currency pattern
  for (const pattern of CURRENCY_PATTERNS) {
    const matches = [...text.matchAll(new RegExp(pattern))];
    if (matches.length > 0) {
      const match = matches[0];
      let amount = parseFloat(match[1].replace(/,/g, ""));
      const multiplier = match[2]?.toLowerCase();

      if (multiplier) {
        if (multiplier === "k" || multiplier === "thousand") {
          amount *= 1000;
        } else if (multiplier === "m" || multiplier === "million") {
          amount *= 1000000;
        }
      }

      if (!isNaN(amount) && amount > 0) {
        return { amount, confidence };
      }
    }
  }

  return { amount: null, confidence };
}

/**
 * Detect spending category from text
 */
export function detectCategory(text: string): SpendingCategory | null {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category as SpendingCategory;
      }
    }
  }

  return null;
}

/**
 * Parse complete financial input from natural language
 */
export function parseFinancialInput(text: string): ParsedInput {
  const lowerText = text.toLowerCase();
  const { amount, confidence } = parseAmount(text);
  const category = detectCategory(text);
  const hasModifier = LOW_CONFIDENCE_WORDS.some((word) =>
    lowerText.includes(word),
  );

  return {
    amount: amount ?? undefined,
    category: category ?? undefined,
    confidence,
    originalText: text,
    hasModifier,
  };
}

/**
 * Parse multiple amounts from a single message
 * Example: "I spend about 120k on food and 50k on transport"
 */
export function parseMultipleAmounts(text: string): ParsedInput[] {
  const results: ParsedInput[] = [];
  const lowerText = text.toLowerCase();

  // Split by common connectors
  const segments = text.split(/(?:,|\band\b|\balso\b|;)/i);

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (trimmed.length > 0) {
      const parsed = parseFinancialInput(trimmed);
      if (parsed.amount !== undefined || parsed.category !== undefined) {
        results.push(parsed);
      }
    }
  }

  // If no segments found, try parsing the whole text
  if (results.length === 0) {
    const parsed = parseFinancialInput(text);
    if (parsed.amount !== undefined) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Detect if user is talking about income
 */
export function isIncomeRelated(text: string): boolean {
  const incomeKeywords = [
    "income",
    "salary",
    "earn",
    "earning",
    "make",
    "making",
    "paid",
    "pay",
    "paycheck",
    "wage",
    "monthly",
    "per month",
  ];
  const lowerText = text.toLowerCase();
  return incomeKeywords.some((keyword) => lowerText.includes(keyword));
}

/**
 * Detect if user is talking about savings goals
 */
export function isGoalRelated(text: string): boolean {
  const goalKeywords = [
    "save",
    "saving",
    "goal",
    "target",
    "want to",
    "plan to",
    "hoping to",
    "trying to",
    "afford",
    "buy",
    "purchase",
  ];
  return goalKeywords.some((keyword) => text.toLowerCase().includes(keyword));
}

/**
 * Format amount for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}k`;
  }
  return `₦${amount.toLocaleString()}`;
}

/**
 * Get confidence label for display
 */
export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "high":
      return "Exact";
    case "medium":
      return "Estimate";
    case "low":
      return "Rough estimate";
  }
}
