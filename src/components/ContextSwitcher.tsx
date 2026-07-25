"use client";

import React, { useState, useRef, useEffect } from "react";
import { useContextSwitcher } from "@/context/ContextSwitcherContext";
import { ColorIndicator } from "./ColorIndicator";
import { AddContextModal } from "./AddContextModal";
import { EditContextModal } from "./EditContextModal";
import { getColorTheme } from "@/lib/colors";

export interface ContextSwitcherProps {
  variant?: "dropdown" | "pills";
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  variant = "dropdown",
}) => {
  const {
    contexts,
    activeContextId,
    activeContext,
    setActiveContextId,
    addContext,
    updateContext,
    deleteContext,
  } = useContextSwitcher();

  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<{ id: string; name: string; color?: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (variant === "pills") {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar" data-testid="context-switcher">
        {/* All Contexts Pill */}
        <button
          type="button"
          onClick={() => setActiveContextId(null)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            activeContextId === null
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          All Contexts
        </button>

        {/* Individual Context Pills */}
        {contexts.map((ctx) => {
          const theme = getColorTheme(ctx.color);
          const isActive = activeContextId === ctx.id;
          return (
            <button
              key={ctx.id}
              type="button"
              data-testid={`context-option-${ctx.name.toLowerCase()}`}
              onClick={() => setActiveContextId(ctx.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? `${theme.badgeBgClass} ${theme.textClass} ${theme.borderClass} border ring-2 ${theme.ringClass}`
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              <ColorIndicator color={ctx.color} size="sm" />
              <span>{ctx.name}</span>
            </button>
          );
        })}

        {/* Add Context Button */}
        <button
          type="button"
          data-testid="add-context-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-colors text-xs font-medium cursor-pointer"
          title="Add Context"
        >
          + Add Context
        </button>

        <AddContextModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addContext}
        />
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Active Context Button Trigger */}
      <button
        type="button"
        data-testid="context-switcher"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-xs cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {activeContext ? (
          <>
            <ColorIndicator color={activeContext.color} />
            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[130px]">
              {activeContext.name}
            </span>
          </>
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              All Contexts
            </span>
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-50 overflow-hidden py-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-neutral-700/50">
            Workspaces & Contexts
          </div>

          {/* All Contexts Option */}
          <button
            type="button"
            onClick={() => {
              setActiveContextId(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ${
              activeContextId === null
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>All Contexts</span>
            </div>
            {activeContextId === null && <span className="text-blue-500 font-bold">✓</span>}
          </button>

          {/* Context List */}
          {contexts.map((ctx) => {
            const isSelected = activeContextId === ctx.id;
            return (
              <div
                key={ctx.id}
                data-testid={`context-option-${ctx.name.toLowerCase()}`}
                className={`group flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveContextId(ctx.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 flex-1 text-left truncate cursor-pointer"
                >
                  <ColorIndicator color={ctx.color} />
                  <span className="truncate">{ctx.name}</span>
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingContext({ id: ctx.id, name: ctx.name, color: ctx.color });
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded cursor-pointer"
                    title="Edit Context"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Context CTA */}
          <div className="p-1 border-t border-gray-100 dark:border-neutral-700 mt-1">
            <button
              type="button"
              data-testid="add-context-btn"
              onClick={() => {
                setIsOpen(false);
                setIsAddModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <span>+</span>
              <span>Create New Context</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Context Modal */}
      <AddContextModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addContext}
      />

      {/* Edit Context Modal */}
      {editingContext && (
        <EditContextModal
          isOpen={!!editingContext}
          context={editingContext}
          onClose={() => setEditingContext(null)}
          onUpdate={updateContext}
          onDelete={async (id) => {
            await deleteContext(id);
            setEditingContext(null);
          }}
        />
      )}
    </div>
  );
};
