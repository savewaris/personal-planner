"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { motion, AnimatePresence } from "framer-motion";

export const DIAGRAM_PRESETS = [
  {
    name: "🏗️ System Architecture",
    code: `graph TD
  Client["📱 Client App (Browser / Mobile)"] -->|HTTPS / REST| NextApp["⚡ Next.js App Router"]
  NextApp -->|Prisma ORM| DB[("🗄️ Neon PostgreSQL")]
  NextApp -->|API Gateway| Auth["🔐 Google OAuth"]
  NextApp -->|Cache| Redis[("⚡ Redis Cache")]`,
  },
  {
    name: "🔄 Auth Sequence Flow",
    code: `sequenceDiagram
  autonumber
  actor User
  participant App as Frontend Client
  participant Auth as NextAuth / OAuth
  participant DB as Prisma / Neon DB
  User->>App: Click 'Sign in with Google'
  App->>Auth: Request OAuth Token
  Auth-->>App: Return User Profile & JWT
  App->>DB: Upsert User Record
  DB-->>App: Session Confirmed`,
  },
  {
    name: "⚡ Database ERD Schema",
    code: `erDiagram
  USER ||--o{ PROJECT : owns
  PROJECT ||--o{ REQUIREMENT : has
  PROJECT ||--o{ WORKFLOW_STEP : contains
  PROJECT {
    string id
    string title
    string goal
    string scope
    string deliverables
    string diagram
  }`,
  },
  {
    name: "📦 Cloud & Microservices",
    code: `flowchart LR
  A["🌐 Web Frontend"] --> B["⚡ API Gateway"]
  B --> C["📦 Worker Queue"]
  C --> D["🤖 AI Pipeline"]
  D --> E["🗄️ Storage / DB"]`,
  },
];

const QUICK_NODES = [
  { label: "📱 Client App", code: 'Client["📱 Client App"]' },
  { label: "⚡ Web App", code: 'WebApp["⚡ Next.js Web App"]' },
  { label: "🌐 API Gateway", code: 'API["🌐 REST API Gateway"]' },
  { label: "🗄️ Database", code: 'DB[("🗄️ PostgreSQL Database")]' },
  { label: "📦 Service", code: 'Service["📦 Worker Service"]' },
  { label: "⚡ Redis Cache", code: 'Cache[("⚡ Redis Cache")]' },
];

interface DiagramStudioProps {
  code: string;
  onChangeCode?: (newCode: string) => void;
  isEditable?: boolean;
}

export const DiagramStudio: React.FC<DiagramStudioProps> = ({
  code,
  onChangeCode,
  isEditable = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);

  // Visual GUI Builder Helper States
  const [fromNode, setFromNode] = useState<string>("Client");
  const [toNode, setToNode] = useState<string>("WebApp");
  const [arrowLabel, setArrowLabel] = useState<string>("HTTPS / REST");

  // Inline Canvas Node Rename Popover State
  const [editingNodeText, setEditingNodeText] = useState<string | null>(null);
  const [editingNodeOriginal, setEditingNodeOriginal] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      themeVariables: {
        darkMode: true,
        background: "#09090b",
        primaryColor: "#6366f1",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#818cf8",
        lineColor: "#38bdf8",
        secondaryColor: "#a855f7",
        tertiaryColor: "#10b981",
      },
    });
  }, []);

  // Render Mermaid SVG
  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!code || !code.trim()) {
        setSvgContent("");
        setError(null);
        return;
      }

      try {
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Invalid diagram syntax");
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  // Make SVG Canvas Nodes Draggable & Double-Click Editable
  useEffect(() => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;

    const nodes = svgEl.querySelectorAll(".node, .cluster, .actor");
    let selectedEl: SVGGElement | null = null;
    let offset = { x: 0, y: 0 };
    let initialTransform = { x: 0, y: 0 };

    const getMousePosition = (evt: MouseEvent) => {
      const CTM = svgEl.getScreenCTM();
      if (!CTM) return { x: evt.clientX, y: evt.clientY };
      return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d,
      };
    };

    const onMouseDown = (evt: MouseEvent) => {
      const target = (evt.target as HTMLElement).closest(".node, .cluster, .actor") as SVGGElement;
      if (!target) return;

      selectedEl = target;
      selectedEl.style.cursor = "grabbing";

      const mousePos = getMousePosition(evt);
      const transform = selectedEl.getAttribute("transform") || "";
      const match = /translate\(([^,\s]+)[,\s]+([^,\s]+)\)/.exec(transform);

      if (match) {
        initialTransform = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
      } else {
        initialTransform = { x: 0, y: 0 };
      }

      offset = {
        x: mousePos.x - initialTransform.x,
        y: mousePos.y - initialTransform.y,
      };
    };

    const onMouseMove = (evt: MouseEvent) => {
      if (!selectedEl) return;
      evt.preventDefault();
      const mousePos = getMousePosition(evt);
      const newX = mousePos.x - offset.x;
      const newY = mousePos.y - offset.y;
      selectedEl.setAttribute("transform", `translate(${newX}, ${newY})`);
    };

    const onMouseUp = () => {
      if (selectedEl) {
        selectedEl.style.cursor = "pointer";
        selectedEl = null;
      }
    };

    // Double-Click Inline Rename Popover on Canvas
    const onDblClick = (evt: MouseEvent) => {
      if (!isEditable || !onChangeCode) return;
      const target = (evt.target as HTMLElement).closest(".node, .cluster, .actor") as SVGGElement;
      if (!target) return;

      const textEl = target.querySelector("text, span");
      const labelText = textEl?.textContent || target.id;

      const rect = target.getBoundingClientRect();
      setPopoverPos({ x: rect.left, y: rect.top - 40 });
      setEditingNodeOriginal(labelText);
      setEditingNodeText(labelText);
    };

    nodes.forEach((node) => {
      const gNode = node as SVGGElement;
      gNode.style.cursor = "pointer";
      gNode.addEventListener("mousedown", onMouseDown as any);
      gNode.addEventListener("dblclick", onDblClick as any);
    });

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      nodes.forEach((node) => {
        const gNode = node as SVGGElement;
        gNode.removeEventListener("mousedown", onMouseDown as any);
        gNode.removeEventListener("dblclick", onDblClick as any);
      });
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [svgContent, isEditable, onChangeCode]);

  // Apply Inline Node Text Edit to Diagram Code
  const applyInlineNodeRename = () => {
    if (!onChangeCode || !editingNodeOriginal || !editingNodeText) {
      setPopoverPos(null);
      return;
    }
    const updated = code.replace(editingNodeOriginal, editingNodeText);
    onChangeCode(updated);
    setPopoverPos(null);
  };

  // Append Quick Component Box
  const addQuickNode = (nodeCode: string) => {
    if (!onChangeCode) return;
    let current = code && code.trim() ? code.trim() : "graph TD";
    if (!current.startsWith("graph") && !current.startsWith("flowchart")) {
      current = `graph TD\n  ${current}`;
    }
    const updated = `${current}\n  ${nodeCode}`;
    onChangeCode(updated);
  };

  // Connect Two Nodes Visually
  const connectNodes = () => {
    if (!onChangeCode || !fromNode.trim() || !toNode.trim()) return;
    let current = code && code.trim() ? code.trim() : "graph TD";
    if (!current.startsWith("graph") && !current.startsWith("flowchart")) {
      current = `graph TD\n  ${current}`;
    }
    const labelPart = arrowLabel.trim() ? `|${arrowLabel.trim()}|` : "";
    const connectionLine = `  ${fromNode.trim()} -->${labelPart} ${toNode.trim()}`;
    const updated = `${current}\n${connectionLine}`;
    onChangeCode(updated);
  };

  return (
    <div className="space-y-4 rounded-2xl bg-zinc-950/90 border border-white/15 p-4 shadow-2xl relative">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
            📐
          </div>
          <div>
            <h4 className="text-base font-bold text-white leading-tight">System & Architecture Diagram Studio</h4>
            <p className="text-xs text-zinc-400 font-semibold">
              70% Visual Canvas (Drag & Double-Click Edit) + 30% Visual GUI Builder
            </p>
          </div>
        </div>

        {/* Code Editor Toggle Button */}
        {isEditable && (
          <button
            type="button"
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
              showCodeEditor
                ? "bg-indigo-500 text-white border-indigo-400 shadow-md"
                : "bg-zinc-900 text-zinc-300 border-white/10 hover:border-indigo-400 hover:text-white"
            }`}
          >
            {showCodeEditor ? "🎨 Hide Code Editor" : "💻 Edit Raw Syntax"}
          </button>
        )}
      </div>

      {/* Raw Syntax Code Editor Drawer */}
      <AnimatePresence>
        {showCodeEditor && isEditable && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <textarea
              rows={6}
              value={code}
              onChange={(e) => onChangeCode && onChangeCode(e.target.value)}
              placeholder="Write Mermaid diagram syntax (e.g. graph TD, sequenceDiagram, erDiagram)..."
              className="w-full bg-zinc-900 border border-indigo-400/60 rounded-xl p-3 text-xs font-mono text-cyan-300 outline-none focus:border-indigo-400 transition-all shadow-inner"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📐 70% / 30% Split Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* 70% LEFT COLUMN: Draggable Visual Vector Canvas */}
        <div className={`${isEditable ? "lg:col-span-7" : "lg:col-span-10"} relative`}>
          <div className="w-full min-h-[380px] max-h-[500px] flex items-center justify-center p-4 rounded-2xl bg-zinc-900/80 border border-white/10 overflow-auto shadow-inner relative group">
            {/* Draggable & Double-Click Hint */}
            {isEditable && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-indigo-500/30 text-[11px] font-extrabold text-indigo-300 pointer-events-none shadow-md z-10 flex items-center gap-1.5">
                <span>🖱️ Click & Drag Nodes</span>
                <span>•</span>
                <span>✏️ Double-Click Node to Rename Text</span>
              </div>
            )}

            {error ? (
              <div className="text-xs text-rose-400 font-mono p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                ⚠️ Syntax Error: {error}
              </div>
            ) : svgContent ? (
              <div
                ref={containerRef}
                className="w-full flex justify-center svg-container select-none"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <span className="text-xs text-zinc-500 italic">No diagram rendered yet. Select a preset or use the Visual GUI Builder!</span>
            )}
          </div>
        </div>

        {/* 30% RIGHT COLUMN: Visual GUI Builder Sidebar */}
        {isEditable && onChangeCode && (
          <div className="lg:col-span-3 space-y-4 p-4 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h5 className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛠️ Visual GUI Builder</span>
                </h5>
                <p className="text-[11px] text-zinc-400 font-medium">Build architecture visually</p>
              </div>

              {/* 1-Click Architecture Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-zinc-300">⚡ Presets:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {DIAGRAM_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => onChangeCode(preset.code)}
                      className="w-full p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/20 text-zinc-200 hover:text-indigo-200 text-xs font-bold transition-all cursor-pointer text-left"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* + Add Component Boxes */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <span className="text-[11px] font-extrabold text-indigo-300">+ Add Visual Boxes:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_NODES.map((node) => (
                    <button
                      key={node.label}
                      type="button"
                      onClick={() => addQuickNode(node.code)}
                      className="p-1.5 rounded-lg bg-zinc-800 border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/20 text-white text-[11px] font-bold transition-all cursor-pointer text-left truncate"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🔌 Arrow Connection Builder */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[11px] font-extrabold text-emerald-300">🔌 Connect Nodes:</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={fromNode}
                    onChange={(e) => setFromNode(e.target.value)}
                    placeholder="From Box ID (e.g. Client)"
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-400 font-bold"
                  />
                  <input
                    type="text"
                    value={arrowLabel}
                    onChange={(e) => setArrowLabel(e.target.value)}
                    placeholder="Arrow Label (e.g. HTTPS REST)"
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-400 font-medium"
                  />
                  <input
                    type="text"
                    value={toNode}
                    onChange={(e) => setToNode(e.target.value)}
                    placeholder="To Box ID (e.g. WebApp)"
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-400 font-bold"
                  />
                  <button
                    type="button"
                    onClick={connectNodes}
                    className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs cursor-pointer shadow-md transition-all"
                  >
                    🔌 Draw Arrow
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popover for Double-Click Node Text Editing on Canvas */}
      {popoverPos && (
        <div
          style={{ top: popoverPos.y, left: popoverPos.x }}
          className="fixed z-50 p-2.5 rounded-xl bg-zinc-950 border border-amber-400 shadow-2xl space-y-2 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-amber-300">✏️ Edit Node Text Label:</span>
            <button type="button" onClick={() => setPopoverPos(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
          </div>
          <input
            type="text"
            value={editingNodeText || ""}
            onChange={(e) => setEditingNodeText(e.target.value)}
            autoFocus
            className="w-full bg-zinc-900 border border-amber-400/60 rounded-lg px-2.5 py-1 text-xs text-white outline-none font-bold"
          />
          <button
            type="button"
            onClick={applyInlineNodeRename}
            className="w-full py-1 rounded-lg bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer hover:bg-amber-300"
          >
            ✓ Apply Rename
          </button>
        </div>
      )}
    </div>
  );
};
