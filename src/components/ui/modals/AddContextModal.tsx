"use client";

import React, { useState } from "react";
import { COLOR_PALETTE, ContextColor } from "@/lib/theme";

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; color: string }) => Promise<any>;
}

export const AddContextModal: React.FC<AddContextModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<ContextColor>("blue");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Context name cannot be empty");
      return;
    }
    if (trimmed.length > 50) {
      setError("Context name exceeds maximum length of 50 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAdd({ name: trimmed, color: selectedColor });
      setName("");
      setSelectedColor("blue");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create context");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Create New Context
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Context Name
            </label>
            <input
              type="text"
              name="contextName"
              data-testid="context-name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Work, Personal, Side Projects"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {name.length}/50
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(COLOR_PALETTE).map((colorOpt) => (
                <button
                  key={colorOpt.id}
                  type="button"
                  onClick={() => setSelectedColor(colorOpt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    selectedColor === colorOpt.id
                      ? `${colorOpt.borderClass} ${colorOpt.badgeBgClass} ${colorOpt.textClass} ring-2 ${colorOpt.ringClass}`
                      : "border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${colorOpt.dotBgClass}`} />
                  {colorOpt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-context-btn"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Save Context"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
