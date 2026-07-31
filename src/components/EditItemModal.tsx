"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NotionTagInput } from "./NotionTagInput";

export type EditItemType = "TASK" | "ROUTINE" | "HABIT";

export interface EditItemData {
  id: string;
  type: EditItemType;
  title: string;
  priority?: string;
  dayKey?: string;
  tags?: string[];
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemData: EditItemData | null;
  onSaveTask?: (id: string, updates: { title: string; priority?: string; tags?: string[] }) => Promise<void>;
  onSaveRoutine?: (id: string, updates: { title: string; dayKey: string; tags?: string[] }) => Promise<void>;
  onSaveHabit?: (id: string, updates: { name: string }) => Promise<void>;
  existingTags?: string[];
}

const ROUTINE_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN", "ALL"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  itemData,
  onSaveTask,
  onSaveRoutine,
  onSaveHabit,
  existingTags = [],
}) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dayKey, setDayKey] = useState("MON");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemData) {
      setTitle(itemData.title || "");
      setPriority(itemData.priority || "MEDIUM");
      setDayKey(itemData.dayKey || "MON");
      setTags(itemData.tags || []);
    }
  }, [itemData]);

  if (!isOpen || !itemData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (itemData.type === "TASK" && onSaveTask) {
        await onSaveTask(itemData.id, {
          title: title.trim(),
          priority,
          tags,
        });
      } else if (itemData.type === "ROUTINE" && onSaveRoutine) {
        await onSaveRoutine(itemData.id, {
          title: title.trim(),
          dayKey,
          tags,
        });
      } else if (itemData.type === "HABIT" && onSaveHabit) {
        await onSaveHabit(itemData.id, {
          name: title.trim(),
        });
      }
      onClose();
    } catch (err) {
      console.error("[EditItemModal] Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLabel =
    itemData.type === "TASK"
      ? "Task"
      : itemData.type === "ROUTINE"
      ? "Routine"
      : "Habit";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-zinc-950/95 border border-white/15 p-6 rounded-3xl shadow-2xl space-y-5 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                Edit {typeLabel} Details
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ✏️ Edit Mode
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title / Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                {typeLabel} Name / Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter ${typeLabel.toLowerCase()} title...`}
                className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400 transition-all"
                required
              />
            </div>

            {/* Task Priority Selector */}
            {itemData.type === "TASK" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Priority:
                </label>
                <div className="flex items-center gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        priority === p
                          ? p === "HIGH"
                            ? "bg-rose-500/30 text-rose-300 border-rose-500/50"
                            : p === "MEDIUM"
                            ? "bg-amber-500/30 text-amber-300 border-amber-500/50"
                            : "bg-emerald-500/30 text-emerald-300 border-emerald-500/50"
                          : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Routine Day Selector */}
            {itemData.type === "ROUTINE" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Target Day:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ROUTINE_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setDayKey(day)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        dayKey === day
                          ? "bg-indigo-500 text-white border-indigo-400 shadow-md"
                          : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notion Tag Selector for Task and Routine */}
            {(itemData.type === "TASK" || itemData.type === "ROUTINE") && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Tags:
                </label>
                <NotionTagInput
                  selectedTags={tags}
                  onChangeSelectedTags={setTags}
                  existingTags={existingTags}
                  placeholder="Type tag (e.g. Work, Health) & press Enter..."
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
