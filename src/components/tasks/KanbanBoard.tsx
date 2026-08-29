"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem, TaskCard } from "./TaskCard";
import { WorkspaceContextItem } from "@/services/api";
import { getTagColorClasses } from "@/components/ui/inputs";

export type GroupByOption = "horizon" | "status" | "context" | "priority" | "tag";

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
    initialTag?: string,
    initialDueDate?: string
  ) => void;
}

interface ColumnDef {
  id: string;
  title: string;
  subtitle?: string;
  badgeColor: string;
  borderColor: string;
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
  groupBy = "horizon",
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
    if (activeGroupBy === "horizon") {
      return [
        {
          id: "OVERDUE",
          title: "⚠️ Overdue",
          subtitle: "Immediate action needed",
          borderColor: "border-rose-500/30",
          badgeColor: "bg-rose-500/15 text-rose-500 border border-rose-500/30",
        },
        {
          id: "TODAY",
          title: "🔥 Today",
          subtitle: "Daily focus & momentum",
          borderColor: "border-amber-500/30",
          badgeColor: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
        },
        {
          id: "THIS_WEEK",
          title: "⚡ This Week",
          subtitle: "Next 7 days horizon",
          borderColor: "border-indigo-500/30",
          badgeColor: "bg-indigo-500/15 text-indigo-500 border border-indigo-500/30",
        },
        {
          id: "THIS_MONTH",
          title: "📅 This Month",
          subtitle: "Next 30 days & planning",
          borderColor: "border-purple-500/30",
          badgeColor: "bg-purple-500/15 text-purple-500 border border-purple-500/30",
        },
        {
          id: "COMPLETED",
          title: "✅ Completed",
          subtitle: "Accomplished tasks",
          borderColor: "border-emerald-500/30",
          badgeColor: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
        },
      ];
    }

    if (activeGroupBy === "status") {
      return [
        {
          id: "TODO",
          title: "To Do",
          borderColor: "border-indigo-500/30",
          badgeColor: "bg-indigo-500/15 text-indigo-500 border border-indigo-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          ),
        },
        {
          id: "IN_PROGRESS",
          title: "In Progress",
          borderColor: "border-amber-500/30",
          badgeColor: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          ),
        },
        {
          id: "DONE",
          title: "Done",
          borderColor: "border-emerald-500/30",
          badgeColor: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
          borderColor: "border-rose-500/30",
          badgeColor: "bg-rose-500/15 text-rose-500 border border-rose-500/30",
        },
        {
          id: "HIGH",
          title: "🟠 High",
          borderColor: "border-orange-500/30",
          badgeColor: "bg-orange-500/15 text-orange-500 border border-orange-500/30",
        },
        {
          id: "MEDIUM",
          title: "🟡 Medium",
          borderColor: "border-yellow-500/30",
          badgeColor: "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30",
        },
        {
          id: "LOW",
          title: "🟢 Low",
          borderColor: "border-emerald-500/30",
          badgeColor: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
        },
      ];
    }

    if (activeGroupBy === "context") {
      const contextCols: ColumnDef[] = contexts.map((ctx) => ({
        id: ctx.id,
        title: ctx.name,
        borderColor: "border-indigo-500/30",
        badgeColor: "bg-indigo-500/15 text-indigo-500 border border-indigo-500/30",
        icon: (
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: ctx.color || "#6366f1" }}
          />
        ),
      }));

      // Add unassigned context column
      contextCols.push({
        id: "UNASSIGNED",
        title: "Unassigned Workspace",
        borderColor: "border-slate-500/30",
        badgeColor: "bg-slate-500/15 text-slate-500 border border-slate-500/30",
        icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />,
      });

      return contextCols;
    }

    if (activeGroupBy === "tag") {
      const tagCols: ColumnDef[] = allUniqueTags.map((tag) => ({
        id: tag,
        title: `#${tag}`,
        borderColor: "border-blue-500/30",
        badgeColor: "bg-blue-500/15 text-blue-500 border border-blue-500/30",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          </svg>
        ),
      }));

      tagCols.push({
        id: "UNTAGGED",
        title: "🏷️ Untagged",
        borderColor: "border-slate-500/30",
        badgeColor: "bg-slate-500/15 text-slate-500 border border-slate-500/30",
      });

      return tagCols;
    }

    return [];
  }, [activeGroupBy, contexts, allUniqueTags]);

  // Filter out hidden columns based on filter state
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumnIds.includes(col.id));
  }, [columns, hiddenColumnIds]);

  const toggleColumnVisibility = (colId: string) => {
    setHiddenColumnIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  // 3. Map Tasks to Column IDs
  const getTasksForColumn = (colId: string): TaskItem[] => {
    if (activeGroupBy === "horizon") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const in7Days = new Date(Date.now() + 7 * 86400000);
      const in7DaysStr = in7Days.toISOString().split("T")[0];

      if (colId === "COMPLETED") {
        return tasks.filter((t) => t.status === "DONE" || t.completed);
      }

      const activeTasks = tasks.filter((t) => t.status !== "DONE" && !t.completed);

      if (colId === "OVERDUE") {
        return activeTasks.filter((t) => t.dueDate && t.dueDate.split("T")[0] < todayStr);
      }

      if (colId === "TODAY") {
        return activeTasks.filter((t) => t.dueDate && t.dueDate.split("T")[0] === todayStr);
      }

      if (colId === "THIS_WEEK") {
        return activeTasks.filter((t) => {
          if (!t.dueDate) return false;
          const due = t.dueDate.split("T")[0];
          return due > todayStr && due <= in7DaysStr;
        });
      }

      if (colId === "THIS_MONTH") {
        return activeTasks.filter((t) => {
          if (!t.dueDate) return true; // Unscheduled tasks bucket into This Month / Planning Horizon
          const due = t.dueDate.split("T")[0];
          return due > in7DaysStr;
        });
      }

      return [];
    }

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

      if (activeGroupBy === "horizon") {
        const todayStr = new Date().toISOString().split("T")[0];
        const in6DaysStr = new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0];
        const in29DaysStr = new Date(Date.now() + 29 * 86400000).toISOString().split("T")[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        if (targetColId === "COMPLETED") {
          onStatusChange(taskId, "DONE");
        } else if (targetColId === "TODAY") {
          if (onUpdateTask) {
            onUpdateTask(taskId, {
              dueDate: todayStr,
              status: task.status === "DONE" ? "TODO" : task.status,
              completed: false,
            });
          }
        } else if (targetColId === "THIS_WEEK") {
          if (onUpdateTask) {
            onUpdateTask(taskId, {
              dueDate: in6DaysStr,
              status: task.status === "DONE" ? "TODO" : task.status,
              completed: false,
            });
          }
        } else if (targetColId === "THIS_MONTH") {
          if (onUpdateTask) {
            onUpdateTask(taskId, {
              dueDate: in29DaysStr,
              status: task.status === "DONE" ? "TODO" : task.status,
              completed: false,
            });
          }
        } else if (targetColId === "OVERDUE") {
          if (onUpdateTask) {
            onUpdateTask(taskId, {
              dueDate: yesterdayStr,
              status: task.status === "DONE" ? "TODO" : task.status,
              completed: false,
            });
          }
        }
      } else if (activeGroupBy === "status") {
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
          onUpdateTask(taskId, { tags: [] as string[] });
        } else {
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

  const handleOpenAddForColumn = (colId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const in6DaysStr = new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0];
    const in29DaysStr = new Date(Date.now() + 29 * 86400000).toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (activeGroupBy === "horizon") {
      if (colId === "OVERDUE") onOpenAddModal("TODO", undefined, undefined, undefined, yesterdayStr);
      else if (colId === "TODAY") onOpenAddModal("TODO", undefined, undefined, undefined, todayStr);
      else if (colId === "THIS_WEEK") onOpenAddModal("TODO", undefined, undefined, undefined, in6DaysStr);
      else if (colId === "THIS_MONTH") onOpenAddModal("TODO", undefined, undefined, undefined, in29DaysStr);
      else if (colId === "COMPLETED") onOpenAddModal("DONE");
      else onOpenAddModal();
    } else if (activeGroupBy === "status") {
      onOpenAddModal(colId);
    } else if (activeGroupBy === "priority") {
      onOpenAddModal("TODO", undefined, colId);
    } else if (activeGroupBy === "context") {
      onOpenAddModal("TODO", colId === "UNASSIGNED" ? undefined : colId);
    } else if (activeGroupBy === "tag") {
      onOpenAddModal("TODO", undefined, undefined, colId === "UNTAGGED" ? undefined : colId);
    } else {
      onOpenAddModal();
    }
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Grouping Controls & Column Filters Toolbar */}
      <div
        className="p-3.5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs"
        style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-subtle)" }}
      >
        {/* Left: Group By Mode Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-extrabold opacity-60 uppercase tracking-wider flex items-center gap-1.5 pr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Group Cards:
          </span>

          {[
            { id: "horizon", label: "⏳ Time Horizon" },
            { id: "status", label: "Status" },
            { id: "priority", label: "Priority" },
            { id: "context", label: "Workspace" },
            { id: "tag", label: "Tags" },
          ].map((mode) => {
            const isActive = activeGroupBy === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleGroupBySelect(mode.id as GroupByOption)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "border opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: isActive ? undefined : "var(--surface-subtle)",
                  borderColor: isActive ? undefined : "var(--border-subtle)",
                }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Right: Column Visibility Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold opacity-60 pr-1">Filter Columns:</span>

          {hiddenColumnIds.length > 0 && (
            <button
              type="button"
              onClick={() => setHiddenColumnIds([])}
              className="text-[11px] text-indigo-500 hover:underline pr-1 cursor-pointer font-bold transition-colors"
            >
              Select All
            </button>
          )}

          {columns.map((col) => {
            const isVisible = !hiddenColumnIds.includes(col.id);

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => toggleColumnVisibility(col.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none shrink-0 ${
                  isVisible
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-xs"
                    : "opacity-60 border-[var(--border-subtle)]"
                }`}
                style={{
                  backgroundColor: isVisible ? undefined : "var(--surface-subtle)",
                }}
              >
                {isVisible ? "✓ " : ""}{col.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Container for Visible Cards Columns */}
      <div
        className={`grid gap-4 ${
          visibleColumns.length === 1
            ? "grid-cols-1 max-w-xl mx-auto"
            : visibleColumns.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : visibleColumns.length === 3
            ? "grid-cols-1 md:grid-cols-3"
            : visibleColumns.length === 4
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        }`}
      >
        {visibleColumns.length === 0 ? (
          <div
            className="col-span-full py-16 text-center border border-dashed rounded-2xl space-y-3"
            style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-subtle)" }}
          >
            <p className="text-sm opacity-60 font-semibold">All columns are currently hidden by filter.</p>
            <button
              type="button"
              onClick={() => setHiddenColumnIds([])}
              className="btn-premium text-xs px-4 py-2"
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
                className={`rounded-2xl border p-4 space-y-4 flex flex-col min-h-[460px] transition-all duration-200 ${
                  isDragOver
                    ? "ring-2 ring-indigo-500 scale-[1.01]"
                    : "hover:border-indigo-500/30"
                }`}
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: isDragOver ? "#6366f1" : "var(--border-subtle)",
                }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {col.icon}
                      <h3 className="font-extrabold text-xs tracking-tight truncate">{col.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${col.badgeColor}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    {col.subtitle && (
                      <p className="text-[10px] opacity-60 font-medium pt-0.5 truncate">{col.subtitle}</p>
                    )}
                  </div>

                  {/* Add Task Button for Column */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddForColumn(col.id)}
                    className="p-1.5 opacity-60 hover:opacity-100 hover:text-indigo-500 rounded-lg transition-all cursor-pointer shrink-0"
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
                        onClick={() => handleOpenAddForColumn(col.id)}
                        className="py-12 border border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 group"
                        style={{
                          backgroundColor: "var(--surface-subtle)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        <p className="text-xs opacity-60 font-medium group-hover:text-indigo-500 transition-colors">
                          No tasks in {col.title}
                        </p>
                        <span className="inline-block mt-2 text-xs text-indigo-500 font-extrabold transition-colors">
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
