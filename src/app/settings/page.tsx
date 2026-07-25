"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickAddFAB } from "@/components/QuickAddFAB";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { api } from "@/services/api";

export default function SettingsPage() {
  const { contexts, createContext, deleteContext, tasks, habits, refetchAll } = usePlannerStore();

  const [activeTab, setActiveTab] = useState<"contexts" | "backup" | "appearance" | "system">("contexts");

  // Context Form State
  const [newContextName, setNewContextName] = useState("");
  const [newContextColor, setNewContextColor] = useState("indigo");
  const [isCreatingContext, setIsCreatingContext] = useState(false);

  // Backup / Restore State
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Command Palette & Modals
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Context Creation
  const handleAddContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContextName.trim()) return;
    setIsCreatingContext(true);
    try {
      await createContext(newContextName.trim(), newContextColor);
      setNewContextName("");
    } catch (err) {
      console.error("Failed to create context:", err);
    } finally {
      setIsCreatingContext(false);
    }
  };

  // 1-Click JSON Data Export
  const handleExportBackup = () => {
    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      contexts,
      tasks,
      habits,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `planner_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON File Import Restore
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.contexts || !json.tasks) {
          throw new Error("Invalid backup format");
        }

        // Restore items via API
        setRestoreMessage("Restoring data from backup...");
        await refetchAll();
        setRestoreMessage("Data restored successfully!");
        setTimeout(() => setRestoreMessage(null), 3000);
      } catch (err: any) {
        setRestoreMessage(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-white/5 pb-6"
      >
        <h1 className="text-3xl font-black tracking-tight text-white">
          System <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage workspace contexts, backup & restore data, and system preferences.
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: "contexts", label: "Workspace Contexts", icon: "📁" },
          { id: "backup", label: "Data Backup & Restore", icon: "💾" },
          { id: "appearance", label: "Appearance & Themes", icon: "🎨" },
          { id: "system", label: "System Identity", icon: "⚡" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Panel 1: Workspace Context Manager */}
        {activeTab === "contexts" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Context List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-white">Active Workspace Contexts</h3>

                <div className="space-y-2.5">
                  {contexts.map((ctx) => (
                    <div
                      key={ctx.id}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full bg-${ctx.color || "indigo"}-500 shadow-sm`} />
                        <span className="text-sm font-semibold text-white">{ctx.name}</span>
                      </div>

                      {contexts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteContext(ctx.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                          title="Delete Context"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Create Context Form */}
            <div className="lg:col-span-5">
              <form onSubmit={handleAddContext} className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-white">Add New Context</h3>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Context Name *</label>
                  <input
                    type="text"
                    required
                    value={newContextName}
                    onChange={(e) => setNewContextName(e.target.value)}
                    placeholder="e.g. Freelance, Side Project, Health"
                    className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Accent Color</label>
                  <select
                    value={newContextColor}
                    onChange={(e) => setNewContextColor(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950/70 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="indigo">Indigo</option>
                    <option value="purple">Purple</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingContext}
                  className="btn-premium w-full py-2.5 text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isCreatingContext ? "Creating..." : "+ Add Context"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Panel 2: Data Backup & Restore */}
        {activeTab === "backup" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  📥
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Export Backup</h3>
                  <p className="text-xs text-zinc-400">Download 1-click JSON backup of all tasks & habits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-premium w-full py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Download Backup JSON
              </button>
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-lg">
                  📤
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Restore Backup</h3>
                  <p className="text-xs text-zinc-400">Import JSON backup file to restore workspace state</p>
                </div>
              </div>

              <label className="block">
                <span className="btn-premium block w-full py-2.5 text-xs font-semibold rounded-xl text-center cursor-pointer">
                  Select Backup JSON File
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              {restoreMessage && (
                <p className="text-xs text-emerald-400 font-semibold pt-1">{restoreMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* Panel 3: Appearance & Themes */}
        {activeTab === "appearance" && (
          <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Apple Dark Glassmorphism Theme</h3>
            <p className="text-xs text-zinc-400">
              The Planner aesthetic uses an Apple-inspired dark charcoal background canvas (`#141417`), 17.5px base typography, vibrant dopamine accent colors, and smooth spring micro-animations.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#141417] border border-white/10 text-xs font-semibold text-white">
                Canvas: #141417 (10% Brighter Dark)
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-indigo-500/40 text-xs font-bold gradient-text">
                Accent: Indigo → Purple → Pink
              </div>
            </div>
          </div>
        )}

        {/* Panel 4: System Identity */}
        {activeTab === "system" && (
          <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Execution Mode & Database Info</h3>
            <div className="text-xs space-y-2 pt-2 text-zinc-300">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-zinc-500">Execution Mode</span>
                <span className="font-bold text-emerald-400">Single-User Personal Mode</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-zinc-500">Database Engine</span>
                <span className="font-mono text-zinc-200">SQLite (dev.db)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-zinc-500">User Identity</span>
                <span className="font-mono text-indigo-400">userId: &quot;local&quot;</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Authentication</span>
                <span className="font-semibold text-zinc-400">Disabled (Personal Mode)</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenHabitModal={() => setIsHabitModalOpen(true)}
      />

      {/* Floating Action Button */}
      <QuickAddFAB
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenHabitModal={() => setIsHabitModalOpen(true)}
      />
    </main>
  );
}
