"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const NOTION_TAG_COLORS = [
  {
    name: "amber", // Light Orange / Gold
    defaultClasses: "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/35 hover:border-amber-400 hover:text-amber-100 hover:shadow-amber-500/25",
    selectedClasses: "border-amber-400 bg-amber-500/40 text-amber-100 ring-1 ring-amber-400/60 shadow-lg shadow-amber-500/35 scale-105",
    bg: "bg-amber-500/15", border: "border-amber-400/30", text: "text-amber-300", badge: "bg-amber-500",
  },
  {
    name: "indigo",
    defaultClasses: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/35 hover:border-indigo-400 hover:text-indigo-100 hover:shadow-indigo-500/25",
    selectedClasses: "border-indigo-400 bg-indigo-500/40 text-indigo-100 ring-1 ring-indigo-400/60 shadow-lg shadow-indigo-500/35 scale-105",
    bg: "bg-indigo-500/15", border: "border-indigo-500/30", text: "text-indigo-300", badge: "bg-indigo-500",
  },
  {
    name: "purple",
    defaultClasses: "border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/35 hover:border-purple-400 hover:text-purple-100 hover:shadow-purple-500/25",
    selectedClasses: "border-purple-400 bg-purple-500/40 text-purple-100 ring-1 ring-purple-400/60 shadow-lg shadow-purple-500/35 scale-105",
    bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-300", badge: "bg-purple-500",
  },
  {
    name: "emerald",
    defaultClasses: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/35 hover:border-emerald-400 hover:text-emerald-100 hover:shadow-emerald-500/25",
    selectedClasses: "border-emerald-400 bg-emerald-500/40 text-emerald-100 ring-1 ring-emerald-400/60 shadow-lg shadow-emerald-500/35 scale-105",
    bg: "bg-emerald-500/15", border: "border-emerald-400/30", text: "text-emerald-300", badge: "bg-emerald-500",
  },
  {
    name: "rose",
    defaultClasses: "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/35 hover:border-rose-400 hover:text-rose-100 hover:shadow-rose-500/25",
    selectedClasses: "border-rose-400 bg-rose-500/40 text-rose-100 ring-1 ring-rose-400/60 shadow-lg shadow-rose-500/35 scale-105",
    bg: "bg-rose-500/15", border: "border-rose-400/30", text: "text-rose-300", badge: "bg-rose-500",
  },
  {
    name: "sky",
    defaultClasses: "border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/35 hover:border-sky-400 hover:text-sky-100 hover:shadow-sky-500/25",
    selectedClasses: "border-sky-400 bg-sky-500/40 text-sky-100 ring-1 ring-sky-400/60 shadow-lg shadow-sky-500/35 scale-105",
    bg: "bg-sky-500/15", border: "border-sky-400/30", text: "text-sky-300", badge: "bg-sky-500",
  },
];

export const getTagColorStyle = (tagName: string) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NOTION_TAG_COLORS.length;
  return NOTION_TAG_COLORS[index];
};

export const getTagColorClasses = (tagName: string, isSelected: boolean = false) => {
  const style = getTagColorStyle(tagName);
  return isSelected ? style.selectedClasses : style.defaultClasses;
};

interface NotionTagInputProps {
  selectedTags: string[];
  onChangeSelectedTags: (tags: string[]) => void;
  existingTags?: string[];
  placeholder?: string;
}

/**
 * Notion-Style Tag Selector Component
 *
 * Provides auto-complete dropdown above input, Notion color pills,
 * and instant tag creation on Enter.
 */
export const NotionTagInput: React.FC<NotionTagInputProps> = ({
  selectedTags,
  onChangeSelectedTags,
  existingTags = [],
  placeholder = "Add tags...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter existing tags matching search query (excluding already selected ones)
  const filteredTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = existingTags.filter(
      (tag) => !selectedTags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
    );
    if (!q) return available;
    return available.filter((tag) => tag.toLowerCase().includes(q));
  }, [existingTags, selectedTags, query]);

  // Check if typed query is an exact match for an existing selected or available tag
  const isExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const allKnown = [...existingTags, ...selectedTags].map((t) => t.toLowerCase());
    return allKnown.includes(q);
  }, [existingTags, selectedTags, query]);

  const addTag = (tagName: string) => {
    const cleaned = tagName.trim().replace(/^#/, "");
    if (!cleaned) return;
    const exists = selectedTags.some(
      (t) => t.toLowerCase() === cleaned.toLowerCase()
    );
    if (!exists) {
      onChangeSelectedTags([...selectedTags, cleaned]);
    }
    setQuery("");
    setIsOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChangeSelectedTags(
      selectedTags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase())
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) {
        addTag(query);
      }
    } else if (e.key === "Backspace" && !query && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Notion Dropdown Popup (Positioned ABOVE input) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2.5 left-0 w-64 max-h-60 glass-card border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-y-auto space-y-1"
          >
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Select or Create Tag
            </div>

            {/* Create New Tag Option */}
            {!isExactMatch && query.trim().length > 0 && (
              <button
                type="button"
                onClick={() => addTag(query)}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer group border border-indigo-500/30 bg-indigo-500/10"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">
                    +
                  </span>
                  <span className="truncate">Create &ldquo;{query.trim()}&rdquo;</span>
                </div>
                <kbd className="text-[10px] font-mono text-zinc-400 group-hover:text-indigo-200">
                  ↵ Enter
                </kbd>
              </button>
            )}

            {/* Filtered Existing Tags List */}
            {filteredTags.map((tag) => {
              const style = getTagColorStyle(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <span className={`w-2 h-2 rounded-full ${style.badge}`} />
                  <span className="text-zinc-200 group-hover:text-white truncate">
                    #{tag}
                  </span>
                </button>
              );
            })}

            {filteredTags.length === 0 && isExactMatch && (
              <div className="p-3 text-center text-xs text-zinc-500">
                No matching tags available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tag Bar Input Container */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 transition-all cursor-text min-h-[46px]"
      >
        <span className="text-zinc-500 text-xs font-bold shrink-0">#</span>

        {/* Selected Notion Tag Pills */}
        {selectedTags.map((tag) => {
          const style = getTagColorStyle(tag);
          return (
            <motion.span
              key={tag}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.border} ${style.text} shrink-0`}
            >
              #{tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:opacity-100 opacity-60 ml-0.5 text-xs cursor-pointer"
              >
                ×
              </button>
            </motion.span>
          );
        })}

        {/* Search / New Tag Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? "Add tag..." : ""}
          className="bg-transparent text-xs font-medium text-white placeholder-zinc-500 focus:outline-none min-w-[70px] max-w-[120px]"
        />
      </div>
    </div>
  );
};
