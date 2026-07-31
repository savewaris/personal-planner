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
  const [activeTab, setActiveTab] = useState<"visual" | "code">(isEditable ? "code" : "visual");

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

  return (
    <div className="space-y-3 rounded-2xl bg-zinc-950/80 border border-white/10 p-4 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">📐</span>
          <h4 className="text-base font-bold text-white">System & Architecture Diagram</h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "visual"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🎨 Visual Diagram
          </button>
          {isEditable && (
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "code"
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              💻 Code Syntax
            </button>
          )}
        </div>
      </div>

      {/* ⚡ Quick Presets (If editable) */}
      {isEditable && onChangeCode && (
        <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-zinc-900 border border-white/5">
          <span className="text-[11px] font-extrabold text-zinc-400 shrink-0">⚡ Presets:</span>
          {DIAGRAM_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                onChangeCode(preset.code);
                setActiveTab("visual");
              }}
              className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-400 hover:bg-indigo-500/20 text-zinc-200 hover:text-indigo-200 text-xs font-bold transition-all cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      {activeTab === "visual" ? (
        <div className="min-h-[160px] flex items-center justify-center p-4 rounded-xl bg-zinc-900/60 border border-white/5 overflow-x-auto">
          {error ? (
            <div className="text-xs text-rose-400 font-mono p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              ⚠️ Syntax Error: {error}
            </div>
          ) : svgContent ? (
            <div
              ref={containerRef}
              className="w-full flex justify-center svg-container"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <span className="text-xs text-zinc-500 italic">No diagram rendered yet. Select a preset or write syntax!</span>
          )}
        </div>
      ) : (
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
