"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { NoteItem } from "@/types";

export const QuickNotesInbox: React.FC = () => {
  const {
    notes,
    contexts,
    createNote,
    deleteNote,
    convertNoteToTask,
    convertNoteToHabit,
    convertNoteToProject,
    convertNoteToSop,
  } = usePlannerStore();

  const [content, setContent] = useState("");
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);

  // 4-Way Categorize Modal Form State
  const [categoryType, setCategoryType] = useState<"TASK" | "HABIT" | "PROJECT" | "SOP">("TASK");
  const [title, setTitle] = useState("");
  const [contextId, setContextId] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [description, setDescription] = useState("");
  const [sopCategory, setSopCategory] = useState("General");
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
    setTitle(note.content);
    setCategoryType("TASK");
    setContextId(contexts[0]?.id || "ctx-personal");
    setPriority("MEDIUM");
    setDescription("");
    setSopCategory("General");
  };

  const handleCategorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !title.trim()) return;

    setIsSubmitting(true);
    try {
      if (categoryType === "TASK") {
        await convertNoteToTask(selectedNote.id, {
          title: title.trim(),
          contextId: contextId || contexts[0]?.id || "ctx-personal",
          priority,
          status: "TODO",
          description: description || undefined,
        });
      } else if (categoryType === "HABIT") {
        await convertNoteToHabit(selectedNote.id, title.trim());
      } else if (categoryType === "PROJECT") {
        await convertNoteToProject(selectedNote.id, {
          title: title.trim(),
          description: description || "Project converted from idea note",
        });
      } else if (categoryType === "SOP") {
        await convertNoteToSop(selectedNote.id, {
          title: title.trim(),
          category: sopCategory,
          description: description || undefined,
        });
      }
      setSelectedNote(null);
    } catch (err) {
      console.error("[QuickNotesInbox] Categorize failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-6 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-base font-bold shadow-xs">
              💡
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Idea Inbox
                {notes.length > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {notes.length} unclassified
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Spontaneous thoughts waiting to be triaged</p>
            </div>
          </div>
        </div>

        {/* Quick Input Bar */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dump an idea... Press Enter"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!content.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Add
          </motion.button>
        </form>

        {/* Unclassified Notes List */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-lg">
                ✨
              </div>
              <p className="text-xs font-bold text-slate-600">Your Inbox is completely clean!</p>
              <p className="text-[11px] text-slate-400 mt-1">Dump any spontaneous thought above or press <kbd className="px-1 py-0.5 rounded bg-slate-200 text-[10px] text-slate-600 font-mono">⌘I</kbd></p>
            </div>
          ) : (
            notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-start justify-between gap-3 group"
              >
                <p className="text-xs font-semibold text-slate-800 leading-relaxed flex-1 whitespace-pre-wrap">
                  {note.content}
                </p>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCategorizeModal(note)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>⚡ Triage</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete Note"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 4-Way Triage Modal */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>⚡ Triage Idea</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCategorizeSubmit} className="p-6 space-y-4">
                {/* Type Selection Grid */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {(["TASK", "HABIT", "PROJECT", "SOP"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCategoryType(type)}
                      className={`py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                        categoryType === type
                          ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {type === "TASK" && "📋 Task"}
                      {type === "HABIT" && "🔥 Habit"}
                      {type === "PROJECT" && "📁 Project"}
                      {type === "SOP" && "📖 SOP"}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {categoryType === "TASK" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Context</label>
                        <select
                          value={contextId}
                          onChange={(e) => setContextId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
                        >
                          {contexts.map((ctx) => (
                            <option key={ctx.id} value={ctx.id}>
                              {ctx.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {categoryType === "SOP" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SOP Category</label>
                    <select
                      value={sopCategory}
                      onChange={(e) => setSopCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
                    >
                      <option value="General">General</option>
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedNote(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    {isSubmitting ? "Converting..." : `Convert to ${categoryType}`}
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
