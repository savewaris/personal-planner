"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { TaskItem } from "@/types";
import { getTagColorClasses } from "@/components/ui/inputs";
import { ContextManagerModal } from "@/components/ui/modals";

interface EditTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
}

export const EditTaskDrawer: React.FC<EditTaskDrawerProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const { contexts, projects, updateTask, deleteTask } = usePlannerStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [contextId, setContextId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);

  // Synchronize state whenever a task is selected
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "TODO");
      setPriority(task.priority || "MEDIUM");
      setContextId(task.contextId || (contexts[0]?.id || ""));
      setProjectId(task.projectId || "");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      
      // Parse tags
      if (Array.isArray(task.tags)) {
        setTags(task.tags);
      } else if (typeof task.tags === "string") {
        try {
          const parsed = JSON.parse(task.tags);
          setTags(Array.isArray(parsed) ? parsed : task.tags.split(",").map((t) => t.trim()).filter(Boolean));
        } catch {
          setTags(task.tags.split(",").map((t) => t.trim()).filter(Boolean));
        }
      } else {
        setTags([]);
      }
      setShowDeleteConfirm(false);
    }
  }, [task, contexts]);

  if (!task) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleDateShortcut = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setDueDate(d.toISOString().split("T")[0]);
  };

  const handleEndOfMonthShortcut = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDueDate(endOfMonth.toISOString().split("T")[0]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !task) return;

    setIsSubmitting(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        contextId: contextId || undefined,
        projectId: projectId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        tags: tags.length > 0 ? tags : [],
        completed: status === "DONE",
      });
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="edit-task-drawer-container" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer z-40"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative z-50 w-full max-w-lg border-l flex flex-col justify-between shadow-2xl h-full max-h-screen overflow-hidden"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-subtle)",
                color: "var(--foreground)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-5 border-b shrink-0"
                style={{
                  backgroundColor: "var(--surface-subtle)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                    ✏️
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">Edit Task Details</h3>
                    <p className="text-xs opacity-60">Update properties, horizon, context, or project</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl transition-all cursor-pointer text-xs font-bold opacity-60 hover:opacity-100 hover:bg-indigo-500/10"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form onSubmit={handleSave} id="edit-task-drawer-form" className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5 opacity-80">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Finish quarterly project roadmap"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-indigo-500 shadow-xs transition-all"
                      style={{
                        backgroundColor: "var(--surface-subtle)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  {/* Description / Rich Notes */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5 opacity-80">
                      Description & Notes
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add background context, checklists, or links..."
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 resize-none shadow-xs transition-all leading-relaxed"
                      style={{
                        backgroundColor: "var(--surface-subtle)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  {/* Status & Priority Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 opacity-80">
                        Workflow Status
                      </label>
                      <div
                        className="flex items-center gap-1 p-1 rounded-xl border"
                        style={{
                          backgroundColor: "var(--surface-subtle)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        {(["TODO", "IN_PROGRESS", "DONE"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatus(st)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                              status === st
                                ? "bg-indigo-500 text-white shadow-xs"
                                : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            {st === "TODO" ? "To Do" : st === "IN_PROGRESS" ? "In Prog" : "Done"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 opacity-80">
                        Priority Level
                      </label>
                      <div
                        className="flex items-center gap-1 p-1 rounded-xl border"
                        style={{
                          backgroundColor: "var(--surface-subtle)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => {
                          const isSelected = priority === p;
                          const activeClass = {
                            LOW: "bg-emerald-500 text-white",
                            MEDIUM: "bg-amber-500 text-white",
                            HIGH: "bg-orange-500 text-white",
                            URGENT: "bg-rose-500 text-white animate-pulse",
                          }[p];

                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                                isSelected ? activeClass : "opacity-60 hover:opacity-100"
                              }`}
                            >
                              {p === "URGENT" ? "🔥" : p[0] + p.slice(1).toLowerCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Quick Shortcuts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold opacity-80">
                        Due Date & Horizon
                      </label>
                      {dueDate && (
                        <button
                          type="button"
                          onClick={() => setDueDate("")}
                          className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                        >
                          Clear Date
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                      style={{
                        backgroundColor: "var(--surface-subtle)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--foreground)",
                      }}
                    />

                    {/* Quick Horizon Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => handleDateShortcut(0)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        🔥 Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateShortcut(1)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-indigo-500/10 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer"
                      >
                        ⚡ Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateShortcut(7)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500/20 transition-all cursor-pointer"
                      >
                        📅 In 7 Days
                      </button>
                      <button
                        type="button"
                        onClick={handleEndOfMonthShortcut}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20 transition-all cursor-pointer"
                      >
                        🗓️ End of Month
                      </button>
                    </div>
                  </div>

                  {/* Context & Project Assignment Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Workspace Context */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold opacity-80">
                          Workspace Context
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsContextManagerOpen(true)}
                          className="text-[10px] font-bold text-indigo-500 hover:underline cursor-pointer"
                        >
                          + Manage
                        </button>
                      </div>
                      <select
                        value={contextId}
                        onChange={(e) => setContextId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                        style={{
                          backgroundColor: "var(--surface-subtle)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--foreground)",
                        }}
                      >
                        {contexts.map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Project Association */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 opacity-80">
                        Project Association
                      </label>
                      <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                        style={{
                          backgroundColor: "var(--surface-subtle)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="">(No Project / Standalone)</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            📁 {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags Management */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold opacity-80">
                      Tags & Categories
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Type tag and press Add..."
                        className="flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                        style={{
                          backgroundColor: "var(--surface-subtle)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--foreground)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all cursor-pointer shrink-0"
                      >
                        + Add Tag
                      </button>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${getTagColorClasses(tag, false)}`}
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-xs hover:opacity-100 opacity-60 cursor-pointer ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Danger Zone: Delete Confirmation */}
                  <div
                    className="p-4 rounded-xl border mt-6 space-y-3"
                    style={{
                      backgroundColor: "var(--surface-subtle)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-rose-500">Danger Zone</h4>
                        <p className="text-[11px] opacity-60">Permanently delete this task and associated activity</p>
                      </div>
                      {!showDeleteConfirm ? (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/15 transition-all cursor-pointer"
                        >
                          Delete Task
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-3 py-1.5 text-xs font-black rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Action Footer */}
              <div
                className="p-5 border-t flex items-center justify-end gap-3 shrink-0"
                style={{
                  backgroundColor: "var(--surface-subtle)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border opacity-70 hover:opacity-100 transition-all cursor-pointer"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  form="edit-task-drawer-form"
                  disabled={isSubmitting}
                  className="btn-premium flex items-center gap-2 text-xs font-black px-5 py-2.5 cursor-pointer shadow-md disabled:opacity-50 min-h-[36px]"
                >
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContextManagerModal
        isOpen={isContextManagerOpen}
        onClose={() => setIsContextManagerOpen(false)}
      />
    </>
  );
};
