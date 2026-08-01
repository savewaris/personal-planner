"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { ProjectItem, ProjectRequirement } from "@/services/api";
import { SystemWorkflowStudio, SYSTEM_WORKFLOW_PRESETS } from "@/components/SystemWorkflowStudio";

export default function ProjectsPage() {
  const { projects, createProject, updateProject, deleteProject } = usePlannerStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newWorkflow, setNewWorkflow] = useState<string>(SYSTEM_WORKFLOW_PRESETS[0].code);
  const [newReqs, setNewReqs] = useState<string[]>([""]);

  // Bulk Line Paste State
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState("");

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Inline Card Editing State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingWorkflow, setEditingWorkflow] = useState<string>("");

  // Parse Requirements Helper
  const parseReqs = (raw: any): ProjectRequirement[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  // Parse Workflow Helper
  const parseWorkflow = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return typeof raw === "string" && raw.trim() ? [raw] : [];
    }
  };

  // Handle Bulk Paste Lines
  const handleApplyBulkPaste = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const existingFiltered = newReqs.filter((r) => r.trim());
      setNewReqs([...existingFiltered, ...lines]);
    }
    setBulkPasteText("");
    setShowBulkPaste(false);
  };

  // Handle Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      setValidationError("Project title is required!");
      return;
    }
    setValidationError(null);

    const formattedReqs: ProjectRequirement[] = newReqs
      .filter((r) => r.trim())
      .map((r, idx) => ({ id: `req-${Date.now()}-${idx}`, text: r.trim(), completed: false }));

    await createProject({
      title: newTitle.trim(),
      description: newDescription.trim(),
      workflow: newWorkflow.trim(),
      requirements: formattedReqs,
    });

    setNewTitle("");
    setNewDescription("");
    setNewWorkflow(SYSTEM_WORKFLOW_PRESETS[0].code);
    setNewReqs([""]);
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

  // Add Requirement to Existing Project
  const addRequirementToProject = async (project: ProjectItem, text: string) => {
    if (!text.trim()) return;
    const currentReqs = parseReqs(project.requirements);
    const newReq: ProjectRequirement = {
      id: `req-${Date.now()}`,
      text: text.trim(),
      completed: false,
    };
    await updateProject(project.id, {
      requirements: [...currentReqs, newReq],
    });
  };

  // Delete Requirement from Existing Project
  const deleteRequirementFromProject = async (project: ProjectItem, reqId: string) => {
    const currentReqs = parseReqs(project.requirements);
    const updatedReqs = currentReqs.filter((r) => r.id !== reqId);
    await updateProject(project.id, {
      requirements: updatedReqs,
    });
  };

  // Inline Editing
  const startEditing = (project: ProjectItem) => {
    setEditingProjectId(project.id);
    setEditingTitle(project.title);
    setEditingDescription(project.description || "");
    setEditingWorkflow(project.workflow || "");
  };

  const saveEditing = async (projectId: string) => {
    if (!editingTitle.trim()) return;

    await updateProject(projectId, {
      title: editingTitle.trim(),
      description: editingDescription.trim(),
      workflow: editingWorkflow.trim(),
    });
    setEditingProjectId(null);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
  };

  return (
    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-10 max-w-full mx-auto w-full space-y-6 pb-12">
      {/* Header Level 1: Projects Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-2xl border border-white/15 shadow-2xl bg-gradient-to-r from-zinc-950/90 via-zinc-900/80 to-zinc-950/90 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            📁
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Projects</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                {projects.length}
              </span>
            </h1>
            <p className="text-sm text-zinc-400 font-medium">Store project descriptions, workflow timelines, and requirements checklists</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setValidationError(null);
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
        >
          <span>+ Create Project</span>
        </button>
      </div>

      {/* Creation Drawer Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-xl font-black text-white">Create New Project</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/50 bg-rose-500/15 text-rose-300 text-sm font-bold">
                  <span>⚠️</span>
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-5">
                {/* 📌 Project Title */}
                <div className="space-y-1.5">
                  <label className="text-base font-bold text-white flex items-center gap-1">
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
                    placeholder="e.g., Personal Planner App"
                    className="w-full bg-zinc-900 border border-white/10 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-base text-white outline-none transition-all font-semibold"
                  />
                </div>

                {/* 📝 Project Description */}
                <div className="space-y-1.5">
                  <label className="text-base font-bold text-indigo-300 flex items-center gap-1.5">
                    <span>📝</span>
                    <span>Project Description / Overview</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Enter project overview, goals, or scope notes..."
                    className="w-full bg-zinc-900 border border-white/10 focus:border-indigo-400 rounded-xl p-4 text-sm text-white outline-none transition-all font-medium"
                  />
                </div>

                {/* ⚙️ System & App Execution Workflow */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <SystemWorkflowStudio
                    code={newWorkflow}
                    onChangeCode={setNewWorkflow}
                    isEditable={true}
                  />
                </div>

                {/* 📋 Requirements Checklist */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>📋</span>
                      <span>Requirements Checklist</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBulkPaste(!showBulkPaste)}
                      className="text-xs font-extrabold text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
                    >
                      {showBulkPaste ? "✕ Close Bulk Paste" : "📋 Bulk Line Paste"}
                    </button>
                  </div>

                  {/* Bulk Line Paste Drawer */}
                  <AnimatePresence>
                    {showBulkPaste && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2 overflow-hidden"
                      >
                        <span className="text-xs font-bold text-cyan-300">Paste multiple lines below (each line = 1 requirement item):</span>
                        <textarea
                          rows={4}
                          value={bulkPasteText}
                          onChange={(e) => setBulkPasteText(e.target.value)}
                          placeholder={"Line 1 requirement...\nLine 2 requirement...\nLine 3 requirement..."}
                          className="w-full bg-zinc-900 border border-cyan-500/40 rounded-xl p-3 text-xs text-white outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleApplyBulkPaste}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-black text-xs cursor-pointer shadow-md"
                        >
                          ✓ Add Lines to Checklist
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Requirements List Inputs */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newReqs.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 w-5 shrink-0">{idx + 1}.</span>
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => {
                            const updated = [...newReqs];
                            updated[idx] = e.target.value;
                            setNewReqs(updated);
                          }}
                          placeholder={`Requirement ${idx + 1}...`}
                          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 font-medium"
                        />
                        {newReqs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewReqs(newReqs.filter((_, i) => i !== idx))}
                            className="text-zinc-500 hover:text-rose-400 text-sm font-bold px-2 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewReqs([...newReqs, ""])}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add Requirement Item</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 font-bold text-sm hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm shadow-lg cursor-pointer"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Grid Display */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-950/60 border border-white/10 space-y-3">
          <span className="text-4xl">📁</span>
          <h3 className="text-lg font-bold text-white">No projects created yet</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Click "+ Create Project" above to add your first project description, workflow steps, and requirements checklist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const reqs = parseReqs(project.requirements);
            const workflowSteps = parseWorkflow(project.workflow);
            const completedCount = reqs.filter((r) => r.completed).length;
            const progressPct = reqs.length > 0 ? Math.round((completedCount / reqs.length) * 100) : 0;
            const isEditingThis = editingProjectId === project.id;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-zinc-950/90 border border-white/15 p-6 shadow-xl space-y-5 flex flex-col justify-between"
              >
                {isEditingThis ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400">Project Title</label>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-indigo-400 rounded-xl px-3.5 py-2 text-base text-white outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400">Description / Overview</label>
                      <textarea
                        rows={3}
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="w-full bg-zinc-900 border border-indigo-400 rounded-xl p-3 text-sm text-white outline-none font-medium"
                      />
                    </div>

                    {/* Workflow Editing */}
                    <div className="space-y-2">
                      <SystemWorkflowStudio
                        code={editingWorkflow}
                        onChangeCode={setEditingWorkflow}
                        isEditable={true}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3 py-1.5 rounded-xl text-zinc-400 text-xs font-bold hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditing(project.id)}
                        className="px-4 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs cursor-pointer shadow-md"
                      >
                        ✓ Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Project Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-black text-lg flex items-center justify-center shrink-0">
                          📌
                        </div>
                        <h2 className="text-xl font-extrabold text-white leading-snug">{project.title}</h2>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(project)}
                          title="Edit Project"
                          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProject(project.id)}
                          title="Delete Project"
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 border border-white/5 p-4 rounded-2xl whitespace-pre-wrap font-medium">
                        {project.description}
                      </p>
                    )}

                    {/* ⚙️ System & App Execution Workflow */}
                    {project.workflow && project.workflow.trim() && (
                      <div className="pt-1">
                        <SystemWorkflowStudio code={project.workflow} isEditable={false} />
                      </div>
                    )}

                    {/* Requirements Checklist & Progress Bar */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                          <span>📋</span>
                          <span>Requirements Checklist</span>
                        </span>
                        <span className="font-bold text-zinc-400">
                          {completedCount} of {reqs.length} ({progressPct}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {reqs.length > 0 && (
                        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-white/5">
                          <div
                            style={{ width: `${progressPct}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                          />
                        </div>
                      )}

                      {/* Checklist Items */}
                      <div className="space-y-2">
                        {reqs.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-white/5 hover:border-white/10 transition-colors group"
                          >
                            <button
                              type="button"
                              onClick={() => toggleRequirement(project, req.id)}
                              className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                            >
                              <span
                                className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-black transition-all ${
                                  req.completed
                                    ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                                    : "border-zinc-700 bg-zinc-950 text-transparent group-hover:border-zinc-500"
                                }`}
                              >
                                ✓
                              </span>
                              <span
                                className={`text-sm font-semibold transition-all ${
                                  req.completed ? "line-through text-zinc-500" : "text-zinc-200"
                                }`}
                              >
                                {req.text}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteRequirementFromProject(project, req.id)}
                              className="text-zinc-600 hover:text-rose-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Quick Add Requirement Input */}
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder="+ Add new requirement (Press Enter)..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                              addRequirementToProject(project, e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}
