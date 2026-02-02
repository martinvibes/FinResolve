"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ChatPanel, type Message } from "./ChatPanel";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isTyping: boolean;
  onSend: (message: string) => void;
  suggestions?: string[];
}

export function ChatDrawer({
  isOpen,
  onClose,
  messages,
  isTyping,
  onSend,
  suggestions,
}: ChatDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-md bg-white z-50 lg:hidden shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>

            <ChatPanel
              messages={messages}
              isTyping={isTyping}
              onSend={(msg) => {
                onSend(msg);
              }}
              suggestions={suggestions}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
