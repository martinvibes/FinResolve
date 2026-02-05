import { type UploadedTransaction, type SpendingCategory } from "./types";

// ========================================
// Bank Statement Parser (CSV/PDF)
// ========================================

/**
 * Parse CSV bank statement
 * Assumes common bank statement CSV formats
 */
export async function parseCSV(file: File): Promise<UploadedTransaction[]> {
  const text = await file.text();
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV file appears to be empty");
  }

  // Detect header row and column positions
  const columns = parseCSVLine(lines[0]);

  // Find column indices
  const dateIdx = findColumnIndex(columns, [
    "date",
    "transaction date",
    "trans date",
    "posted",
  ]);
  const descIdx = findColumnIndex(columns, [
    "description",
    "details",
    "narrative",
    "memo",
    "particulars",
  ]);
  const amountIdx = findColumnIndex(columns, ["amount", "value", "sum"]);
  const debitIdx = findColumnIndex(columns, ["debit", "withdrawal", "dr"]);
  const creditIdx = findColumnIndex(columns, ["credit", "deposit", "cr"]);

  if (dateIdx === -1 || descIdx === -1) {
    throw new Error("Could not detect required columns (date, description)");
  }

  const transactions: UploadedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 3) continue;

    const date = cols[dateIdx]?.trim() || "";
    const description = cols[descIdx]?.trim() || "";

    let amount = 0;
    let type: "credit" | "debit" = "debit";

    if (amountIdx !== -1) {
      amount = parseAmount(cols[amountIdx]);
      type = amount >= 0 ? "credit" : "debit";
      amount = Math.abs(amount);
    } else if (debitIdx !== -1 && creditIdx !== -1) {
      const debit = parseAmount(cols[debitIdx]);
      const credit = parseAmount(cols[creditIdx]);
      if (debit > 0) {
        amount = debit;
        type = "debit";
      } else if (credit > 0) {
        amount = credit;
        type = "credit";
      }
    }

    if (amount > 0 && description) {
      transactions.push({
        id: crypto.randomUUID(),
        date: normalizeDate(date),
        description,
        amount,
        type,
        suggestedCategory: categorizeTransaction(description),
        confirmed: false,
      });
    }
  }

  return transactions;
}

/**
 * Parse PDF bank statement (basic text extraction)
 * Note: Real PDF parsing would require a library like pdf.js
 */
export async function parsePDF(_file: File): Promise<UploadedTransaction[]> {
  // For MVP, we'll extract text and try to parse it
  // In production, you'd use pdf.js or similar

  // Placeholder - would need pdf.js in production
  throw new Error(
    "PDF parsing requires additional setup. Please use CSV export from your bank for now.",
  );
}

// Helper functions

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function findColumnIndex(columns: string[], candidates: string[]): number {
  const lowerColumns = columns.map((c) => c.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = lowerColumns.findIndex((c) => c.includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseAmount(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, spaces, and parse
  const cleaned = value.replace(/[₦$,\s]/g, "").replace(/[()]/g, "-");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeDate(dateStr: string): string {
  // Try to parse various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return dateStr;
}

// Category detection keywords
const CATEGORY_KEYWORDS: Record<SpendingCategory, string[]> = {
  food: [
    "restaurant",
    "food",
    "eat",
    "lunch",
    "dinner",
    "breakfast",
    "cafe",
    "coffee",
    "chicken republic",
    "kilimanjaro",
    "dominos",
    "pizza",
    "shawarma",
    "suya",
    "shoprite",
    "spar",
    "market",
    "grocery",
  ],
  transport: [
    "uber",
    "bolt",
    "taxi",
    "fuel",
    "petrol",
    "filling station",
    "oando",
    "total",
    "mobil",
    "bus",
    "danfo",
    "brt",
    "transport",
    "fare",
  ],
  utilities: [
    "mtn",
    "glo",
    "airtel",
    "9mobile",
    "data",
    "internet",
    "dstv",
    "gotv",
    "startimes",
    "nepa",
    "phcn",
    "electricity",
    "water",
    "bill",
  ],
  housing: ["rent", "landlord", "agent", "accommodation", "apartment"],
  entertainment: [
    "netflix",
    "spotify",
    "cinema",
    "filmhouse",
    "genesis",
    "game",
    "bet",
    "sportybet",
    "1xbet",
    "betway",
  ],
  shopping: [
    "amazon",
    "jumia",
    "konga",
    "aliexpress",
    "fashion",
    "clothes",
    "shoes",
    "zara",
    "h&m",
    "primark",
  ],
  health: [
    "hospital",
    "clinic",
    "pharmacy",
    "doctor",
    "medical",
    "health",
    "drug",
    "lab",
    "test",
    "gym",
    "fitness",
  ],
  education: [
    "school",
    "tuition",
    "fee",
    "course",
    "udemy",
    "coursera",
    "book",
    "learning",
  ],
  savings: ["savings", "piggyvest", "cowrywise", "kuda save"],
  data_airtime: [
    "mtn",
    "glo",
    "airtel",
    "9mobile",
    "data",
    "airtime",
    "recharge",
  ],
  family: ["family", "school fees", "kids", "children", "parents"],
  debt: ["loan", "debt", "credit", "repayment", "owed"],
  personal_care: ["salon", "barber", "haircut", "spa", "makeup", "cosmetics"],
  investment: [
    "investment",
    "stocks",
    "shares",
    "crypto",
    "bitcoin",
    "bonds",
    "risevest",
    "bamboo",
  ],
  tax: ["tax", "firs", "vat", "withholding"],
  salary: ["salary", "wage", "payroll"],
  business: ["business", "invoice", "client", "freelance", "contract"],
  gift: ["gift", "donation", "charity", "tithe", "offering"],
  other: [],
};

function categorizeTransaction(description: string): SpendingCategory {
  const lower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "other") continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category as SpendingCategory;
      }
    }
  }

  return "other";
}

/**
 * Calculate summary statistics from transactions
 */
export function calculateTransactionSummary(
  transactions: UploadedTransaction[],
) {
  const debits = transactions.filter((t) => t.type === "debit");
  const credits = transactions.filter((t) => t.type === "credit");

  const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);

  const dates = transactions
    .map((t) => new Date(t.date).getTime())
    .filter((d) => !isNaN(d));
  const minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
  const maxDate = dates.length ? new Date(Math.max(...dates)) : new Date();

  return {
    totalDebits,
    totalCredits,
    transactionCount: transactions.length,
    dateRange: {
      start: minDate.toISOString().split("T")[0],
      end: maxDate.toISOString().split("T")[0],
    },
  };
}
