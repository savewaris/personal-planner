import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { ConfirmModal } from "./ConfirmModal";

interface ContextManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Slate", value: "#64748b" },
];

export const ContextManagerModal: React.FC<ContextManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { contexts, createContext, updateContext, deleteContext } = usePlannerStore();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("#6366f1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteContextId, setPendingDeleteContextId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      await createContext(newName.trim(), newColor);
      setNewName("");
      setNewColor("#6366f1");
    } catch (err) {
      console.error("Failed to create context:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (ctx: { id: string; name: string; color?: string | null }) => {
    setEditingId(ctx.id);
    setEditingName(ctx.name);
    setEditingColor(ctx.color || "#6366f1");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateContext(id, editingName.trim(), editingColor);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update context:", err);
    }
  };

  const handleDeleteTrigger = (id: string) => {
    if (contexts.length <= 1) {
      alert("You must keep at least one workspace context!");
      return;
    }
    setPendingDeleteContextId(id);
  };

  const confirmDeleteContext = async () => {
    if (!pendingDeleteContextId) return;
    try {
      await deleteContext(pendingDeleteContextId);
    } catch (err) {
      console.error("Failed to delete context:", err);
    } finally {
      setPendingDeleteContextId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer z-40"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-50 bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Workspace Contexts Manager</h3>
                <p className="text-xs text-slate-500 font-medium">Create, edit, or remove workspace categorization contexts</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Create New Context Form */}
            <form onSubmit={handleCreate} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-extrabold text-slate-700 block">+ Add New Context</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Context name (e.g. Side Project, Work)..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold cursor-pointer"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-premium px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Existing Contexts List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Existing Contexts ({contexts.length})</span>
              {contexts.map((ctx) => {
                const isEditing = editingId === ctx.id;

                return (
                  <div
                    key={ctx.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-indigo-400 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <select
                          value={editingColor}
                          onChange={(e) => setEditingColor(e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        >
                          {COLOR_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(ctx.id)}
                          className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300"
                            style={{ backgroundColor: ctx.color || "#6366f1" }}
                          />
                          <span className="text-xs font-extrabold text-slate-800">{ctx.name}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditing(ctx)}
                            className="p-1 text-slate-400 hover:text-slate-700 text-xs font-bold"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTrigger(ctx.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 text-xs font-bold"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold hover:bg-slate-200 transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>

          {/* Custom Confirmation Modal */}
          <ConfirmModal
            isOpen={!!pendingDeleteContextId}
            onClose={() => setPendingDeleteContextId(null)}
            onConfirm={confirmDeleteContext}
            title="Are you sure you want to delete this context?"
            message="Associated tasks will be preserved and reassigned to your default context."
            confirmText="Delete Context"
            cancelText="Cancel"
            variant="danger"
          />
        </div>
      )}
    </AnimatePresence>
  );
};
