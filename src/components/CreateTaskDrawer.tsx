"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";

interface CreateTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: string;
  initialDueDate?: string;
}

export const CreateTaskDrawer: React.FC<CreateTaskDrawerProps> = ({
  isOpen,
  onClose,
  initialStatus = "TODO",
  initialDueDate = "",
}) => {
  const { activeContextId, contexts, createTask } = usePlannerStore();

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState(initialStatus);
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newContextId, setNewContextId] = useState("");
  const [newDueDate, setNewDueDate] = useState(initialDueDate);
  const [newTags, setNewTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialStatus) setNewStatus(initialStatus);
    if (initialDueDate) setNewDueDate(initialDueDate);
  }, [initialStatus, initialDueDate]);

  useEffect(() => {
    if (activeContextId) {
      setNewContextId(activeContextId);
    } else if (contexts.length > 0) {
      setNewContextId(contexts[0].id);
    }
  }, [activeContextId, contexts]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContextId) return;

    setIsSubmitting(true);
    try {
      const tagsArray = newTags
        ? newTags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await createTask({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        status: newStatus,
        priority: newPriority,
        contextId: newContextId,
        dueDate: newDueDate || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      setNewTitle("");
      setNewDesc("");
      setNewDueDate("");
      setNewTags("");
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
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
                  <h3 className="text-lg font-bold text-white">Create New Task</h3>
                  <p className="text-xs text-zinc-400">Add task details and assign to workspace</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask} id="create-task-drawer-form" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Finish quarterly report"
                    className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Add details or acceptance criteria..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Workspace Context *</label>
                    <select
                      value={newContextId}
                      onChange={(e) => setNewContextId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {contexts.map((ctx) => (
                        <option key={ctx.id} value={ctx.id}>
                          {ctx.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="urgent, dev"
                      className="w-full px-3.5 py-2 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
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
                form="create-task-drawer-form"
                disabled={isSubmitting}
                className="btn-premium px-6 py-2.5 text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
