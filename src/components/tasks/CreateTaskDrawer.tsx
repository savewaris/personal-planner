"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { ContextManagerModal } from "@/components/ui/modals";

interface CreateTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: string;
  initialDueDate?: string;
  initialProjectId?: string;
}

export const CreateTaskDrawer: React.FC<CreateTaskDrawerProps> = ({
  isOpen,
  onClose,
  initialStatus = "TODO",
  initialDueDate = "",
  initialProjectId = "",
}) => {
  const { activeContextId, contexts, projects, createTask } = usePlannerStore();

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState(initialStatus);
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newContextId, setNewContextId] = useState("");
  const [newProjectId, setNewProjectId] = useState(initialProjectId);
  const [newDueDate, setNewDueDate] = useState(initialDueDate);
  const [newTags, setNewTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);

  useEffect(() => {
    if (initialStatus) setNewStatus(initialStatus);
    if (initialDueDate) setNewDueDate(initialDueDate);
    if (initialProjectId) setNewProjectId(initialProjectId);
  }, [initialStatus, initialDueDate, initialProjectId]);

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
        projectId: newProjectId || undefined,
        dueDate: newDueDate || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      setNewTitle("");
      setNewDesc("");
      setNewDueDate("");
      setNewTags("");
      setNewProjectId("");
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="create-task-drawer-container" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer z-40"
            />

            {/* Slide-over Drawer on Right Side */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="relative z-50 w-full max-w-md bg-white border-l border-slate-200 flex flex-col justify-between shadow-2xl h-full max-h-screen overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-slate-50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Create New Task</h3>
                  <p className="text-xs text-slate-500 font-medium">Add task details and assign context/project</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <form onSubmit={handleCreateTask} id="create-task-drawer-form" className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Task Title *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Finish quarterly report"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                    <textarea
                      rows={3}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Add details or acceptance criteria..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500 resize-none shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-extrabold text-slate-700">Workspace Context *</label>
                        <button
                          type="button"
                          onClick={() => setIsContextManagerOpen(true)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          + Manage
                        </button>
                      </div>
                      <select
                        value={newContextId}
                        onChange={(e) => setNewContextId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      >
                        {contexts.map((ctx) => (
                          <option key={ctx.id} value={ctx.id}>
                            {ctx.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Link to Project (Optional)</label>
                      <select
                        value={newProjectId}
                        onChange={(e) => setNewProjectId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      >
                        <option value="">(No Project)</option>
                        {projects.map((proj) => (
                          <option key={proj.id} value={proj.id}>
                            📁 {proj.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Due Date (Optional)</label>
                      <input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        placeholder="urgent, dev"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Sticky Drawer Action Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-task-drawer-form"
                  disabled={isSubmitting}
                  className="btn-premium px-6 py-2.5 text-xs font-extrabold rounded-xl cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-500/20"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Context Manager Modal */}
      <ContextManagerModal
        isOpen={isContextManagerOpen}
        onClose={() => setIsContextManagerOpen(false)}
      />
    </>
  );
};
