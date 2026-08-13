"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { useKeyboardShortcut } from "@/hooks";

interface QuickBrainDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickBrainDumpModal: React.FC<QuickBrainDumpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createNote } = usePlannerStore();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createNote(content.trim());
      setContent("");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      onClose();
    } catch (err) {
      console.error("Failed to save idea note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                    💡
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Dump an Idea</h3>
                    <p className="text-[11px] text-slate-500">Unclassified note — triage anytime from Idea Inbox</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind right now? Hit Enter..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-500">Enter</kbd> to save
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!content.trim() || isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {isSubmitting ? "Saving..." : "Save to Inbox"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
