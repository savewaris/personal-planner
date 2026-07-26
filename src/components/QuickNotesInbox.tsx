"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { NoteItem } from "@/services/api";

export const QuickNotesInbox: React.FC = () => {
  const { notes, contexts, createNote, deleteNote, convertNoteToTask, convertNoteToHabit } = usePlannerStore();
  const [content, setContent] = useState("");
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);

  // Categorize Modal Form State
  const [categoryType, setCategoryType] = useState<"TASK" | "HABIT">("TASK");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskContextId, setTaskContextId] = useState("");
  const [taskPriority, setTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;
    const text = content.trim();
    setContent("");
    await createNote(text);
  };

  const openCategorizeModal = (note: NoteItem) => {
    setSelectedNote(note);
    setTaskTitle(note.content);
    setCategoryType("TASK");
    setTaskContextId(contexts[0]?.id || "ctx-personal");
    setTaskPriority("MEDIUM");
  };

  const handleCategorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !taskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      if (categoryType === "TASK") {
        await convertNoteToTask(selectedNote.id, {
          title: taskTitle.trim(),
          contextId: taskContextId || contexts[0]?.id || "ctx-personal",
          priority: taskPriority,
          status: "TODO",
        });
      } else {
        await convertNoteToHabit(selectedNote.id, taskTitle.trim());
      }
      setSelectedNote(null);
    } catch (err) {
      console.error("[QuickNotesInbox] Categorize failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-5 border border-white/10 rounded-2xl space-y-4 relative overflow-hidden h-full flex flex-col justify-between">
      {/* Background Decorative Shimmer */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              💡
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Quick Notes
                {notes.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {notes.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">Jot thoughts & categorize later</p>
            </div>
          </div>
        </div>

        {/* Quick Input Bar */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Jot down quick thought..."
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/60 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!content.trim()}
            className="btn-premium px-3 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
          >
            + Note
          </motion.button>
        </form>

        {/* Uncategorized Notes List (Vertical Stack for Far Right Column) */}
        {notes.length === 0 ? (
          <div className="py-6 text-center border border-white/10 hover:border-indigo-500/30 bg-white/5 rounded-xl transition-all">
            <p className="text-xs text-zinc-500">Inbox empty! All notes organized.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {notes.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 space-y-2 flex flex-col justify-between transition-all group"
              >
                <p className="text-xs text-zinc-200 leading-relaxed font-medium line-clamp-3">
                  {n.content}
                </p>

                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                  <button
                    type="button"
                    onClick={() => openCategorizeModal(n)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-all cursor-pointer flex items-center gap-1"
                  >
                    ⚡ Categorize
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteNote(n.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer rounded"
                    title="Delete note"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Categorize Quick Action Modal Overlay */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-md glass-card p-6 border border-white/15 rounded-2xl space-y-5 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  ⚡ Categorize Quick Note
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Conversion Type Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setCategoryType("TASK")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    categoryType === "TASK"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  📌 Convert to Task
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryType("HABIT")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    categoryType === "HABIT"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  🔄 Convert to Habit
                </button>
              </div>

              <form onSubmit={handleCategorizeSubmit} className="space-y-4">
                {/* Title Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {categoryType === "TASK" ? "Task Title" : "Habit Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {categoryType === "TASK" && (
                  <>
                    {/* Context Picker */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300">Workspace Context</label>
                      <select
                        value={taskContextId}
                        onChange={(e) => setTaskContextId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                      >
                        {contexts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300">Priority</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTaskPriority(p)}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              taskPriority === p
                                ? p === "HIGH"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                  : p === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                : "bg-zinc-900 border-white/10 text-zinc-400"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedNote(null)}
                    className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !taskTitle.trim()}
                    className="flex-1 btn-premium py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Converting..." : "Confirm Categorization"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
