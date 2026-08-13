/**
 * Planner Design System Tokens — Single Source of Truth
 * 
 * Typed constants representing the visual design tokens for Planner.
 * Refer to DESIGN_SYSTEM.md for the full specification.
 */

export const DESIGN_TOKENS = {
  colors: {
    background: "#09090b", // zinc-950
    foreground: "#f4f4f5", // zinc-100
    brandGradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
    textGradient: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)",
  },
  contexts: {
    personal: { name: "Personal", color: "#3b82f6", themeClass: "theme-blue" },
    work: { name: "Work", color: "#10b981", themeClass: "theme-emerald" },
    freelance: { name: "Freelance", color: "#a855f7", themeClass: "theme-purple" },
  },
  priorities: {
    HIGH: { label: "High", badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
    MEDIUM: { label: "Medium", badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    LOW: { label: "Low", badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  },
  statuses: {
    TODO: { label: "To Do", colorClass: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30" },
    IN_PROGRESS: { label: "In Progress", colorClass: "from-amber-500/20 to-orange-500/10 border-amber-500/30" },
    DONE: { label: "Done", colorClass: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30" },
  },
  animation: {
    springModal: { type: "spring", damping: 25, stiffness: 350 },
    hoverScale: { scale: 1.05 },
    tapScale: { scale: 0.95 },
  },
} as const;
