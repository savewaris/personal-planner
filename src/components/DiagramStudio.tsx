"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { motion } from "framer-motion";

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
  { label: "📱 Client App", code: 'Client["📱 Client App (Browser / Mobile)"]' },
  { label: "⚡ Web App", code: 'WebApp["⚡ Next.js Web App"]' },
  { label: "🌐 API Gateway", code: 'API["🌐 REST / GraphQL API Gateway"]' },
  { label: "🗄️ Database", code: 'DB[("🗄️ PostgreSQL Database")]' },
  { label: "📦 Microservice", code: 'Service["📦 Background Worker Service"]' },
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
  const [activeTab, setActiveTab] = useState<"visual" | "gui" | "code">(isEditable ? "gui" : "visual");

  // Visual GUI Builder Helper States
  const [fromNode, setFromNode] = useState<string>("Client");
  const [toNode, setToNode] = useState<string>("WebApp");
  const [arrowLabel, setArrowLabel] = useState<string>("HTTPS / REST");

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

  // Append a visual node definition
  const addQuickNode = (nodeCode: string) => {
    if (!onChangeCode) return;
    let current = code && code.trim() ? code.trim() : "graph TD";
    if (!current.startsWith("graph") && !current.startsWith("flowchart")) {
      current = `graph TD\n  ${current}`;
    }
    const updated = `${current}\n  ${nodeCode}`;
    onChangeCode(updated);
  };

  // Connect two nodes with an arrow
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
    setActiveTab("visual");
  };

  return (
    <div className="space-y-3 rounded-2xl bg-zinc-950/90 border border-white/15 p-4 shadow-2xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-md">
            📐
          </div>
          <div>
            <h4 className="text-base font-bold text-white leading-tight">System & Architecture Diagram</h4>
            <p className="text-[11px] text-zinc-400 font-semibold">Visual Drag/Click Canvas & Mermaid Syntax</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "visual"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🎨 Visual Canvas
          </button>
          {isEditable && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("gui")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "gui"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🛠️ Visual GUI Builder
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "code"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                💻 Code Editor
              </button>
            </>
          )}
        </div>
      </div>

      {/* ⚡ Quick Architecture Presets */}
      {isEditable && onChangeCode && (
        <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl bg-zinc-900/90 border border-white/5">
          <span className="text-xs font-extrabold text-zinc-400 shrink-0">⚡ 1-Click Architecture Presets:</span>
          {DIAGRAM_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                onChangeCode(preset.code);
                setActiveTab("visual");
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/20 text-zinc-200 hover:text-indigo-200 text-xs font-bold transition-all cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* 🛠️ Visual GUI Builder Tab */}
      {activeTab === "gui" && isEditable && onChangeCode && (
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/80 border border-indigo-500/30">
          {/* Section 1: Quick Add Visual Nodes */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-indigo-300 flex items-center gap-1">
              <span>+ Add Visual Component Boxes:</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_NODES.map((node) => (
                <button
                  key={node.label}
                  type="button"
                  onClick={() => addQuickNode(node.code)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/20 text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>{node.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Visual Arrow Connection Builder */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <label className="text-xs font-extrabold text-emerald-300 flex items-center gap-1">
              <span>🔌 Connect Visual Nodes with Arrows:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] font-bold text-zinc-400">From Box ID:</span>
                <input
                  type="text"
                  value={fromNode}
                  onChange={(e) => setFromNode(e.target.value)}
                  placeholder="e.g. Client"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400 font-bold"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-zinc-400">Arrow Label (Optional):</span>
                <input
                  type="text"
                  value={arrowLabel}
                  onChange={(e) => setArrowLabel(e.target.value)}
                  placeholder="e.g. HTTPS / REST"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400 font-medium"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-zinc-400">To Box ID:</span>
                <input
                  type="text"
                  value={toNode}
                  onChange={(e) => setToNode(e.target.value)}
                  placeholder="e.g. WebApp"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400 font-bold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={connectNodes}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-zinc-950 font-extrabold text-xs cursor-pointer shadow-md hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔌 Draw Arrow Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* 🎨 Visual Canvas View */}
      {activeTab === "visual" && (
        <div className="min-h-[180px] flex items-center justify-center p-4 rounded-xl bg-zinc-900/60 border border-white/5 overflow-x-auto shadow-inner">
          {error ? (
            <div className="text-xs text-rose-400 font-mono p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              ⚠️ Syntax Error: {error}
            </div>
          ) : svgContent ? (
            <div
              ref={containerRef}
              className="w-full flex justify-center svg-container"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <span className="text-xs text-zinc-500 italic">No diagram rendered yet. Select a preset or use the Visual GUI Builder!</span>
          )}
        </div>
      )}

      {/* 💻 Code Syntax Editor Tab */}
      {activeTab === "code" && isEditable && (
        <div className="space-y-1.5">
          <textarea
            rows={8}
            value={code}
            onChange={(e) => onChangeCode && onChangeCode(e.target.value)}
            placeholder="Write Mermaid diagram syntax (e.g. graph TD, sequenceDiagram, erDiagram)..."
            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs font-mono text-cyan-300 outline-none focus:border-indigo-400 transition-all"
          />
        </div>
      )}
    </div>
  );
};
