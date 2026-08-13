"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem, TaskCard } from "./TaskCard";
import { WorkspaceContextItem } from "@/services/api";
import { getTagColorClasses } from "@/components/ui/inputs";

export type GroupByOption = "status" | "context" | "priority" | "tag";

interface KanbanBoardProps {
  tasks: TaskItem[];
  contexts?: WorkspaceContextItem[];
  groupBy?: GroupByOption;
  onGroupByChange?: (groupBy: GroupByOption) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onUpdateTask?: (id: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddModal: (
    initialStatus?: string,
    initialContextId?: string,
    initialPriority?: string,
    initialTag?: string
  ) => void;
}

interface ColumnDef {
  id: string;
  title: string;
  badgeColor: string;
  borderColor: string;
  gradientColor: string;
  icon?: React.ReactNode;
}

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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  contexts = [],
  groupBy = "tag",
  onGroupByChange,
  onStatusChange,
  onUpdateTask,
  onDeleteTask,
  onOpenAddModal,
}) => {
  const [internalGroupBy, setInternalGroupBy] = useState<GroupByOption>(groupBy);
  const activeGroupBy = onGroupByChange ? groupBy : internalGroupBy;

  const handleGroupBySelect = (mode: GroupByOption) => {
    if (onGroupByChange) {
      onGroupByChange(mode);
    } else {
      setInternalGroupBy(mode);
    }
  };

  // State to track hidden column IDs for filtering
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);
  // Drag-over column state for visual highlight
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // 1. Extract all unique tags across tasks for "tag" grouping
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      parseTaskTags(t.tags).forEach((tag) => tagSet.add(tag.trim()));
    });
    return Array.from(tagSet);
  }, [tasks]);

  // 2. Define Columns based on active GroupBy mode
  const columns: ColumnDef[] = useMemo(() => {
    if (activeGroupBy === "status") {
      return [
        {
          id: "TODO",
          title: "To Do",
          gradientColor: "from-indigo-50/80 via-slate-50 to-white",
          borderColor: "border-indigo-200",
          badgeColor: "bg-indigo-100 text-indigo-700 border border-indigo-200",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          ),
        },
        {
          id: "IN_PROGRESS",
          title: "In Progress",
          gradientColor: "from-amber-50/80 via-slate-50 to-white",
          borderColor: "border-amber-200",
          badgeColor: "bg-amber-100 text-amber-700 border border-amber-200",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          ),
        },
        {
          id: "DONE",
          title: "Done",
          gradientColor: "from-emerald-50/80 via-slate-50 to-white",
          borderColor: "border-emerald-200",
          badgeColor: "bg-emerald-100 text-emerald-700 border border-emerald-200",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ),
        },
      ];
    }

    if (activeGroupBy === "priority") {
      return [
        {
          id: "URGENT",
          title: "🔴 Urgent",
          gradientColor: "from-rose-50/80 via-slate-50 to-white",
          borderColor: "border-rose-200",
          badgeColor: "bg-rose-100 text-rose-700 border border-rose-200",
        },
        {
          id: "HIGH",
          title: "🟠 High",
          gradientColor: "from-orange-50/80 via-slate-50 to-white",
          borderColor: "border-orange-200",
          badgeColor: "bg-orange-100 text-orange-700 border border-orange-200",
        },
        {
          id: "MEDIUM",
          title: "🟡 Medium",
          gradientColor: "from-yellow-50/80 via-slate-50 to-white",
          borderColor: "border-yellow-200",
          badgeColor: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        },
        {
          id: "LOW",
          title: "🟢 Low",
          gradientColor: "from-emerald-50/80 via-slate-50 to-white",
          borderColor: "border-emerald-200",
          badgeColor: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        },
      ];
    }

    if (activeGroupBy === "context") {
      const contextCols: ColumnDef[] = contexts.map((ctx) => ({
        id: ctx.id,
        title: ctx.name,
        gradientColor: "from-indigo-50/80 via-slate-50 to-white",
        borderColor: "border-slate-200",
        badgeColor: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        icon: (
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
        ),
      }));

      // Add unassigned context column if tasks exist without matching context
      contextCols.push({
        id: "UNASSIGNED",
        title: "Unassigned Workspace",
        gradientColor: "from-slate-100/80 via-slate-50 to-white",
        borderColor: "border-slate-200",
        badgeColor: "bg-slate-100 text-slate-700 border border-slate-200",
        icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />,
      });

      return contextCols;
    }

    if (activeGroupBy === "tag") {
      const tagCols: ColumnDef[] = allUniqueTags.map((tag) => ({
        id: tag,
        title: `#${tag}`,
        gradientColor: "from-blue-50/80 via-slate-50 to-white",
        borderColor: "border-blue-200",
        badgeColor: "bg-blue-100 text-blue-700 border border-blue-200",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          </svg>
        ),
      }));

      // Always include Untagged column
      tagCols.push({
        id: "UNTAGGED",
        title: "🏷️ Untagged",
        gradientColor: "from-slate-100/80 via-slate-50 to-white",
        borderColor: "border-slate-200",
        badgeColor: "bg-slate-100 text-slate-700 border border-slate-200",
      });

      return tagCols;
    }

    return [];
  }, [activeGroupBy, contexts, allUniqueTags]);

  // Filter out hidden columns based on filter state
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumnIds.includes(col.id));
  }, [columns, hiddenColumnIds]);

  // Toggle individual column visibility
  const toggleColumnVisibility = (colId: string) => {
    setHiddenColumnIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  // 3. Map Tasks to Column IDs
  const getTasksForColumn = (colId: string): TaskItem[] => {
    if (activeGroupBy === "status") {
      return tasks.filter((t) => (t.status || "TODO") === colId);
    }

    if (activeGroupBy === "priority") {
      return tasks.filter((t) => (t.priority || "MEDIUM") === colId);
    }

    if (activeGroupBy === "context") {
      if (colId === "UNASSIGNED") {
        const validContextIds = new Set(contexts.map((c) => c.id));
        return tasks.filter((t) => !t.contextId || !validContextIds.has(t.contextId));
      }
      return tasks.filter((t) => t.contextId === colId);
    }

    if (activeGroupBy === "tag") {
      if (colId === "UNTAGGED") {
        return tasks.filter((t) => parseTaskTags(t.tags).length === 0);
      }
      return tasks.filter((t) =>
        parseTaskTags(t.tags).some(
          (tag) => tag.toLowerCase() === colId.toLowerCase()
        )
      );
    }

    return [];
  };

  // 4. Handle Drag & Drop Task Updates
  const handleDropTask = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColId(null);

    const dragData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
    if (!dragData) return;

    try {
      const { taskId, sourceColId } = JSON.parse(dragData);
      if (!taskId) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (activeGroupBy === "status") {
        if (targetColId !== task.status) {
          onStatusChange(taskId, targetColId);
        }
      } else if (activeGroupBy === "priority") {
        if (targetColId !== task.priority && onUpdateTask) {
          onUpdateTask(taskId, { priority: targetColId });
        }
      } else if (activeGroupBy === "context") {
        if (targetColId !== task.contextId && targetColId !== "UNASSIGNED" && onUpdateTask) {
          onUpdateTask(taskId, { contextId: targetColId });
        }
      } else if (activeGroupBy === "tag") {
        if (!onUpdateTask) return;
        const currentTags = parseTaskTags(task.tags);

        if (targetColId === "UNTAGGED") {
          // Clear all tags if dropped onto Untagged
          onUpdateTask(taskId, { tags: [] as string[] });
        } else {
          // Replace source tag with target tag (or set tags to target tag if untagged)
          let updatedTags: string[] = [];
          if (sourceColId && sourceColId !== "UNTAGGED" && currentTags.includes(sourceColId)) {
            updatedTags = currentTags.map((t) => (t === sourceColId ? targetColId : t));
          } else {
            updatedTags = Array.from(new Set([...currentTags, targetColId]));
          }
          onUpdateTask(taskId, { tags: updatedTags });
        }
      }
    } catch (err) {
      console.warn("Drag drop parse error:", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColId: string) => {
    const payload = JSON.stringify({ taskId, sourceColId });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Grouping Controls & Column Filters Toolbar */}
      <div className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        {/* Left: Group By Mode Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Group Cards By:
          </span>

          {[
            { id: "status", label: "Status" },
            { id: "context", label: "Workspace" },
            { id: "priority", label: "Priority" },
            { id: "tag", label: "Tags" },
          ].map((mode) => {
            const isActive = activeGroupBy === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleGroupBySelect(mode.id as GroupByOption)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm border border-indigo-500"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Right: Column Visibility Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-500 pr-1">Filter Groups:</span>

          {/* Select All (Show All) */}
          {hiddenColumnIds.length > 0 && (
            <button
              type="button"
              onClick={() => setHiddenColumnIds([])}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 underline pr-1 cursor-pointer font-bold transition-colors"
            >
              Select All
            </button>
          )}

          {/* Clear All (Hide All) */}
          {hiddenColumnIds.length < columns.length && (
            <button
              type="button"
              onClick={() => setHiddenColumnIds(columns.map((c) => c.id))}
              className="text-[11px] text-slate-500 hover:text-rose-600 underline pr-1 cursor-pointer font-bold transition-colors"
            >
              Clear All
            </button>
          )}

          {columns.map((col) => {
            const isVisible = !hiddenColumnIds.includes(col.id);

            if (activeGroupBy === "tag") {
              const isUntagged = col.id === "UNTAGGED";
              const colorClasses = isUntagged
                ? isVisible
                  ? "bg-slate-800 text-white border-slate-700 ring-2 ring-slate-400 font-extrabold shadow-md scale-105"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                : getTagColorClasses(col.id, isVisible);

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggleColumnVisibility(col.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer select-none shrink-0 ${colorClasses}`}
                >
                  {isVisible ? "✓ " : ""}{col.title}
                </button>
              );
            }

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => toggleColumnVisibility(col.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer select-none ${
                  isVisible
                    ? "bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-400/80 shadow-md font-extrabold scale-105"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {isVisible ? "✓ " : ""}{col.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Container for Visible Trello Card Columns */}
      <div
        className={`grid gap-5 ${
          visibleColumns.length === 1
            ? "grid-cols-1 max-w-xl mx-auto"
            : visibleColumns.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : visibleColumns.length === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {visibleColumns.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-300 rounded-2xl bg-white space-y-3">
            <p className="text-sm text-slate-500 font-medium">All group columns are currently hidden by filter.</p>
            <button
              type="button"
              onClick={() => setHiddenColumnIds([])}
              className="btn-secondary text-xs px-4 py-2"
            >
              Reset Column Filters
            </button>
          </div>
        ) : (
          visibleColumns.map((col) => {
            const colTasks = getTasksForColumn(col.id);
            const isDragOver = dragOverColId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColId(col.id);
                }}
                onDragLeave={() => setDragOverColId(null)}
                onDrop={(e) => handleDropTask(e, col.id)}
                className={`rounded-2xl bg-gradient-to-b ${col.gradientColor} border p-4 space-y-4 flex flex-col min-h-[440px] transition-all duration-200 ${
                  isDragOver
                    ? `${col.borderColor} ring-2 ring-indigo-500/50 scale-[1.01]`
                    : `${col.borderColor} hover:border-slate-300`
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {col.icon}
                    <h3 className="font-bold text-sm text-slate-900 truncate">{col.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${col.badgeColor}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Add Task Button for Column */}
                  <button
                    type="button"
                    onClick={() => {
                      if (activeGroupBy === "status") onOpenAddModal(col.id);
                      else if (activeGroupBy === "priority") onOpenAddModal("TODO", undefined, col.id);
                      else if (activeGroupBy === "context") onOpenAddModal("TODO", col.id === "UNASSIGNED" ? undefined : col.id);
                      else if (activeGroupBy === "tag") onOpenAddModal("TODO", undefined, undefined, col.id === "UNTAGGED" ? undefined : col.id);
                      else onOpenAddModal();
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer shrink-0"
                    title={`Add task to ${col.title}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                {/* Task Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {colTasks.length === 0 ? (
                      <div
                        onClick={() => {
                          if (activeGroupBy === "status") onOpenAddModal(col.id);
                          else if (activeGroupBy === "priority") onOpenAddModal("TODO", undefined, col.id);
                          else if (activeGroupBy === "context") onOpenAddModal("TODO", col.id === "UNASSIGNED" ? undefined : col.id);
                          else if (activeGroupBy === "tag") onOpenAddModal("TODO", undefined, undefined, col.id === "UNTAGGED" ? undefined : col.id);
                          else onOpenAddModal();
                        }}
                        className="py-12 border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50 rounded-2xl text-center cursor-pointer transition-all duration-200 group shadow-sm"
                      >
                        <p className="text-xs text-slate-500 font-medium group-hover:text-slate-800 transition-colors">
                          No tasks in {col.title}
                        </p>
                        <span className="inline-block mt-2 text-xs text-indigo-600 group-hover:text-indigo-700 font-semibold transition-colors">
                          + Create One
                        </span>
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={`${col.id}-${task.id}`}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task.id, col.id)}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <TaskCard
                            task={task}
                            onStatusChange={onStatusChange}
                            onDelete={onDeleteTask}
                          />
                        </div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
