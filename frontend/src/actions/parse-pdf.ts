"use server";

import { getOpenAIClient, OPENAI_MODEL_NAME } from "@/lib/openaiClient";
import { type UploadedTransaction } from "@/lib/types";
// @ts-ignore
import { PDFParse } from "pdf-parse";

export type PDFParseResult = {
  success: boolean;
  transactions?: UploadedTransaction[];
  error?: string;
};

// Polyfill for PDF.js in Node environment (required by pdf-parse)
// @ts-ignore
if (typeof DOMMatrix === "undefined") {
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    constructor() {}
  };
}

export async function parsePDFStatement(
  formData: FormData,
): Promise<PDFParseResult> {
  // 1. Initial Logging for Deployment Debugging
  console.log("[parsePDFStatement] Starting PDF parse server action...");
  console.log(
    "[parsePDFStatement] OPENAI_API_KEY present:",
    !!process.env.OPENAI_API_KEY,
  );

  const file = formData.get("file") as File;

  if (!file) {
    console.error("[parsePDFStatement] No file found in FormData");
    return { success: false, error: "No file uploaded" };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  console.log(
    `[parsePDFStatement] File received: ${file.name} (${fileSizeMB.toFixed(2)} MB)`,
  );

  // Platforms like Vercel have a 4.5MB payload limit for serverless functions
  if (file.size > 4.5 * 1024 * 1024) {
    return {
      success: false,
      error: `File too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed is 4.5MB for serverless processing.`,
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Robust Library Initialization
    console.log("[parsePDFStatement] Initializing PDFParse instance...");
    if (!PDFParse) {
      throw new Error(
        "PDFParse library failed to load. This might be a dependency bundling issue in production.",
      );
    }

    const parser = new PDFParse({ data: buffer });

    console.log("[parsePDFStatement] Extracting text...");
    const data = await parser.getText();

    console.log("[parsePDFStatement] Destroying parser...");
    await parser.destroy();

    const textContent = data.text;
    if (!textContent || textContent.trim().length === 0) {
      console.warn("[parsePDFStatement] No text extracted from PDF");
      return {
        success: false,
        error:
          "No text could be extracted from this PDF. It might be an image-only scan, encrypted, or corrupted.",
      };
    }

    console.log(
      `[parsePDFStatement] Extracted ${textContent.length} characters of text`,
    );

    // 3. AI Extraction
    // We'll process the first 15000 chars of text to avoid context limits.
    const truncatedText = textContent.slice(0, 15000);

    const prompt = `
    You are a financial data parser. Extract bank transactions from the following raw PDF text.
    
    Raw Text:
    """
    ${truncatedText}
    """

    Current Year: ${new Date().getFullYear()}
    Current Date: ${new Date().toISOString().split("T")[0]}

    Instructions:
    1. Identify the transaction table or list.
    2. Extract Date, Description, Amount, and Type (Credit/Debit or Income/Expense).
    3. IMPORTANT FOR DATES: 
       - Bank statements often omit the year on individual lines. Look at the entire text to find the statement period or year.
       - Ensure the "date" field in your output corresponds to the ACTUAL transaction date from the statement.
       - If the month is late in the year (e.g., December) and the current date is early (e.g., February), be careful to use the correct previous year if applicable.
       - Output dates ALWAYS in YYYY-MM-DD format.
    4. Ignore header info (address, account summary) and footer info.
    5. For Amount: Ensure it is a positive number.
    6. For Type: Determine if money left the account (debit) or entered (credit).
    7. Return a JSON object with a key "transactions" containing an array of objects.
    
    Output Format (JSON):
    {
      "transactions": [
        {
          "date": "YYYY-MM-DD",
          "description": "string (raw description)",
          "amount": 123.45,
          "type": "credit" | "debit" 
        }
      ]
    }
    `;

    console.log("[parsePDFStatement] Calling OpenAI...");
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL_NAME,
      messages: [{ role: "system", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      console.error("[parsePDFStatement] Empty response from OpenAI");
      throw new Error("No response from AI parser");
    }

    const parsed = JSON.parse(responseContent);
    const rawTransactions = parsed.transactions || [];

    // Map to UploadedTransaction format
    const transactions = rawTransactions.map(
      (t: {
        date: string;
        description: string;
        amount: number;
        type: string;
      }) => ({
        id: crypto.randomUUID(),
        date: t.date,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        confirmed: false,
      }),
    );

    console.log(
      `[parsePDFStatement] Successfully parsed ${transactions.length} transactions`,
    );
    return { success: true, transactions };
  } catch (error: any) {
    // Log the full error to server console for debugging
    console.error("[parsePDFStatement] CRITICAL ERROR DETAILS:", error);

    // Check for specific common deployment errors to provide better user feedback
    let errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("canvas")) {
      errorMessage =
        "PDF library dependency error (canvas binary missing in production). Try uploading a CSV or a different PDF format.";
    } else if (
      errorMessage.includes("401") ||
      errorMessage.includes("API key")
    ) {
      errorMessage =
        "Server configuration error: OpenAI API key is missing or invalid in production.";
    } else if (errorMessage.includes("timeout")) {
      errorMessage = "Extraction took too long. Try a smaller PDF file.";
    }

    return {
      success: false,
      error: errorMessage.startsWith("PDF Parsing error")
        ? errorMessage
        : `PDF Parsing error: ${errorMessage}`,
    };
  }
}
