"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { NotionTagInput } from "@/components/ui/inputs";

interface ChatTaskInputProps {
  onAddTask: (title: string, tags?: string[]) => Promise<void>;
  existingTags?: string[];
  isLoading?: boolean;
}

/**
 * Chat-Style Bottom Input Bar with Notion-Style Tag Selector
 *
 * Fixed at the bottom of the screen (iMessage / ChatGPT style).
 * Dedicated Notion-style tag input next to the task input box.
 */
export const ChatTaskInput: React.FC<ChatTaskInputProps> = ({
  onAddTask,
  existingTags = [],
  isLoading = false,
}) => {
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on page mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask(trimmed, selectedTags.length > 0 ? selectedTags : undefined);
      setText("");
      setSelectedTags([]);
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-xl border-t border-white/10 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Dedicated Notion-Style Tag Selector */}
          <NotionTagInput
            selectedTags={selectedTags}
            onChangeSelectedTags={setSelectedTags}
            existingTags={existingTags}
          />

          {/* Main Task Title Input */}
          <div className="relative flex-1 flex items-center min-w-0">
            <div className="absolute left-4 text-indigo-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || isLoading}
              placeholder="Type a task and press Enter..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 text-sm font-medium focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner disabled:opacity-50 min-h-[46px]"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!text.trim() || isSubmitting || isLoading}
            className="shrink-0 h-[46px] w-[46px] sm:w-[46px] rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all self-end sm:self-auto"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};
