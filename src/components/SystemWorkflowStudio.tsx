"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export const SYSTEM_WORKFLOW_PRESETS = [
  {
    name: "🌐 Web App Execution Flow",
    code: `flowchart LR
  User["📱 User / Browser"] -->|HTTP Request| NextJS["⚡ Next.js App Router"]
  NextJS -->|Validate & Query| DB[("🗄️ Neon PostgreSQL")]
  DB -->>|JSON Data| NextJS
  NextJS -->>|Rendered UI| User`,
  },
  {
    name: "🔐 OAuth Auth Flow",
    code: `sequenceDiagram
  autonumber
  actor User as User Browser
  participant App as Next.js App
  participant Google as Google OAuth API
  participant DB as Database
  User->>App: Click 'Sign in with Google'
  App->>Google: Redirect to OAuth Login
  Google-->>User: Prompt Consent
  User->>Google: Approve
  Google-->>App: Return OAuth Code & Token
  App->>DB: Upsert User Record
  DB-->>App: Return Session
  App-->>User: Redirect to Dashboard`,
  },
  {
    name: "🤖 AI Data Pipeline",
    code: `flowchart TD
  Input["📥 User Input Prompt"] --> Ingest["⚡ API Gateway"]
  Ingest --> Engine["🤖 Gemini / OpenAI API"]
  Engine --> Parse["📦 Structured JSON Parser"]
  Parse --> Store[("🗄️ Storage / DB")]
  Store --> UI["🖥️ Client Viewport"]`,
  },
];

interface SystemWorkflowStudioProps {
  code: string;
  onChangeCode?: (newCode: string) => void;
  isEditable?: boolean;
}

export const SystemWorkflowStudio: React.FC<SystemWorkflowStudioProps> = ({
  code,
  onChangeCode,
  isEditable = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "code">("visual");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      themeVariables: {
        darkMode: true,
        background: "#09090b",
        primaryColor: "#06b6d4",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#22d3ee",
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
        const id = `sys-wf-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Invalid workflow diagram syntax");
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  return (
    <div className="space-y-3 rounded-2xl bg-zinc-950/90 border border-cyan-500/30 p-4 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚙️</span>
          <div>
            <h4 className="text-sm font-bold text-cyan-300">System & App Execution Workflow</h4>
            <p className="text-[11px] text-zinc-400 font-medium">How the system operates step-by-step</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "visual"
                ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20 font-black"
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
                  ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20 font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              💻 Edit Logic Syntax
            </button>
          )}
        </div>
      </div>

      {/* ⚡ System Presets (If editable) */}
      {isEditable && onChangeCode && (
        <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-zinc-900/90 border border-white/5">
          <span className="text-xs font-extrabold text-cyan-300 shrink-0">⚡ Presets:</span>
          {SYSTEM_WORKFLOW_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                onChangeCode(preset.code);
                setActiveTab("visual");
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-cyan-500/20 text-zinc-200 hover:text-cyan-200 text-xs font-bold transition-all cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      {activeTab === "visual" ? (
        <div className="min-h-[160px] flex items-center justify-center p-4 rounded-xl bg-zinc-900/80 border border-white/5 overflow-x-auto">
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
            <span className="text-xs text-zinc-500 italic">No system execution diagram defined yet. Select a preset or write syntax!</span>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea
            rows={7}
            value={code}
            onChange={(e) => onChangeCode && onChangeCode(e.target.value)}
            placeholder="Write System Execution Diagram syntax (e.g. flowchart LR, sequenceDiagram)..."
            className="w-full bg-zinc-900 border border-cyan-400/50 rounded-xl p-3 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400 transition-all"
          />
        </div>
      )}
    </div>
  );
};
