"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoutineItem } from "@/services/api";
import { NotionTagInput, getTagColorStyle, getTagColorClasses } from "./NotionTagInput";

interface DayColumn {
  key: string;
  label: string;
}

const WEEK_DAYS: DayColumn[] = [
  { key: "MON", label: "MON" },
  { key: "TUE", label: "TUE" },
  { key: "WED", label: "WED" },
  { key: "THU", label: "THU" },
  { key: "FRI", label: "FRI" },
  { key: "SAT", label: "SAT" },
  { key: "SUN", label: "SUN" },
];

interface WeeklyRoutineCalendarProps {
  routines: RoutineItem[];
  selectedDateStr?: string | null;
  onSelectDate: (dayKey: string | null) => void;
  onToggleRoutine?: (routineId: string) => Promise<void>;
  onDeleteRoutine?: (routineId: string) => Promise<void>;
  onAddRoutine?: (title: string, dayKey: string, tags?: string[]) => Promise<void>;
  onUpdateRoutine?: (routineId: string, updates: { title: string; dayKey: string; tags?: string[] }) => Promise<void>;
  existingTags?: string[];
}

const parseTags = (tagsField?: string | string[] | null): string[] => {
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

export const WeeklyRoutineCalendar: React.FC<WeeklyRoutineCalendarProps> = ({
  routines,
  selectedDateStr,
  onSelectDate,
  onToggleRoutine,
  onDeleteRoutine,
  onAddRoutine,
  onUpdateRoutine,
  existingTags = [],
}) => {
  const [inputText, setInputText] = useState("");
  const [targetDayKey, setTargetDayKey] = useState("MON");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct Inline Edit State
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [editingTags, setEditingTags] = useState<string[]>([]);

  const todayKey = useMemo(() => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return days[new Date().getDay()];
  }, []);

  const countsByDay = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    WEEK_DAYS.forEach((d) => map.set(d.key, { total: 0, done: 0 }));

    routines.forEach((r) => {
      const dayKey = r.dayKey?.toUpperCase().trim();
      if (dayKey === "ALL") {
        WEEK_DAYS.forEach((d) => {
          const current = map.get(d.key) || { total: 0, done: 0 };
          current.total += 1;
          if (r.completed) current.done += 1;
          map.set(d.key, current);
        });
      } else {
        const current = map.get(dayKey) || { total: 0, done: 0 };
        current.total += 1;
        if (r.completed) current.done += 1;
        map.set(dayKey, current);
      }
    });
    return map;
  }, [routines]);

  // Multi-Select Tag Filter State
  const [selectedTagsFilter, setSelectedTagsFilter] = useState<string[]>([]);

  // Compute all unique tags across routines
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    routines.forEach((r) => {
      parseTags(r.tags).forEach((tag) => tagSet.add(tag.toLowerCase()));
    });
    return Array.from(tagSet);
  }, [routines]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTagsFilter((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      } else {
        return [...prev, tag];
      }
    });
  };

  const displayedRoutines = useMemo(() => {
    return routines.filter((r) => {
      if (selectedDateStr) {
        const target = selectedDateStr.toUpperCase().trim();
        const dayKey = r.dayKey?.toUpperCase().trim();
        if (dayKey !== target && dayKey !== "ALL") return false;
      }

      if (selectedTagsFilter.length > 0) {
        const rTags = parseTags(r.tags).map((tag) => tag.toLowerCase());
        const matchesAll = selectedTagsFilter.every((selected) =>
          rTags.includes(selected.toLowerCase())
        );
        if (!matchesAll) return false;
      }

      return true;
    });
  }, [routines, selectedDateStr, selectedTagsFilter]);

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || !onAddRoutine) return;

    setIsSubmitting(true);
    try {
      await onAddRoutine(inputText.trim(), targetDayKey, selectedTags);
      setInputText("");
      setSelectedTags([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (routine: RoutineItem) => {
    setEditingRoutineId(routine.id);
    setEditingText(routine.title);
    setEditingTags(parseTags(routine.tags));
  };

  const cancelEditing = () => {
    setEditingRoutineId(null);
    setEditingText("");
    setEditingTags([]);
  };

  const saveEditing = async (routineId: string) => {
    if (!editingText.trim()) {
      cancelEditing();
      return;
    }
    const targetRoutine = routines.find((r) => r.id === routineId);
    if (targetRoutine && onUpdateRoutine) {
      await onUpdateRoutine(routineId, {
        title: editingText.trim(),
        dayKey: targetRoutine.dayKey,
        tags: editingTags,
      });
    }
    setEditingRoutineId(null);
    setEditingText("");
    setEditingTags([]);
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-3.5 space-y-3 shadow-xl">
      {/* Level 1 Section Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Weekly Routines</span>
              <span className="text-indigo-400">📅</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm">
              Database: Routine
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            Select a day to view or add daily routines
          </p>
        </div>

        {selectedDateStr ? (
          <button
            onClick={() => onSelectDate(null)}
            className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs hover:bg-indigo-500/25 transition-all cursor-pointer shadow-sm"
          >
            Show All Days
          </button>
        ) : (
          <span className="px-3 py-1 rounded-full bg-zinc-800/60 border border-white/10 text-zinc-400 font-bold text-xs">
            Viewing: All Days
          </span>
        )}
      </div>

      {/* 7 Day Names Strip (MON-SUN) */}
      <div className="grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((day) => {
          const isSelected = selectedDateStr === day.key;
          const isToday = todayKey === day.key;
          const counts = countsByDay.get(day.key) || { total: 0, done: 0 };
          const isAllDone = counts.total > 0 && counts.done === counts.total;

          return (
            <motion.button
              key={day.key}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : day.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-indigo-600 border-indigo-400 text-white font-extrabold shadow-lg shadow-indigo-500/30"
                  : isToday
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200"
                  : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">
                {day.label}
              </span>

              <div className="mt-1 flex items-center justify-center min-h-[14px]">
                {counts.total > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isAllDone
                        ? "bg-emerald-500 text-zinc-950"
                        : isSelected
                        ? "bg-white/20 text-white"
                        : "bg-indigo-500/30 text-indigo-200 border border-indigo-500/40"
                    }`}
                  >
                    {counts.done}/{counts.total}
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10 inline-block" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Multi-Select Tag Filter Bar (Matching Screenshot Styling & Routine Detail Font Sizing) */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar py-1">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-wider shrink-0 pr-1 select-none">
            TAGS:
          </span>
          {allTags.map((tag) => {
            const isSelected = selectedTagsFilter.some(
              (st) => st.toLowerCase() === tag.toLowerCase()
            );
            const colorClasses = getTagColorClasses(tag, isSelected);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTagFilter(tag)}
                className={`px-3.5 py-1 rounded-full text-base font-semibold border transition-all shrink-0 cursor-pointer ${colorClasses}`}
              >
                #{tag}
              </button>
            );
          })}
          {selectedTagsFilter.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTagsFilter([])}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 shrink-0 ml-1 cursor-pointer"
            >
              Clear ({selectedTagsFilter.length})
            </button>
          )}
        </div>
      )}

      {/* Embedded Routine Items List */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
          <span>
            {selectedDateStr ? `${selectedDateStr} Routines` : "All Weekly Routines"}
          </span>
          <span className="text-[10px] text-zinc-500">
            {displayedRoutines.length} items
          </span>
        </div>

        {displayedRoutines.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 italic bg-zinc-900/40 rounded-xl border border-white/5">
            {selectedDateStr
              ? `No routines created for ${selectedDateStr} yet.`
              : "No weekly routines found."}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {displayedRoutines.map((routine) => {
                const isDone = routine.completed;
                const rTags = parseTags(routine.tags);
                const isEditingThis = editingRoutineId === routine.id;

                return (
                  <motion.div
                    key={routine.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex flex-col gap-2 p-2.5 rounded-xl border transition-all ${
                      isEditingThis
                        ? "bg-zinc-950 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50"
                        : isDone
                        ? "bg-zinc-950/40 border-white/5 opacity-60"
                        : "bg-zinc-900/60 border-white/10 hover:border-indigo-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <button
                          type="button"
                          onClick={() => onToggleRoutine?.(routine.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isDone
                              ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                              : "border-white/20 hover:border-indigo-400 bg-white/5"
                          }`}
                        >
                          {isDone && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>

                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                          {isEditingThis ? (
                            /* Direct Inline Input Box */
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditing(routine.id);
                                if (e.key === "Escape") cancelEditing();
                              }}
                              autoFocus
                              placeholder="Edit routine title..."
                              className="flex-1 bg-zinc-900 border border-amber-400/80 rounded-lg px-2.5 py-1 text-base text-white outline-none focus:ring-1 focus:ring-amber-400 transition-all font-medium"
                            />
                          ) : (
                            /* Clickable Routine Title to Edit Inline */
                            <span
                              onClick={() => startEditing(routine)}
                              title="Click to edit routine title inline"
                              className={`text-base font-medium transition-all break-words whitespace-normal leading-snug cursor-pointer hover:text-amber-300 ${
                                isDone ? "line-through text-zinc-500" : "text-zinc-200"
                              }`}
                            >
                              {routine.title}
                            </span>
                          )}

                          {!isEditingThis && (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                {routine.dayKey}
                              </span>

                              {rTags.map((tag) => {
                                const isSelected = selectedTagsFilter.some(
                                  (st) => st.toLowerCase() === tag.toLowerCase()
                                );
                                const colorClasses = getTagColorClasses(tag, isSelected);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTagFilter(tag)}
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-all shrink-0 cursor-pointer ${colorClasses}`}
                                  >
                                    #{tag}
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Actions: Inline Edit Controls or Default Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditingThis ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditing(routine.id)}
                              title="Save inline edit (Enter)"
                              className="p-1 px-2 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-[11px] hover:bg-emerald-400 transition-all cursor-pointer shadow-sm"
                            >
                              ✓ Save
                            </button>
                            <button
                              type="button"
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
                              onClick={() => startEditing(routine)}
                              title="Edit routine inline"
                              className="p-1 rounded-lg text-zinc-500 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
                            >
                              ✏️
                            </button>

                            {onDeleteRoutine && (
                              <button
                                type="button"
                                onClick={() => onDeleteRoutine(routine.id)}
                                title="Delete routine"
                                className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline Tag Manager Row (Shown while editing) */}
                    {isEditingThis && (
                      <div className="pt-2 border-t border-amber-500/20 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                          <span>Edit Tags:</span>
                        </div>

                        <NotionTagInput
                          selectedTags={editingTags}
                          onChangeSelectedTags={setEditingTags}
                          existingTags={existingTags}
                          placeholder="Add/modify tags for this routine..."
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Dedicated Section Input Box for Routines */}
      {onAddRoutine && (
        <form onSubmit={handleAddSubmit} className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            <span>Add Routine To:</span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN", "ALL"].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setTargetDayKey(day)}
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold transition-all cursor-pointer ${
                    targetDayKey === day
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-white/10 focus-within:border-indigo-500/50 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Add routine for ${targetDayKey} (type #tag for Notion tags)...`}
              disabled={isSubmitting}
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 min-w-0 px-2"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="shrink-0 p-1.5 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all cursor-pointer"
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
            placeholder="Add Notion tag (e.g. Health, Study)..."
          />
        </form>
      )}
    </div>
  );
};
