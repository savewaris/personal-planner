"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { ProjectItem, ProjectRequirement } from "@/services/api";
import { NotionTagInput, getTagColorClasses } from "@/components/NotionTagInput";

const REQUIREMENT_PRESETS = [
  {
    name: "🌐 Full-Stack Web App",
    items: [
      "Implement Next.js App Router & TypeScript architecture",
      "Design dark glassmorphism UI & responsive design system",
      "Setup Prisma ORM & PostgreSQL / Neon database connection",
      "Build REST API endpoints with input validation",
      "Integrate Google OAuth / NextAuth authentication",
      "Deploy build to Vercel with zero compiler errors",
    ],
  },
  {
    name: "📱 Mobile App",
    items: [
      "Setup cross-platform mobile project architecture",
      "Build responsive UI layout with dark/light theme switching",
      "Implement state management (Provider / Riverpod / Zustand)",
      "Integrate REST / GraphQL backend APIs & offline storage",
      "Setup push notifications & biometric auth",
    ],
  },
  {
    name: "🤖 AI / SaaS App",
    items: [
      "Setup Next.js frontend with Tailwind CSS & Framer Motion",
      "Integrate OpenAI / Gemini API with streaming responses",
      "Setup database user quotas, rate limiting, and analytics",
      "Implement Stripe subscription billing & webhooks",
      "Build user dashboard with optimistic UI updates",
    ],
  },
];

export default function ProjectsPage() {
  const { projects, createProject, updateProject, deleteProject } = usePlannerStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newScope, setNewScope] = useState("");
  const [newDeliverables, setNewDeliverables] = useState("");
  const [newReqs, setNewReqs] = useState<string[]>([""]);
  const [newTechStack, setNewTechStack] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  // Expandable Form Input Visibility States
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [showScopeInput, setShowScopeInput] = useState(false);
  const [showDeliverablesInput, setShowDeliverablesInput] = useState(false);
  const [showSummaryInput, setShowSummaryInput] = useState(false);

  // Bulk Paste State
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState("");

  // Project-Themed Validation State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Editing State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSummary, setEditingSummary] = useState("");
  const [editingGoal, setEditingGoal] = useState("");
  const [editingScope, setEditingScope] = useState("");
  const [editingDeliverables, setEditingDeliverables] = useState("");

  // Parse JSON or Array helpers
  const parseReqs = (raw: any): ProjectRequirement[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseTech = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof raw === "string" ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    }
  };

  const parseTags = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof raw === "string" ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    }
  };

  // Handle Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      setValidationError("Please fill out the Project Title field.");
      return;
    }

    setValidationError(null);

    const formattedReqs: ProjectRequirement[] = newReqs
      .filter((r) => r.trim())
      .map((r, idx) => ({ id: `req-${Date.now()}-${idx}`, text: r.trim(), completed: false }));

    const formattedTech = newTechStack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await createProject({
      title: newTitle.trim(),
      description: newSummary.trim(),
      goal: newGoal.trim(),
      scope: newScope.trim(),
      deliverables: newDeliverables.trim(),
      requirements: formattedReqs,
      techStack: formattedTech,
      tags: JSON.stringify(newTags),
    });

    setNewTitle("");
    setNewSummary("");
    setNewGoal("");
    setNewScope("");
    setNewDeliverables("");
    setNewReqs([""]);
    setNewTechStack("");
    setNewTags([]);
    setShowGoalInput(false);
    setShowScopeInput(false);
    setShowDeliverablesInput(false);
    setShowSummaryInput(false);
    setIsCreateOpen(false);
  };

  // Toggle Requirement Completion
  const toggleRequirement = async (project: ProjectItem, reqId: string) => {
    const currentReqs = parseReqs(project.requirements);
    const updatedReqs = currentReqs.map((r) => (r.id === reqId ? { ...r, completed: !r.completed } : r));

    await updateProject(project.id, {
      requirements: updatedReqs,
    });
  };

  // Start Editing Inline
  const startEditing = (project: ProjectItem) => {
    setEditingProjectId(project.id);
    setEditingTitle(project.title);
    setEditingSummary(project.description || "");
    setEditingGoal(project.goal || "");
    setEditingScope(project.scope || "");
    setEditingDeliverables(project.deliverables || "");
  };

  const saveEditing = async (projectId: string) => {
    if (!editingTitle.trim()) return;
    await updateProject(projectId, {
      title: editingTitle.trim(),
      description: editingSummary.trim(),
      goal: editingGoal.trim(),
      scope: editingScope.trim(),
      deliverables: editingDeliverables.trim(),
    });
    setEditingProjectId(null);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
  };

  return (
    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-10 max-w-full mx-auto w-full space-y-6 pb-12">
      {/* Level 1 Header: Projects Hub Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-5 rounded-2xl border border-white/15 shadow-2xl bg-gradient-to-r from-zinc-950/90 via-zinc-900/80 to-zinc-950/90 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
            🚀
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Projects Hub
            </h1>
            <p className="text-xs font-semibold text-zinc-400">
              Build, track requirements, and store project specifications
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(!isCreateOpen);
            setValidationError(null);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/25 flex items-center gap-2 shrink-0"
        >
          <span>{isCreateOpen ? "✕ Close" : "+ New Project Spec"}</span>
        </button>
      </div>

      {/* New Project Form Drawer */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateProject}
            noValidate
            className="glass-card p-5 rounded-2xl border border-indigo-500/30 space-y-4 overflow-hidden bg-zinc-950/90 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>✨</span> Create New Project Specification
              </h2>
              <span className="text-xs text-zinc-400 font-semibold">Structured Goal, Scope & Deliverables</span>
            </div>

            {/* Project-Themed Custom Validation Prompt Banner */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-500/50 bg-rose-500/15 text-rose-300 text-xs font-extrabold shadow-lg shadow-rose-500/10"
              >
                <span className="w-5 h-5 rounded-lg bg-rose-500 text-zinc-950 flex items-center justify-center font-black text-xs shrink-0">
                  !
                </span>
                <span>{validationError}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title Input */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-lg font-bold text-white flex items-center gap-1">
                  <span>Project Title</span>
                  <span className="text-rose-400 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (e.target.value.trim()) setValidationError(null);
                  }}
                  placeholder="e.g., Personal Planner Pro Max"
                  className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2 text-base text-white outline-none transition-all font-semibold ${
                    validationError
                      ? "border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20"
                      : "border-white/10 focus:border-indigo-400"
                  }`}
                />
              </div>

              {/* 🎯 Project Goal */}
              <div className="space-y-2">
                {!showGoalInput && !newGoal ? (
                  <button
                    type="button"
                    onClick={() => setShowGoalInput(true)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-500/10 text-amber-300 hover:text-amber-100 hover:border-amber-300 hover:bg-amber-500/20 text-sm font-black transition-all text-left flex items-center justify-between cursor-pointer shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-lg font-bold">Project Goal</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-zinc-950 font-black text-xs group-hover:scale-105 transition-transform">
                      + Add Goal
                    </span>
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <label className="text-lg font-bold text-amber-300 flex items-center gap-2">
                      <span>🎯</span> Project Goal
                    </label>
                    <textarea
                      rows={2}
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Primary objective & target outcome..."
                      className="w-full bg-zinc-900 border border-amber-400/60 rounded-xl px-3.5 py-2 text-base text-white outline-none focus:border-amber-400 transition-all font-medium"
                    />
                  </motion.div>
                )}
              </div>

              {/* 📐 Project Scope */}
              <div className="space-y-2">
                {!showScopeInput && !newScope ? (
                  <button
                    type="button"
                    onClick={() => setShowScopeInput(true)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-indigo-400/60 bg-indigo-500/10 text-indigo-300 hover:text-indigo-100 hover:border-indigo-300 hover:bg-indigo-500/20 text-sm font-black transition-all text-left flex items-center justify-between cursor-pointer shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📐</span>
                      <span className="text-lg font-bold">Project Scope</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-400 text-zinc-950 font-black text-xs group-hover:scale-105 transition-transform">
                      + Add Scope
                    </span>
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <label className="text-lg font-bold text-indigo-300 flex items-center gap-2">
                      <span>📐</span> Project Scope
                    </label>
                    <textarea
                      rows={2}
                      value={newScope}
                      onChange={(e) => setNewScope(e.target.value)}
                      placeholder="In-scope features & boundary limits..."
                      className="w-full bg-zinc-900 border border-indigo-400/60 rounded-xl px-3.5 py-2 text-base text-white outline-none focus:border-indigo-400 transition-all font-medium"
                    />
                  </motion.div>
                )}
              </div>

              {/* 📦 Key Deliverables */}
              <div className="space-y-2">
                {!showDeliverablesInput && !newDeliverables ? (
                  <button
                    type="button"
                    onClick={() => setShowDeliverablesInput(true)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/10 text-emerald-300 hover:text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500/20 text-sm font-black transition-all text-left flex items-center justify-between cursor-pointer shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📦</span>
                      <span className="text-lg font-bold">Key Deliverables</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-400 text-zinc-950 font-black text-xs group-hover:scale-105 transition-transform">
                      + Add Deliverables
                    </span>
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <label className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                      <span>📦</span> Key Deliverables & Output
                    </label>
                    <textarea
                      rows={2}
                      value={newDeliverables}
                      onChange={(e) => setNewDeliverables(e.target.value)}
                      placeholder="Expected outputs, milestones & tech specs..."
                      className="w-full bg-zinc-900 border border-emerald-400/60 rounded-xl px-3.5 py-2 text-base text-white outline-none focus:border-emerald-400 transition-all font-medium"
                    />
                  </motion.div>
                )}
              </div>

              {/* 📝 Overview Summary */}
              <div className="space-y-2">
                {!showSummaryInput && !newSummary ? (
                  <button
                    type="button"
                    onClick={() => setShowSummaryInput(true)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-purple-400/60 bg-purple-500/10 text-purple-300 hover:text-purple-100 hover:border-purple-300 hover:bg-purple-500/20 text-sm font-black transition-all text-left flex items-center justify-between cursor-pointer shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <span className="text-lg font-bold">Overview Summary</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-400 text-zinc-950 font-black text-xs group-hover:scale-105 transition-transform">
                      + Add Summary
                    </span>
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <label className="text-lg font-bold text-purple-300 flex items-center gap-2">
                      <span>📝</span> Overview Summary
                    </label>
                    <textarea
                      rows={2}
                      value={newSummary}
                      onChange={(e) => setNewSummary(e.target.value)}
                      placeholder="Brief high-level overview..."
                      className="w-full bg-zinc-900 border border-purple-400/60 rounded-xl px-3.5 py-2 text-base text-white outline-none focus:border-purple-400 transition-all font-medium"
                    />
                  </motion.div>
                )}
              </div>

              {/* Requirements Checklist Inputs */}
              <div className="md:col-span-2 space-y-3 pt-2 border-t border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📋 Project Requirements Checklist</span>
                  </label>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowBulkPaste(!showBulkPaste)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>📋</span> Bulk Paste
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewReqs((prev) => [...prev, ""])}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                {/* ⚡ Quick Presets Pill Bar */}
                <div className="flex items-center gap-2 flex-wrap p-2.5 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-xs font-extrabold text-zinc-400 shrink-0">⚡ Quick Presets:</span>
                  {REQUIREMENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setNewReqs(preset.items);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/20 text-zinc-200 hover:text-indigo-200 text-xs font-bold transition-all cursor-pointer"
                      title="Click to populate requirements checklist with this preset"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Bulk Paste Box */}
                {showBulkPaste && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 p-3 rounded-xl bg-zinc-900 border border-amber-400/40">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-300">Paste multi-line requirements (one item per line):</label>
                      <button type="button" onClick={() => setShowBulkPaste(false)} className="text-xs text-zinc-400 font-bold hover:text-white">✕</button>
                    </div>
                    <textarea
                      rows={4}
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder="- Requirement line 1&#10;- Requirement line 2&#10;- Requirement line 3"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400 transition-all font-mono"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const lines = bulkPasteText
                            .split("\n")
                            .map((line) => line.replace(/^[\s\-\*\d\.\(\)\[\]xX]+/, "").trim())
                            .filter(Boolean);

                          if (lines.length > 0) {
                            setNewReqs(lines);
                            setBulkPasteText("");
                            setShowBulkPaste(false);
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer hover:bg-amber-300"
                      >
                        Import Lines ✨
                      </button>
                    </div>
                  </motion.div>
                )}

                {newReqs.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => {
                        const updated = [...newReqs];
                        updated[idx] = e.target.value;
                        setNewReqs(updated);
                      }}
                      placeholder={`Requirement #${idx + 1} (e.g. Implement Next.js App Router)`}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-base text-white outline-none focus:border-indigo-400 transition-all font-medium"
                    />
                    {newReqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewReqs((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-rose-400 text-xs px-2 py-1 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tech Stack Tags */}
              <div className="space-y-1.5">
                <label className="text-lg font-bold text-white">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  placeholder="React, Next.js, Prisma, TailwindCSS, Neon"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-base text-white outline-none focus:border-indigo-400 transition-all font-medium"
                />
              </div>

              {/* Notion Tags Input */}
              <div className="space-y-1.5">
                <label className="text-lg font-bold text-white">Notion Tags</label>
                <NotionTagInput selectedTags={newTags} onChangeSelectedTags={setNewTags} placeholder="Add tag & press Enter..." />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setValidationError(null);
                }}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold text-sm hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Save Project Spec ✨
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Projects Feed */}
      {projects.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-white/10 text-center space-y-3 bg-zinc-950/60">
          <div className="text-4xl">🚀</div>
          <h3 className="text-xl font-bold text-white">No Projects Stored</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Create your first project specification to store Goal, Scope, Deliverables, requirements, and tech stack!
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            + Create Project Spec
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {projects.map((project) => {
              const reqs = parseReqs(project.requirements);
              const tech = parseTech(project.techStack);
              const tags = parseTags(project.tags);
              const isEditingThis = editingProjectId === project.id;

              const hasGoal = Boolean(project.goal && project.goal.trim());
              const hasScope = Boolean(project.scope && project.scope.trim());
              const hasDeliverables = Boolean(project.deliverables && project.deliverables.trim());

              const completedReqs = reqs.filter((r) => r.completed).length;
              const progressPct = reqs.length > 0 ? Math.round((completedReqs / reqs.length) * 100) : 0;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isEditingThis
                      ? "border-amber-400/80 bg-zinc-950 shadow-2xl ring-1 ring-amber-400/50"
                      : "border-white/10 hover:border-indigo-500/40 bg-zinc-900/70 shadow-lg"
                  }`}
                >
                  {/* Card Header & Structured Specs */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      {isEditingThis ? (
                        <div className="flex flex-col gap-3 w-full">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            autoFocus
                            placeholder="Edit project title..."
                            className="w-full bg-zinc-900 border border-amber-400/80 rounded-xl px-3 py-1.5 text-lg text-white outline-none font-bold"
                          />

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-300">🎯 Goal</label>
                            <textarea
                              rows={2}
                              value={editingGoal}
                              onChange={(e) => setEditingGoal(e.target.value)}
                              placeholder="Edit goal..."
                              className="w-full bg-zinc-900 border border-amber-400/80 rounded-xl px-3 py-1 text-base text-white outline-none font-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-indigo-300">📐 Scope</label>
                            <textarea
                              rows={2}
                              value={editingScope}
                              onChange={(e) => setEditingScope(e.target.value)}
                              placeholder="Edit scope..."
                              className="w-full bg-zinc-900 border border-amber-400/80 rounded-xl px-3 py-1 text-base text-white outline-none font-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-300">📦 Deliverables</label>
                            <textarea
                              rows={2}
                              value={editingDeliverables}
                              onChange={(e) => setEditingDeliverables(e.target.value)}
                              placeholder="Edit deliverables..."
                              className="w-full bg-zinc-900 border border-amber-400/80 rounded-xl px-3 py-1 text-base text-white outline-none font-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-purple-300">📝 Overview Summary</label>
                            <textarea
                              rows={2}
                              value={editingSummary}
                              onChange={(e) => setEditingSummary(e.target.value)}
                              placeholder="Edit summary..."
                              className="w-full bg-zinc-900 border border-amber-400/80 rounded-xl px-3 py-1 text-base text-white outline-none font-medium"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => saveEditing(project.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold text-xs cursor-pointer"
                            >
                              ✓ Save Spec
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-2.5 py-1.5 rounded-xl text-zinc-400 font-bold text-xs cursor-pointer"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-1">
                          <h3
                            onClick={() => startEditing(project)}
                            title="Click to edit project spec inline"
                            className="text-lg font-bold text-white hover:text-amber-300 cursor-pointer transition-colors break-words leading-snug"
                          >
                            {project.title}
                          </h3>

                          {/* Overview Summary */}
                          {project.description && (
                            <p className="text-base font-medium text-zinc-300 break-words leading-relaxed">
                              {project.description}
                            </p>
                          )}

                          {/* Structured Badges: Goal, Scope, Deliverables */}
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {hasGoal ? (
                              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-0.5">
                                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1">
                                  <span>🎯</span> Goal
                                </span>
                                <p className="text-sm font-medium text-amber-100 break-words leading-snug">
                                  {project.goal}
                                </p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(project)}
                                className="w-full p-2.5 rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-500/10 text-amber-300 hover:text-amber-100 hover:border-amber-300 hover:bg-amber-500/20 text-xs font-black transition-all text-left flex items-center justify-between cursor-pointer shadow-sm group"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>🎯</span>
                                  <span>Project Goal:</span>
                                  <span className="font-medium text-zinc-400 group-hover:text-amber-200 italic">Not set yet</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 font-black text-[11px] group-hover:scale-105 transition-transform">
                                  + Add Goal
                                </span>
                              </button>
                            )}

                            {hasScope ? (
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-0.5">
                                <span className="text-xs font-extrabold text-indigo-300 flex items-center gap-1">
                                  <span>📐</span> Scope
                                </span>
                                <p className="text-sm font-medium text-indigo-100 break-words leading-snug">
                                  {project.scope}
                                </p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(project)}
                                className="w-full p-2.5 rounded-xl border-2 border-dashed border-indigo-400/60 bg-indigo-500/10 text-indigo-300 hover:text-indigo-100 hover:border-indigo-300 hover:bg-indigo-500/20 text-xs font-black transition-all text-left flex items-center justify-between cursor-pointer shadow-sm group"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>📐</span>
                                  <span>Project Scope:</span>
                                  <span className="font-medium text-zinc-400 group-hover:text-indigo-200 italic">Not set yet</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-indigo-400 text-zinc-950 font-black text-[11px] group-hover:scale-105 transition-transform">
                                  + Add Scope
                                </span>
                              </button>
                            )}

                            {hasDeliverables ? (
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-0.5">
                                <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1">
                                  <span>📦</span> Key Deliverables
                                </span>
                                <p className="text-sm font-medium text-emerald-100 break-words leading-snug">
                                  {project.deliverables}
                                </p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(project)}
                                className="w-full p-2.5 rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/10 text-emerald-300 hover:text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500/20 text-xs font-black transition-all text-left flex items-center justify-between cursor-pointer shadow-sm group"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>📦</span>
                                  <span>Deliverables:</span>
                                  <span className="font-medium text-zinc-400 group-hover:text-emerald-200 italic">Not set yet</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-zinc-950 font-black text-[11px] group-hover:scale-105 transition-transform">
                                  + Add Deliverables
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {!isEditingThis && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditing(project)}
                            title="Edit project spec"
                            className="p-1 rounded-lg text-zinc-500 hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProject(project.id)}
                            title="Delete project"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Requirements Progress Bar & Checklist */}
                    {reqs.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                          <span>Requirements Spec Checklist</span>
                          <span className="text-amber-400">{completedReqs}/{reqs.length} ({progressPct}%)</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-1.5 pt-1">
                          {reqs.map((req) => (
                            <div
                              key={req.id}
                              onClick={() => toggleRequirement(project, req.id)}
                              className="flex items-center gap-2.5 text-base font-semibold cursor-pointer group hover:text-white transition-colors"
                            >
                              <div
                                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                  req.completed
                                    ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                                    : "border-white/20 bg-white/5 group-hover:border-indigo-400"
                                }`}
                              >
                                {req.completed && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`flex-1 break-words leading-snug ${
                                  req.completed ? "line-through text-zinc-500 font-normal" : "text-zinc-200"
                                }`}
                              >
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Tech Stack & Notion Tags */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    {/* Tech Stack Pills */}
                    {tech.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-zinc-500 shrink-0">Tech:</span>
                        {tech.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-xs font-semibold bg-zinc-800 border border-white/10 text-zinc-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notion Tags */}
                    {tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tags.map((t) => {
                          const colorClasses = getTagColorClasses(t, false);

                          return (
                            <span
                              key={t}
                              className={`px-2.5 py-0.5 rounded-full text-sm font-semibold border shrink-0 ${colorClasses}`}
                            >
                              #{t}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
