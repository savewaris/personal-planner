"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";

interface CalendarQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSuccess?: (title: string) => void;
}

export const CalendarQuickAddModal: React.FC<CalendarQuickAddModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSuccess,
}) => {
  const { activeContextId, contexts, projects, createTask } = usePlannerStore();

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [contextId, setContextId] = useState("");
  const [status] = useState("TODO");
  const [priority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync context and reset form when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setProjectId("");
      setDescription("");
      setTags("");
      setShowFullDetails(false);

      if (activeContextId) {
        setContextId(activeContextId);
      } else if (contexts.length > 0) {
        setContextId(contexts[0].id);
      }
    }
  }, [isOpen, selectedDate, activeContextId, contexts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contextId) return;

    setIsSubmitting(true);
    try {
      const tagsArray = tags
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status: status,
        priority: priority,
        dueDate: selectedDate ? `${selectedDate}T00:00:00.000Z` : undefined,
        contextId: contextId,
        projectId: projectId || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      if (onSuccess) {
        onSuccess(title.trim());
      }
      onClose();
    } catch (err) {
      console.error("Failed to create task from calendar modal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Readable date label
  const formattedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : selectedDate;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        {/* Backdrop overlay click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
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
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">
                  Quick Add Task
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Scheduled for{" "}
                  <span className="font-semibold text-indigo-600">
                    {formattedDateLabel}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Task Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-900 placeholder-slate-400 bg-white"
              />
            </div>

            {/* Default Badges Row (Status: TODO, Priority: MEDIUM) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Status (Default)
                </label>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  To Do (TODO)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Priority (Default)
                </label>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Medium Priority
                </div>
              </div>
            </div>

            {/* Project Selection & Workspace Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Project Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-800 bg-white"
                >
                  <option value="">No Project (General)</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      📁 {proj.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workspace Context Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Workspace
                </label>
                <select
                  value={contextId}
                  onChange={(e) => setContextId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-800 bg-white"
                >
                  {contexts.map((ctx) => (
                    <option key={ctx.id} value={ctx.id}>
                      {ctx.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expand / Collapse Toggle for Extra Details */}
            <div>
              <button
                type="button"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>{showFullDetails ? "▼ Hide Extra Details" : "▶ Expand Extra Details (Description, Tags)"}</span>
              </button>

              {showFullDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-3"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add optional notes or acceptance criteria..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-normal text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. urgent, feature, meeting"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-normal text-slate-800 bg-white"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
              >
                {isSubmitting ? "Saving..." : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
