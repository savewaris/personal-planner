"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem } from "./TaskCard";
import { NotionTagInput, getTagColorStyle } from "./NotionTagInput";

interface QuickTaskFeedProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string, currentStatus: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask?: (title: string, tags?: string[]) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: { title: string; priority?: string; tags?: string[] }) => Promise<void>;
  isLoading?: boolean;
  existingTags?: string[];
}

type FilterTab = "ALL" | "ACTIVE" | "COMPLETED";

// Helper to safely parse tags from task object
const parseTaskTags = (tagsField?: string | string[] | null): string[] => {
  if (!tagsField) return [];
  if (Array.isArray(tagsField)) return tagsField;
  try {
    const parsed = JSON.parse(tagsField);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof tagsField === "string"
      ? tagsField.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  }
};

export const QuickTaskFeed: React.FC<QuickTaskFeedProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onUpdateTask,
  isLoading = false,
  existingTags = [],
}) => {
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Inline Add Task Input State
  const [inputText, setInputText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct Inline Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  // Compute all unique tags across current tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      parseTaskTags(t.tags).forEach((tag) => tagSet.add(tag.toLowerCase()));
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Computed Task Counts for current view
  const activeTasksCount = useMemo(
    () => tasks.filter((t) => t.status !== "DONE" && !t.completed).length,
    [tasks]
  );
  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.status === "DONE" || t.completed).length,
    [tasks]
  );

  // Filtered Task List based on active tab & tag filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isDone = t.status === "DONE" || t.completed;

      // Status tab filter
      if (filter === "ACTIVE" && isDone) return false;
      if (filter === "COMPLETED" && !isDone) return false;

      // Tag filter
      if (selectedTag) {
        const taskTags = parseTaskTags(t.tags).map((tag) => tag.toLowerCase());
        if (!taskTags.includes(selectedTag.toLowerCase())) return false;
      }

      return true;
    });
  }, [tasks, filter, selectedTag]);

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || !onAddTask) return;

    setIsSubmitting(true);
    try {
      await onAddTask(inputText.trim(), selectedTags);
      setInputText("");
      setSelectedTags([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditingText(task.title);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingText("");
  };

  const saveEditing = async (taskId: string) => {
    if (!editingText.trim()) {
      cancelEditing();
      return;
    }
    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask && onUpdateTask) {
      await onUpdateTask(taskId, {
        title: editingText.trim(),
        priority: targetTask.priority,
        tags: parseTaskTags(targetTask.tags),
      });
    }
    setEditingTaskId(null);
    setEditingText("");
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-3.5 space-y-3 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-white tracking-tight">
              Quick To-Do Tasks
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Database: Task
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            One-off tasks independent of weekly routines
          </p>
        </div>

        <div className="text-xs text-zinc-400 font-medium">
          {completedTasksCount} / {tasks.length} Done
        </div>
      </div>

      {/* Filter Bar: Status Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
          {(["ALL", "ACTIVE", "COMPLETED"] as FilterTab[]).map((tab) => {
            const count =
              tab === "ALL"
                ? tasks.length
                : tab === "ACTIVE"
                ? activeTasksCount
                : completedTasksCount;
            const isActive = filter === tab;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="quickTaskFilterPill"
                    className="absolute inset-0 bg-white/10 rounded-lg border border-white/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  {tab === "ALL" ? "All" : tab === "ACTIVE" ? "Active" : "Done"}
                  <span className="text-[10px] opacity-70">({count})</span>
                </span>
              </button>
            );
          })}
        </div>

        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
          >
            Clear #{selectedTag}
          </button>
        )}
      </div>

      {/* Tag Pills Filter Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">
            Tags:
          </span>
          {allTags.map((tag) => {
            const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase();
            const style = getTagColorStyle(tag);

            return (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTag(isSelected ? null : tag)
                }
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-purple-400 scale-105"
                    : "opacity-75 hover:opacity-100"
                } ${style.bg} ${style.border} ${style.text}`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Task Items List */}
      {isLoading ? (
        <div className="py-12 text-center text-zinc-500 text-xs">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12 text-center space-y-2 rounded-2xl border border-white/5 bg-zinc-950/40"
        >
          <p className="text-zinc-300 font-semibold text-xs">
            {selectedTag
              ? `No tasks found for #${selectedTag}.`
              : filter === "COMPLETED"
              ? "No completed tasks yet."
              : filter === "ACTIVE"
              ? "All caught up! No active tasks."
              : "Your quick to-do list is empty."}
          </p>
          <p className="text-[11px] text-zinc-500">
            Type a quick task below!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              const isDone = task.status === "DONE" || task.completed;
              const taskTags = parseTaskTags(task.tags);
              const isEditingThis = editingTaskId === task.id;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isEditingThis
                      ? "bg-zinc-950 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50"
                      : isDone
                      ? "glass-subtle border-white/5 opacity-60 bg-zinc-950/40"
                      : "glass-card border-white/10 hover:border-indigo-500/30 bg-zinc-900/60 shadow-md"
                  }`}
                >
                  {/* Left Checkbox, Title & Notion Tag Badges */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleTask(task.id, isDone ? "TODO" : "DONE")
                      }
                      className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                        isDone
                          ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm"
                          : "border-white/20 hover:border-indigo-400 bg-white/5"
                      }`}
                    >
                      {isDone && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 stroke-[3]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </button>

                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      {isEditingThis ? (
                        /* Direct Inline Input Box */
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditing(task.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          onBlur={() => saveEditing(task.id)}
                          autoFocus
                          className="flex-1 bg-zinc-900 border border-amber-400/80 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-amber-400 transition-all font-medium"
                        />
                      ) : (
                        /* Clickable Title to Edit Inline */
                        <span
                          onClick={() => startEditing(task)}
                          title="Click to edit task title inline"
                          className={`text-xs font-medium transition-all truncate cursor-pointer hover:text-amber-300 ${
                            isDone
                              ? "line-through text-zinc-500 font-normal"
                              : "text-zinc-100"
                          }`}
                        >
                          {task.title}
                        </span>
                      )}

                      {/* Display Notion-Style Tag Badges */}
                      {!isEditingThis &&
                        taskTags.map((tag) => {
                          const style = getTagColorStyle(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTag(tag)}
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold border transition-all shrink-0 cursor-pointer ${style.bg} ${style.border} ${style.text} hover:opacity-100`}
                            >
                              #{tag}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Actions: Inline Edit Controls or Default Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditingThis ? (
                      <>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => saveEditing(task.id)}
                          title="Save inline edit (Enter)"
                          className="p-1 px-2 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-[11px] hover:bg-emerald-400 transition-all cursor-pointer shadow-sm"
                        >
                          ✓ Save
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={cancelEditing}
                          title="Cancel edit (Esc)"
                          className="p-1 px-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          title="Edit task title inline"
                          className="p-1 rounded-lg text-zinc-500 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          title="Delete task"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.75}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Dedicated Section Input Box for Quick Tasks */}
      {onAddTask && (
        <form onSubmit={handleAddSubmit} className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase tracking-wider">
            <span>Add Quick Task:</span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-white/10 focus-within:border-purple-500/50 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Add quick task (type #tag for Notion tags)..."
              disabled={isSubmitting}
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 min-w-0 px-2"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="shrink-0 p-1.5 rounded-lg bg-purple-600 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-500 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.996.996 0 00-1.41.91v4.99c0 .5.37.92.87.99L14 12l-11.14 1.5c-.5.07-.87.49-.87.99v4.99c0 .65.65 1.13 1.41.92z" />
              </svg>
            </button>
          </div>

          <NotionTagInput
            selectedTags={selectedTags}
            onChangeSelectedTags={setSelectedTags}
            existingTags={existingTags}
            placeholder="Add Notion tag (e.g. Work, Health)..."
          />
        </form>
      )}
    </div>
  );
};
