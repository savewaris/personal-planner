"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem } from "./TaskCard";
import { usePlannerStore } from "@/context/PlannerStoreContext";

interface TaskDetailModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
  onDeleteTask,
}) => {
  const { projects, updateTask } = usePlannerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description || "");
      setEditStatus(task.status);
      setEditPriority(task.priority);
      setEditProjectId(task.projectId || "");
      setIsEditing(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const project = projects.find((p) => p.id === task.projectId);

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        status: editStatus,
        priority: editPriority,
        projectId: editProjectId || null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      onDeleteTask(task.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  task.priority === "HIGH"
                    ? "bg-rose-500"
                    : task.priority === "MEDIUM"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Task Details
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                {isEditing ? "Cancel Edit" : "Edit Task"}
              </button>
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Project
                </label>
                <select
                  value={editProjectId}
                  onChange={(e) => setEditProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                >
                  <option value="">No Project (General)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
                {task.description && (
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">STATUS</span>
                  <span className="font-bold text-slate-800">{task.status}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">PRIORITY</span>
                  <span
                    className={`font-bold ${
                      task.priority === "HIGH"
                        ? "text-rose-600"
                        : task.priority === "MEDIUM"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">PROJECT</span>
                  <span className="font-bold text-slate-800">
                    {project ? project.title : "General (No Project)"}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">DUE DATE</span>
                  <span className="font-bold text-slate-800">
                    {task.dueDate ? task.dueDate.split("T")[0] : "None"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  Delete Task
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
                    onStatusChange(task.id, nextStatus);
                    onClose();
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    task.status === "DONE"
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {task.status === "DONE" ? "Mark as TODO" : "Mark Complete"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
