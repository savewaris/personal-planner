"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";

interface CreateHabitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateHabitDrawer: React.FC<CreateHabitDrawerProps> = ({ isOpen, onClose }) => {
  const { createHabit } = usePlannerStore();

  const [newHabitName, setNewHabitName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    setIsSubmitting(true);
    try {
      await createHabit(newHabitName.trim());
      setNewHabitName("");
      onClose();
    } catch (err) {
      console.error("Failed to create habit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* 40% Translucent Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide-over Drawer on Right Side */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-zinc-900/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white">Create New Habit</h3>
                  <p className="text-xs text-zinc-400">Add a daily routine to build consistency</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateHabit} id="create-habit-drawer-form" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Habit Name *</label>
                  <input
                    type="text"
                    required
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g. Read 20 mins, Workout, Drink Water"
                    className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </form>
            </div>

            {/* Drawer Footer Buttons */}
            <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-habit-drawer-form"
                disabled={isSubmitting}
                className="btn-premium px-6 py-2.5 text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Habit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
