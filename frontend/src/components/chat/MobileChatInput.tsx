"use client";

import { useState } from "react";
import { MessageSquare, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileChatInputProps {
  onSend: (message: string) => void;
  onOpenDrawer: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MobileChatInput({
  onSend,
  onOpenDrawer,
  disabled,
  placeholder = "Ask your AI coach...",
}: MobileChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-safe lg:hidden z-30">
      <div
        className={cn(
          "flex items-center gap-2 bg-slate-50 rounded-2xl border transition-all",
          isFocused ? "border-primary ring-2 ring-primary/20" : "border-slate-200"
        )}
      >
        <button
          onClick={onOpenDrawer}
          className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-colors"
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent py-3 text-sm placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className={cn(
            "p-3 rounded-xl transition-all mr-1",
            input.trim()
              ? "text-primary hover:bg-primary/10"
              : "text-slate-300"
          )}
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
