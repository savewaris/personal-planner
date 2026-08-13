"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { ProjectItem, ProjectRequirement } from "@/services/api";
import { KanbanBoard, TaskListView, CreateTaskDrawer } from "@/components/tasks";
import { SopKnowledgeLibrary, SopItem } from "@/components/notes";
import { ConfirmModal } from "@/components/ui/modals";

const DRAWIO_URL = "https://app.diagrams.net/";

const getEmbedUrl = (rawUrl: string) => {
  if (!rawUrl) return "";
  let url = rawUrl.trim();

  url = url.replace("#R#G", "#G").replace("#R#", "#");

  if (url.includes("app.diagrams.net")) {
    url = url.replace("app.diagrams.net", "viewer.diagrams.net");
  } else if (url.includes("draw.io")) {
    url = url.replace("draw.io", "viewer.diagrams.net");
  }

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

type MainSectionMode = "PROJECTS" | "SOP_LIBRARY";
type ProjectTabMode = "OVERVIEW" | "TASKS" | "SOPS" | "DIAGRAM";

export default function ProjectsPage() {
  const {
    projects,
    tasks,
    contexts,
    createProject,
    updateProject,
    deleteProject,
    updateTaskStatus,
    updateTask,
    deleteTask,
  } = usePlannerStore();

  const [mainSection, setMainSection] = useState<MainSectionMode>("PROJECTS");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<ProjectTabMode>("OVERVIEW");
  const [taskViewMode, setTaskViewMode] = useState<"kanban" | "list">("kanban");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddTaskDrawerOpen, setIsAddTaskDrawerOpen] = useState(false);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);

  const confirmDeleteProject = async () => {
    if (!pendingDeleteProjectId) return;
    await deleteProject(pendingDeleteProjectId);
    setPendingDeleteProjectId(null);
  };

  // Auto-select first project on load
  useEffect(() => {
    if (projects.length > 0 && (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId))) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  // Tasks belonging to the selected project
  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return tasks.filter((t) => t.projectId === selectedProject.id);
  }, [tasks, selectedProject]);

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newWorkflowLink, setNewWorkflowLink] = useState("");
  const [newReqs, setNewReqs] = useState<string[]>([""]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Inline Card Editing State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingWorkflowLink, setEditingWorkflowLink] = useState("");
  const [studioWorkflowInput, setStudioWorkflowInput] = useState("");

  useEffect(() => {
    if (selectedProject) {
      setStudioWorkflowInput(selectedProject.workflow || "");
    }
  }, [selectedProject?.id, selectedProject?.workflow]);

  const parseReqs = (raw: any): ProjectRequirement[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

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

  const toggleRequirement = async (project: ProjectItem, reqId: string) => {
    const currentReqs = parseReqs(project.requirements);
    const updatedReqs = currentReqs.map((r) => (r.id === reqId ? { ...r, completed: !r.completed } : r));
    await updateProject(project.id, { requirements: updatedReqs });
  };

  const addRequirementToProject = async (project: ProjectItem, text: string) => {
    if (!text.trim()) return;
    const currentReqs = parseReqs(project.requirements);
    const newReq: ProjectRequirement = {
      id: `req-${Date.now()}`,
      text: text.trim(),
      completed: false,
    };
    await updateProject(project.id, { requirements: [...currentReqs, newReq] });
  };

  const deleteRequirementFromProject = async (project: ProjectItem, reqId: string) => {
    const currentReqs = parseReqs(project.requirements);
    const updatedReqs = currentReqs.filter((r) => r.id !== reqId);
    await updateProject(project.id, { requirements: updatedReqs });
  };

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

  const handleSaveStudioWorkflow = async () => {
    if (!selectedProject) return;
    await updateProject(selectedProject.id, {
      workflow: studioWorkflowInput.trim(),
    });
  };

  return (
    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-[1700px] mx-auto w-full space-y-6 pb-12">
      {/* Top Header Mode Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Projects & Workflows Studio</h1>
          <p className="text-xs text-slate-500 font-medium">Manage building projects, associated project tasks, and standalone SOP workflows</p>
        </div>

        {/* Top 2-Way View Switcher: Projects Hub vs Standalone SOP Library */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setMainSection("PROJECTS")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              mainSection === "PROJECTS"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📁 Projects Hub</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
              {projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainSection("SOP_LIBRARY")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              mainSection === "SOP_LIBRARY"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🧠 Independent SOPs Library</span>
          </button>
        </div>
      </div>

      {mainSection === "SOP_LIBRARY" ? (
        /* Standalone Independent SOPs Library */
        <SopKnowledgeLibrary
          selectedProjectId={selectedProjectId}
          onLinkToProject={(sop: SopItem) => {
            if (selectedProject) {
              addRequirementToProject(selectedProject, `[SOP] ${sop.title}`);
              alert(`Linked "${sop.title}" to project "${selectedProject.title}"!`);
            }
          }}
        />
      ) : (
        /* Projects Hub Workspace */
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Column: Projects Selector Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">All Projects</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-all cursor-pointer shadow-xs"
                >
                  + New
                </button>
              </div>

              <div className="space-y-1.5">
                {projects.map((proj) => {
                  const isSelected = selectedProjectId === proj.id;
                  const reqs = parseReqs(proj.requirements);
                  const completedCount = reqs.filter((r) => r.completed).length;

                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold truncate">{proj.title}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>{reqs.length} reqs ({completedCount} done)</span>
                        <span className="text-[10px] text-slate-400">{tasks.filter((t) => t.projectId === proj.id).length} tasks</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Area: Selected Project Hub Workspace */}
          {selectedProject ? (
            <div className="flex-1 w-full space-y-4">
              {/* Selected Project Main Header Banner */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📁</span>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedProject.title}</h2>
                    </div>
                    {selectedProject.description && (
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{selectedProject.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(selectedProject)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      ✏️ Edit Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteProjectId(selectedProject.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Integrated Workspace Hub 4 Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: "OVERVIEW", label: "📌 Overview & Requirements" },
                    { id: "TASKS", label: `⚡ Project Tasks (${projectTasks.length})` },
                    { id: "SOPS", label: "🧠 SOPs & Notes" },
                    { id: "DIAGRAM", label: "📊 Flowchart Studio" },
                  ].map((tab) => {
                    const isActive = activeProjectTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveProjectTab(tab.id as ProjectTabMode)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border shrink-0 ${
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab 1: Overview & Requirements */}
              {activeProjectTab === "OVERVIEW" && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900">Project Requirements Checklist</h3>
                    <span className="text-xs font-bold text-slate-500">
                      {parseReqs(selectedProject.requirements).filter((r) => r.completed).length} / {parseReqs(selectedProject.requirements).length} Completed
                    </span>
                  </div>

                  <div className="space-y-2">
                    {parseReqs(selectedProject.requirements).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <button
                          type="button"
                          onClick={() => toggleRequirement(selectedProject, req.id)}
                          className="flex items-center gap-3 text-left cursor-pointer flex-1"
                        >
                          <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-bold ${
                            req.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                          }`}>
                            {req.completed && "✓"}
                          </span>
                          <span className={`text-xs font-semibold ${req.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {req.text}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRequirementFromProject(selectedProject, req.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Requirement Input */}
                  <div className="pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="+ Add requirement (press Enter)..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          addRequirementToProject(selectedProject, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Project Tasks */}
              {activeProjectTab === "TASKS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskViewMode("kanban")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          taskViewMode === "kanban" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Kanban Board
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskViewMode("list")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          taskViewMode === "list" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        List View
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddTaskDrawerOpen(true)}
                      className="btn-premium text-xs font-semibold px-4 py-2 cursor-pointer"
                    >
                      + Add Task to Project
                    </button>
                  </div>

                  {taskViewMode === "kanban" ? (
                    <KanbanBoard
                      tasks={projectTasks}
                      contexts={contexts}
                      onStatusChange={updateTaskStatus}
                      onUpdateTask={async (id, updates) => { await updateTask(id, updates); }}
                      onDeleteTask={deleteTask}
                      onOpenAddModal={() => setIsAddTaskDrawerOpen(true)}
                    />
                  ) : (
                    <TaskListView
                      tasks={projectTasks}
                      onStatusChange={updateTaskStatus}
                      onDeleteTask={deleteTask}
                    />
                  )}
                </div>
              )}

              {/* Tab 3: SOPs & Knowledge Notes */}
              {activeProjectTab === "SOPS" && (
                <SopKnowledgeLibrary
                  selectedProjectId={selectedProject.id}
                  onLinkToProject={(sop: SopItem) => {
                    addRequirementToProject(selectedProject, `[SOP] ${sop.title}`);
                    alert(`Linked "${sop.title}" to project "${selectedProject.title}"!`);
                  }}
                />
              )}

              {/* Tab 4: Diagram Studio */}
              {activeProjectTab === "DIAGRAM" && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Interactive Draw.io Flowchart Studio</h3>
                      <p className="text-xs text-slate-500">Live diagram embed for system architecture and workflows</p>
                    </div>
                    <a
                      href={selectedProject.workflow || DRAWIO_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-premium text-xs font-bold px-4 py-2"
                    >
                      Open Draw.io Editor ↗
                    </a>
                  </div>

                  {selectedProject.workflow && selectedProject.workflow.trim() ? (
                    <div className="w-full h-[580px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                      <iframe
                        src={getEmbedUrl(selectedProject.workflow)}
                        title="Project Flowchart"
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <span className="text-4xl block">🎨</span>
                      <p className="text-xs text-slate-600 font-semibold max-w-sm mx-auto">
                        Paste a Draw.io URL to preview your architecture flowchart directly in this project hub!
                      </p>
                      <div className="max-w-md mx-auto flex gap-2 pt-2">
                        <input
                          type="url"
                          value={studioWorkflowInput}
                          onChange={(e) => setStudioWorkflowInput(e.target.value)}
                          placeholder="Paste Draw.io export URL..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSaveStudioWorkflow}
                          className="btn-premium px-4 py-2 text-xs font-bold shrink-0"
                        >
                          Attach
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900">Create New Building Project</h3>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Personal Planner Mobile App"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Overview</label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Overview of project goals..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-slate-600 font-semibold">Cancel</button>
                  <button type="submit" className="btn-premium px-5 py-2 text-xs font-bold">Create Project</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Task Drawer (Pre-filled with selected project) */}
      <CreateTaskDrawer
        isOpen={isAddTaskDrawerOpen}
        onClose={() => setIsAddTaskDrawerOpen(false)}
        initialProjectId={selectedProjectId || undefined}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!pendingDeleteProjectId}
        onClose={() => setPendingDeleteProjectId(null)}
        onConfirm={confirmDeleteProject}
        title="Are you sure you want to delete this project?"
        message="This action cannot be undone. All project requirements and settings will be permanently removed."
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
      />
    </main>
  );
}
