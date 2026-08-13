"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/modals";
import { SopItem } from "@/types";
export type { SopItem };

const DEFAULT_SOPS: SopItem[] = [
  {
    id: "sop-1",
    title: "UX/UI Design & Inspiration Process",
    category: "Design",
    description: "Standard workflow for researching design trends, collecting moodboard references, and drafting wireframes.",
    steps: [
      { id: "s1", text: "Browse Dribbble / Mobbin for visual references", completed: false },
      { id: "s2", text: "Create Pinterest / Figma moodboard with color palettes", completed: false },
      { id: "s3", text: "Draft low-fidelity wireframes in Figma", completed: false },
      { id: "s4", text: "Apply 5-shade Light Theme design system tokens", completed: false },
    ],
    links: [
      { label: "Dribbble Mobile UI", url: "https://dribbble.com" },
      { label: "Mobbin Design Library", url: "https://mobbin.com" },
    ],
    tags: ["UX/UI", "Design", "Inspiration"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "sop-2",
    title: "Full-Stack Feature Build Checklist",
    category: "Development",
    description: "Standard operating procedure for adding end-to-end features with Prisma, Next.js, and Jest testing.",
    steps: [
      { id: "s1", text: "Define Prisma schema models & relations", completed: false },
      { id: "s2", text: "Run npx prisma db push & seed defaults", completed: false },
      { id: "s3", text: "Implement Next.js API route handlers (/api/...)", completed: false },
      { id: "s4", text: "Build responsive React components with Tailwind CSS", completed: false },
      { id: "s5", text: "Verify TypeScript (npx tsc) & run npm run test:unit", completed: false },
    ],
    links: [
      { label: "Prisma Docs", url: "https://www.prisma.io/docs" },
    ],
    tags: ["Dev", "SOP", "Fullstack"],
    createdAt: new Date().toISOString(),
  },
];

interface SopKnowledgeLibraryProps {
  onLinkToProject?: (sop: SopItem) => void;
  selectedProjectId?: string | null;
}

export const SopKnowledgeLibrary: React.FC<SopKnowledgeLibraryProps> = ({
  onLinkToProject,
  selectedProjectId,
}) => {
  const [sops, setSops] = useState<SopItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New SOP Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Design");
  const [newDescription, setNewDescription] = useState("");
  const [newStepText, setNewStepText] = useState("");
  const [newSteps, setNewSteps] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinks, setNewLinks] = useState<{ label: string; url: string }[]>([]);

  // Load SOPs from LocalStorage or default
  useEffect(() => {
    try {
      const saved = localStorage.getItem("planner_standalone_sops");
      if (saved) {
        setSops(JSON.parse(saved));
      } else {
        setSops(DEFAULT_SOPS);
        localStorage.setItem("planner_standalone_sops", JSON.stringify(DEFAULT_SOPS));
      }
    } catch {
      setSops(DEFAULT_SOPS);
    }
  }, []);

  // Save SOPs to LocalStorage
  const saveSops = (updated: SopItem[]) => {
    setSops(updated);
    try {
      localStorage.setItem("planner_standalone_sops", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save SOPs to localStorage", e);
    }
  };

  const categories = ["ALL", "Design", "Development", "Content", "Business", "General"];

  const filteredSops = useMemo(() => {
    return sops.filter((s) => {
      if (activeCategory !== "ALL" && s.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchTag = s.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }
      return true;
    });
  }, [sops, activeCategory, search]);

  const handleAddStep = () => {
    if (newStepText.trim()) {
      setNewSteps([...newSteps, newStepText.trim()]);
      setNewStepText("");
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
      setNewTags([...newTags, newTagInput.trim()]);
      setNewTagInput("");
    }
  };

  const handleAddLink = () => {
    if (newLinkUrl.trim()) {
      setNewLinks([
        ...newLinks,
        { label: newLinkLabel.trim() || newLinkUrl.trim(), url: newLinkUrl.trim() },
      ]);
      setNewLinkLabel("");
      setNewLinkUrl("");
    }
  };

  const handleCreateSop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: SopItem = {
      id: `sop-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim(),
      steps: newSteps.map((st, idx) => ({ id: `st-${idx}`, text: st, completed: false })),
      links: newLinks,
      tags: newTags,
      projectId: selectedProjectId || null,
      createdAt: new Date().toISOString(),
    };

    const updated = [created, ...sops];
    saveSops(updated);

    // Reset Form
    setNewTitle("");
    setNewCategory("Design");
    setNewDescription("");
    setNewSteps([]);
    setNewTags([]);
    setNewLinks([]);
    setIsCreateOpen(false);
  };

  const toggleStepCompleted = (sopId: string, stepId: string) => {
    const updated = sops.map((s) => {
      if (s.id !== sopId) return s;
      return {
        ...s,
        steps: s.steps.map((st) => (st.id === stepId ? { ...st, completed: !st.completed } : st)),
      };
    });
    saveSops(updated);
  };

  const [pendingDeleteSopId, setPendingDeleteSopId] = useState<string | null>(null);

  const confirmDeleteSop = () => {
    if (!pendingDeleteSopId) return;
    const updated = sops.filter((s) => s.id !== pendingDeleteSopId);
    saveSops(updated);
    setPendingDeleteSopId(null);
  };

  return (
    <div className="space-y-5">
      {/* Header Controls & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>🧠 Independent SOPs & Knowledge Library</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Reusable step-by-step procedures, research notes, and inspiration references
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="btn-premium text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>+ New SOP Workflow</span>
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {cat === "ALL" ? "All Domains" : cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SOPs, tags, or research..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Create SOP Drawer / Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900">Create Standalone SOP / Note</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSop} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SOP Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. UX/UI Research & Inspiration Workflow"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category Domain</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Design">Design (UX/UI, Graphics)</option>
                    <option value="Development">Development (Code, DB, Architecture)</option>
                    <option value="Content">Content (Writing, Video)</option>
                    <option value="Business">Business & Operations</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Description / Overview</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description of this workflow or reference guide..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-normal focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Step Checklist Builder */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">Step-by-Step Procedure Checklist</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStepText}
                      onChange={(e) => setNewStepText(e.target.value)}
                      placeholder="Add procedure step..."
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddStep(); } }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                    >
                      + Add Step
                    </button>
                  </div>
                  {newSteps.length > 0 && (
                    <ul className="space-y-1 pl-1">
                      {newSteps.map((st, i) => (
                        <li key={i} className="flex items-center justify-between text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span>{i + 1}. {st}</span>
                          <button type="button" onClick={() => setNewSteps(newSteps.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600 font-bold">✕</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Reference Links */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">Inspiration & Reference Links</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="Label (e.g. Mobbin)"
                      className="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                    <input
                      type="url"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="URL (https://...)"
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                    >
                      + Link
                    </button>
                  </div>
                  {newLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {newLinks.map((lk, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md flex items-center gap-1 font-semibold">
                          🔗 {lk.label}
                          <button type="button" onClick={() => setNewLinks(newLinks.filter((_, idx) => idx !== i))} className="hover:text-rose-600 font-bold">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Add tag (e.g. UX/UI)..."
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                    >
                      + Tag
                    </button>
                  </div>
                  {newTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {newTags.map((tg, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-medium">
                          #{tg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-premium px-5 py-2 text-xs font-bold"
                  >
                    Save SOP Workflow
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSops.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
            <p className="text-sm font-semibold text-slate-600">No SOPs or research notes found.</p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="btn-secondary text-xs px-4 py-2"
            >
              + Create Your First SOP
            </button>
          </div>
        ) : (
          filteredSops.map((sop) => (
            <motion.div
              key={sop.id}
              layout
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                    {sop.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPendingDeleteSopId(sop.id)}
                    className="text-slate-400 hover:text-rose-600 text-xs p-1"
                    title="Delete SOP"
                  >
                    🗑️
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{sop.title}</h3>
                  {sop.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sop.description}</p>
                  )}
                </div>

                {/* Procedure Checklist */}
                {sop.steps.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Procedure Steps ({sop.steps.filter((st) => st.completed).length}/{sop.steps.length})
                    </span>
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {sop.steps.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => toggleStepCompleted(sop.id, st.id)}
                          className="flex items-center gap-2 text-xs cursor-pointer select-none group"
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-all ${
                            st.completed
                              ? "bg-emerald-500 border-emerald-500 text-white font-bold"
                              : "border-slate-300 group-hover:border-indigo-500 bg-white"
                          }`}>
                            {st.completed && "✓"}
                          </span>
                          <span className={st.completed ? "line-through text-slate-400" : "text-slate-800 font-medium"}>
                            {st.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reference Links */}
                {sop.links.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">References & Links</span>
                    <div className="flex flex-wrap gap-1.5">
                      {sop.links.map((lk, idx) => (
                        <a
                          key={idx}
                          href={lk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition-all"
                        >
                          <span>🔗</span>
                          <span>{lk.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Meta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1 flex-wrap">
                  {sop.tags.map((tg, i) => (
                    <span key={i} className="text-slate-500 font-semibold">#{tg}</span>
                  ))}
                </div>

                {onLinkToProject && (
                  <button
                    type="button"
                    onClick={() => onLinkToProject(sop)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    + Link to Current Project
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!pendingDeleteSopId}
        onClose={() => setPendingDeleteSopId(null)}
        onConfirm={confirmDeleteSop}
        title="Are you sure you want to delete this SOP?"
        message="This action cannot be undone. The SOP workflow will be removed."
        confirmText="Delete SOP"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
