"use client";

import { useRef, useEffect } from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type Role } from "./ChatMessage";
import { SuggestedQuestions } from "./SuggestedQuestions";

export interface Message {
  id: string;
  role: Role;
  content: string;
  confidence?: "high" | "medium" | "low";
  assumptions?: string[];
}

interface ChatPanelProps {
  messages: Message[];
  isTyping: boolean;
  onSend: (message: string) => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Where is my money going?",
  "Can I afford a large purchase?",
  "How much can I save this month?",
];

export function ChatPanel({
  messages,
  isTyping,
  onSend,
  suggestions = DEFAULT_SUGGESTIONS,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-slate-800">AI Coach</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Your Financial Coach
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ask me anything about your finances
            </p>
            <div className="flex flex-col gap-2 w-full">
              {suggestions.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSend(q)}
                  className="text-xs text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-slate-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessage role={msg.role} content={msg.content} />
                {msg.assumptions && msg.assumptions.length > 0 && (
                  <div className="ml-10 mt-1 text-xs text-slate-400 italic">
                    Note: {msg.assumptions.join(", ")}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 p-3">
                <div className="flex bg-primary/10 w-6 h-6 rounded-full items-center justify-center">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-primary/60 rounded-full animate-bounce" />
                    <span
                      className="w-1 h-1 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <span
                      className="w-1 h-1 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-500">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggestions (when there are messages) */}
      {messages.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 bg-white">
          <SuggestedQuestions questions={suggestions} onSelect={onSend} />
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <ChatInput onSend={onSend} disabled={isTyping} />
      </div>
    </div>
  );
}
