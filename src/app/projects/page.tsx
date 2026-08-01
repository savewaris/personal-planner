"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { ProjectItem, ProjectRequirement } from "@/services/api";

const DRAWIO_URL = "https://app.diagrams.net/";

const getEmbedUrl = (rawUrl: string) => {
  if (!rawUrl) return "";
  let url = rawUrl.trim();

  // 1. Fix double-hash corruption if present (e.g. #R#G -> #G)
  url = url.replace("#R#G", "#G");
  url = url.replace("#R#", "#");

  // 2. Use viewer.diagrams.net for iframe cross-origin permission
  if (url.includes("app.diagrams.net")) {
    url = url.replace("app.diagrams.net", "viewer.diagrams.net");
  } else if (url.includes("draw.io")) {
    url = url.replace("draw.io", "viewer.diagrams.net");
  }

  // 3. Ensure query parameters are placed BEFORE the fragment hash
  if (url.includes("#")) {
    const parts = url.split("#");
    const baseUrl = parts[0];
    const hash = parts.slice(1).join("#");

    let cleanBase = baseUrl;
    if (!cleanBase.includes("lightbox=1") && !cleanBase.includes("embed=1")) {
      cleanBase = cleanBase.includes("?") ? `${cleanBase}&lightbox=1` : `${cleanBase}?lightbox=1`;
    }
    return `${cleanBase}#${hash}`;
  }

  if (!url.includes("lightbox=1") && !url.includes("embed=1")) {
    url = url.includes("?") ? `${url}&lightbox=1` : `${url}?lightbox=1`;
  }
  return url;
};

export default function ProjectsPage() {
  const { projects, createProject, updateProject, deleteProject } = usePlannerStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(true);

  // Auto-select first project on load if none selected
  useEffect(() => {
    if (projects.length > 0 && (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId))) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Selected Project Item
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newWorkflowLink, setNewWorkflowLink] = useState("");
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
  const [editingWorkflowLink, setEditingWorkflowLink] = useState("");

  // Side Studio Flowchart Input Edit State
  const [studioWorkflowInput, setStudioWorkflowInput] = useState("");

  useEffect(() => {
    if (selectedProject) {
      setStudioWorkflowInput(selectedProject.workflow || "");
    }
  }, [selectedProject?.id, selectedProject?.workflow]);

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

    const created = await createProject({
      title: newTitle.trim(),
      description: newDescription.trim(),
      workflow: newWorkflowLink.trim(),
      requirements: formattedReqs,
    });

    if (created && created.id) {
      setSelectedProjectId(created.id);
    }

    setNewTitle("");
    setNewDescription("");
    setNewWorkflowLink("");
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
    setEditingWorkflowLink(project.workflow || "");
  };

  const saveEditing = async (projectId: string) => {
    if (!editingTitle.trim()) return;

    await updateProject(projectId, {
      title: editingTitle.trim(),
      description: editingDescription.trim(),
      workflow: editingWorkflowLink.trim(),
    });
    setEditingProjectId(null);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
  };

  // Save Side Studio Workflow Link Update
  const handleSaveStudioWorkflow = async () => {
    if (!selectedProject) return;
    await updateProject(selectedProject.id, {
      workflow: studioWorkflowInput.trim(),
    });
  };

  return (
    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-[1700px] mx-auto w-full space-y-6 pb-12">
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

                {/* 🔗 External Flowchart Link (Draw.io) */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>🔗</span>
                      <span>External Flowchart Link</span>
                    </label>
                    <a
                      href={DRAWIO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <span>🎨 Open Draw.io Editor (Free & Unlimited)</span>
                      <span>↗</span>
                    </a>
                  </div>
                  <input
                    type="url"
                    value={newWorkflowLink}
                    onChange={(e) => setNewWorkflowLink(e.target.value)}
                    placeholder="Paste flowchart URL (e.g. https://app.diagrams.net/?lightbox=1...)"
                    className="w-full bg-zinc-900 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-2 text-sm text-white outline-none font-medium"
                  />
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-orange-500/30 space-y-2 text-xs text-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold flex items-center gap-1.5 text-orange-300 text-xs">
                        <span>⚡</span>
                        <span>How to get Instant Visual Preview (No Google Drive Authorization!):</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                        ✓ 0ms Instant Load
                      </span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 font-medium pl-1 text-[11px] text-zinc-300">
                      <li>In Draw.io top menu, click <strong>File</strong> → <strong>Export as</strong> → <strong>URL...</strong></li>
                      <li>Click the <strong>Create</strong> button.</li>
                      <li>Copy the generated web link and paste it into the box above!</li>
                    </ol>
                    <p className="text-[10px] text-zinc-400 font-medium italic pt-1 border-t border-orange-500/20">
                      ✨ Exporting as URL encodes your diagram data directly into the link, so anyone can see your visual flowchart hover preview instantly without logging into Google Drive!
                    </p>
                  </div>
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

      {/* 60% Left / 40% Right Split Page Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN: Header & Projects Grid */}
        <div className={`w-full flex-1 space-y-6 transition-all duration-300 ${isStudioOpen ? "lg:w-[58%] xl:w-[60%]" : "w-full"}`}>
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-white/15 shadow-2xl bg-gradient-to-r from-zinc-950/90 via-zinc-900/80 to-zinc-950/90 backdrop-blur-2xl">
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
                <p className="text-xs text-zinc-400 font-medium">Click any project to load its visual flowchart on the right studio panel</p>
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

          {/* Projects Grid Display */}
          {projects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-950/60 border border-white/10 space-y-3">
              <span className="text-4xl">📁</span>
              <h3 className="text-lg font-bold text-white">No projects created yet</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                Click "+ Create Project" above to add your first project description, flowchart link, and requirements checklist.
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${isStudioOpen ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"}`}>
              {projects.map((project) => {
                const reqs = parseReqs(project.requirements);
                const completedCount = reqs.filter((r) => r.completed).length;
                const progressPct = reqs.length > 0 ? Math.round((completedCount / reqs.length) * 100) : 0;
                const isEditingThis = editingProjectId === project.id;
                const isSelected = selectedProjectId === project.id;
                const hasDescription = Boolean(project.description && project.description.trim());
                const hasFlowchart = Boolean(project.workflow && project.workflow.trim());
                const hasRequirements = reqs.length > 0;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setIsStudioOpen(true);
                    }}
                    className={`rounded-3xl border p-5 shadow-xl space-y-4 flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-950 border-cyan-400/80 shadow-cyan-500/10 ring-2 ring-cyan-500/30"
                        : "bg-zinc-950/80 border-white/10 hover:border-white/20 hover:bg-zinc-950"
                    }`}
                  >
                    {isEditingThis ? (
                      <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
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

                        {/* Flowchart Link Editing */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-cyan-300">🔗 External Flowchart Link (Draw.io)</label>
                            <a
                              href={DRAWIO_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-orange-400 hover:text-orange-300"
                            >
                              Open Draw.io ↗
                            </a>
                          </div>
                          <input
                            type="url"
                            value={editingWorkflowLink}
                            onChange={(e) => setEditingWorkflowLink(e.target.value)}
                            placeholder="Paste flowchart URL..."
                            className="w-full bg-zinc-900 border border-cyan-500/40 rounded-xl px-3 py-1 text-sm text-white outline-none font-medium"
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
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* Project Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                📌
                              </div>
                              <div>
                                <h2 className="text-base font-black text-white leading-snug break-words">{project.title}</h2>
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 mt-0.5">
                                    <span>● Active Studio</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => startEditing(project)}
                                title="Edit Project"
                                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteProject(project.id)}
                                title="Delete Project"
                                className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {/* Strict Conditional: Description */}
                          {hasDescription && (
                            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 border border-white/5 p-3 rounded-xl whitespace-pre-wrap font-medium">
                              {project.description}
                            </p>
                          )}

                          {/* Strict Conditional: Flowchart Status Indicator */}
                          {hasFlowchart ? (
                            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-black text-xs flex items-center justify-between">
                              <span className="flex items-center gap-1.5 truncate">
                                <span>📐</span>
                                <span className="truncate">Flowchart Attached</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-zinc-950 font-black text-[10px] shrink-0">
                                Loaded Right ➔
                              </span>
                            </div>
                          ) : (
                            <a
                              href={DRAWIO_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 rounded-xl border border-dashed border-orange-400/50 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 font-bold text-xs flex items-center justify-between"
                            >
                              <span>🎨 Create Flowchart (Draw.io)</span>
                              <span>↗</span>
                            </a>
                          )}

                          {/* Strict Conditional: Requirements Checklist */}
                          {hasRequirements && (
                            <div className="space-y-2 pt-1 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-extrabold text-emerald-300 flex items-center gap-1">
                                  <span>📋</span>
                                  <span>Requirements</span>
                                </span>
                                <span className="font-bold text-zinc-400">
                                  {completedCount}/{reqs.length} ({progressPct}%)
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-white/5">
                                <div
                                  style={{ width: `${progressPct}%` }}
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                                />
                              </div>

                              {/* Checklist Items */}
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {reqs.map((req) => (
                                  <div
                                    key={req.id}
                                    className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-zinc-900/80 border border-white/5 hover:border-white/10 transition-colors group"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleRequirement(project, req.id)}
                                      className="flex items-center gap-2 text-left flex-1 cursor-pointer min-w-0"
                                    >
                                      <span
                                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-black transition-all shrink-0 ${
                                          req.completed
                                            ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                                            : "border-zinc-700 bg-zinc-950 text-transparent group-hover:border-zinc-500"
                                        }`}
                                      >
                                        ✓
                                      </span>
                                      <span
                                        className={`text-xs font-semibold transition-all truncate ${
                                          req.completed ? "line-through text-zinc-500" : "text-zinc-200"
                                        }`}
                                      >
                                        {req.text}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => deleteRequirementFromProject(project, req.id)}
                                      className="text-zinc-600 hover:text-rose-400 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer shrink-0"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Add Requirement Input */}
                        <div className="pt-1 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="+ Requirement (Enter)..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                addRequirementToProject(project, e.currentTarget.value);
                                e.currentTarget.value = "";
                              }
                            }}
                            className="w-full bg-zinc-900/90 border border-white/10 focus:border-emerald-400 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Dedicated Draw.io Live Flowchart Studio Panel */}
        <AnimatePresence>
          {isStudioOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-[42%] xl:w-[40%] shrink-0 lg:sticky lg:top-6 space-y-4"
            >
              <div className="rounded-3xl bg-zinc-950 border border-cyan-500/30 p-5 shadow-2xl space-y-4 bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-zinc-950">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-black text-lg flex items-center justify-center shrink-0">
                      📐
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white leading-tight">
                        {selectedProject ? selectedProject.title : "Draw.io Studio"}
                      </h2>
                      <span className="text-[11px] text-zinc-400 font-semibold block">Live Visual Flowchart Diagram</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={selectedProject?.workflow || DRAWIO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Editor</span>
                      <span>↗</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsStudioOpen(false)}
                      title="Minimize Studio Panel"
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center font-black text-xs transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Live Studio Iframe Display */}
                {selectedProject && selectedProject.workflow && selectedProject.workflow.trim() ? (
                  <div className="space-y-3">
                    <div className="w-full h-[540px] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl relative">
                      <iframe
                        key={selectedProject.id + (selectedProject.workflow || "")}
                        src={getEmbedUrl(selectedProject.workflow)}
                        title="Live Flowchart Studio"
                        className="w-full h-full border-0"
                      />
                    </div>

                    {/* Side Input to Edit Flowchart Link */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                        <span>Flowchart Link (Draw.io)</span>
                        <button
                          type="button"
                          onClick={handleSaveStudioWorkflow}
                          className="text-cyan-400 hover:text-cyan-300 font-black text-[11px] cursor-pointer"
                        >
                          ✓ Update Diagram
                        </button>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={studioWorkflowInput}
                          onChange={(e) => setStudioWorkflowInput(e.target.value)}
                          placeholder="Paste Draw.io URL..."
                          className="flex-1 bg-zinc-900 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleSaveStudioWorkflow}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs cursor-pointer shadow-md shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4 my-4">
                    <span className="text-4xl block">🎨</span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        {selectedProject ? `No flowchart added for "${selectedProject.title}"` : "Select a project to view flowchart"}
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                        Create a diagram on Draw.io, export as URL, and paste the link below to load your visual flowchart right here!
                      </p>
                    </div>

                    {selectedProject && (
                      <div className="space-y-2 pt-2 max-w-xs mx-auto">
                        <input
                          type="url"
                          value={studioWorkflowInput}
                          onChange={(e) => setStudioWorkflowInput(e.target.value)}
                          placeholder="Paste Draw.io URL here..."
                          className="w-full bg-zinc-900 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleSaveStudioWorkflow}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-zinc-950 font-black text-xs shadow-lg cursor-pointer"
                        >
                          + Attach Flowchart to Project
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <a
                        href={DRAWIO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-orange-400 hover:text-orange-300 cursor-pointer"
                      >
                        <span>Create diagram on app.diagrams.net</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Right-Edge Sidebar Pill when Minimized */}
      <AnimatePresence>
        {!isStudioOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setIsStudioOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 px-3 py-4 rounded-l-2xl bg-zinc-950/95 border-l border-y border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-extrabold text-xs shadow-2xl shadow-cyan-500/20 backdrop-blur-xl flex flex-col items-center gap-2.5 group cursor-pointer hover:bg-zinc-900"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">📐</span>
            <span className="[writing-mode:vertical-lr] font-black tracking-wider text-[11px] uppercase">
              Draw.io Studio
            </span>
            <span className="text-xs group-hover:-translate-x-0.5 transition-transform">◀</span>
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
