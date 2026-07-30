"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoutineItem } from "@/services/api";
import { NotionTagInput, getTagColorStyle } from "./NotionTagInput";

export const WEEK_DAYS = [
  { key: "MON", label: "Mon", fullName: "Monday" },
  { key: "TUE", label: "Tue", fullName: "Tuesday" },
  { key: "WED", label: "Wed", fullName: "Wednesday" },
  { key: "THU", label: "Thu", fullName: "Thursday" },
  { key: "FRI", label: "Fri", fullName: "Friday" },
  { key: "SAT", label: "Sat", fullName: "Saturday" },
  { key: "SUN", label: "Sun", fullName: "Sunday" },
];

export const TARGET_DAY_OPTIONS = ["ALL", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const getTodayDayKey = (): string => {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const index = day === 0 ? 6 : day - 1;
  return WEEK_DAYS[index].key;
};

// Helper to safely parse tags
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

interface WeeklyRoutineCalendarProps {
  routines: RoutineItem[];
  selectedDateStr: string | null; // "MON", "TUE", etc., or null for All Routines
  onSelectDate: (dayKey: string | null) => void;
  onAddRoutine?: (title: string, dayKey: string, tags?: string[]) => Promise<void>;
  onToggleRoutine?: (id: string) => Promise<void>;
  onDeleteRoutine?: (id: string) => Promise<void>;
  existingTags?: string[];
}

export const WeeklyRoutineCalendar: React.FC<WeeklyRoutineCalendarProps> = ({
  routines,
  selectedDateStr,
  onSelectDate,
  onAddRoutine,
  onToggleRoutine,
  onDeleteRoutine,
  existingTags = [],
}) => {
  const todayKey = useMemo(() => getTodayDayKey(), []);
  const [inputText, setInputText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [targetDayKey, setTargetDayKey] = useState<string>(selectedDateStr || "ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep targetDayKey updated when selectedDateStr changes
  React.useEffect(() => {
    if (selectedDateStr) setTargetDayKey(selectedDateStr);
  }, [selectedDateStr]);

  // Compute routine counts per day key (routines with "ALL" contribute to every day)
  const countsByDay = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    WEEK_DAYS.forEach((d) => map.set(d.key, { total: 0, done: 0 }));

    routines.forEach((r) => {
      if (!r.dayKey) return;
      const dayKey = r.dayKey.toUpperCase().trim();

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

  // Routines to display in the list below the strip
  const displayedRoutines = useMemo(() => {
    if (!selectedDateStr) return routines;
    const target = selectedDateStr.toUpperCase().trim();
    return routines.filter((r) => {
      const dayKey = r.dayKey?.toUpperCase().trim();
      return dayKey === target || dayKey === "ALL";
    });
  }, [routines, selectedDateStr]);

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

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-3.5 space-y-3 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-white tracking-tight">
              Weekly Routines
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Database: Routine
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            Select a day to view or add daily routines
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectDate(todayKey)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
        >
          Today ({todayKey})
        </button>
      </div>

      {/* Show All Routines Button */}
      <button
        type="button"
        onClick={() => onSelectDate(null)}
        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer ${
          selectedDateStr === null
            ? "bg-indigo-500 text-white border-indigo-400 shadow-md"
            : "bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
        }`}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Show All Weekly Routines
        </span>
        <span className="text-[10px] font-bold opacity-80">{routines.length} routines</span>
      </button>

      {/* 7-Day Pure Day Name Strip Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((day) => {
          const isToday = day.key === todayKey;
          const isSelected = selectedDateStr === day.key;
          const counts = countsByDay.get(day.key) || { total: 0, done: 0 };
          const hasRoutines = counts.total > 0;

          return (
            <motion.button
              key={day.key}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : day.key)}
              className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer min-h-[75px] ${
                isSelected
                  ? "bg-gradient-to-b from-indigo-500/30 to-purple-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : isToday
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                  : "bg-zinc-900/50 border-white/10 hover:border-white/20 text-zinc-300"
              }`}
            >
              {isToday && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}

              <div className="text-center my-auto">
                <span className="text-xs font-black tracking-wider block uppercase">
                  {day.key}
                </span>
                <span className="text-[10px] font-medium text-zinc-400 block">
                  {day.label}
                </span>
              </div>

              <div className="mt-1">
                {hasRoutines ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      counts.done === counts.total
                        ? "bg-emerald-500 text-zinc-950"
                        : isSelected
                        ? "bg-white text-zinc-950"
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

                return (
                  <motion.div
                    key={routine.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isDone
                        ? "bg-zinc-950/40 border-white/5 opacity-60"
                        : "bg-zinc-900/60 border-white/10 hover:border-indigo-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
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

                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className={`text-xs font-medium truncate ${isDone ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                          {routine.title}
                        </span>

                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                          {routine.dayKey}
                        </span>

                        {rTags.map((tag) => {
                          const style = getTagColorStyle(tag);
                          return (
                            <span key={tag} className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${style.bg} ${style.border} ${style.text} shrink-0`}>
                              #{tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {onDeleteRoutine && (
                      <button
                        type="button"
                        onClick={() => onDeleteRoutine(routine.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0 ml-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Dedicated Section Input Box for Weekly Routines */}
      {onAddRoutine && (
        <form onSubmit={handleAddSubmit} className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              Add Routine to:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {TARGET_DAY_OPTIONS.map((dKey) => (
                <button
                  key={dKey}
                  type="button"
                  onClick={() => setTargetDayKey(dKey)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    targetDayKey === dKey
                      ? "bg-indigo-500 text-white"
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {dKey}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-white/10 focus-within:border-indigo-500/50 transition-all">
            <NotionTagInput
              selectedTags={selectedTags}
              onChangeSelectedTags={setSelectedTags}
              existingTags={existingTags}
            />

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Add ${targetDayKey} routine...`}
              disabled={isSubmitting}
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 min-w-0"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="shrink-0 p-1.5 rounded-lg bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-400 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.996.996 0 00-1.41.91v4.99c0 .5.37.92.87.99L14 12l-11.14 1.5c-.5.07-.87.49-.87.99v4.99c0 .65.65 1.13 1.41.92z" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
