import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FinancialProvider } from "@/contexts/FinancialContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinResolve AI - Your Financial Coach",
  description: "Chat-first AI financial health app helping your budget better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.variable,
          "antialiased min-h-screen font-sans bg-background text-foreground",
        )}
      >
        <FinancialProvider>{children}</FinancialProvider>
      </body>
    </html>
  );
}
