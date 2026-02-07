"use server";

import { openai, OPENAI_MODEL_NAME } from "@/lib/openaiClient";
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
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file uploaded" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();

    const textContent = data.text;

    // Use AI to structure the text into transactions
    // We'll process the first 15000 tokens of text to avoid context limits.
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

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL_NAME,
      messages: [{ role: "system", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) throw new Error("No response from AI parser");

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

    return { success: true, transactions };
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
