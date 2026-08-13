export type ContextColor =
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "rose"
  | "indigo"
  | "cyan"
  | "slate"
  | "green";

export interface ColorThemeOption {
  id: ContextColor;
  label: string;
  dotBgClass: string;
  badgeBgClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
}

export const COLOR_PALETTE: Record<ContextColor, ColorThemeOption> = {
  blue: {
    id: "blue",
    label: "Blue",
    dotBgClass: "bg-blue-500",
    badgeBgClass: "bg-blue-50 dark:bg-blue-950/40",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-800",
    ringClass: "ring-blue-500",
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    dotBgClass: "bg-emerald-500",
    badgeBgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    ringClass: "ring-emerald-500",
  },
  green: {
    id: "green",
    label: "Green",
    dotBgClass: "bg-emerald-500",
    badgeBgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    ringClass: "ring-emerald-500",
  },
  purple: {
    id: "purple",
    label: "Purple",
    dotBgClass: "bg-purple-500",
    badgeBgClass: "bg-purple-50 dark:bg-purple-950/40",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-200 dark:border-purple-800",
    ringClass: "ring-purple-500",
  },
  amber: {
    id: "amber",
    label: "Amber",
    dotBgClass: "bg-amber-500",
    badgeBgClass: "bg-amber-50 dark:bg-amber-950/40",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-200 dark:border-amber-800",
    ringClass: "ring-amber-500",
  },
  rose: {
    id: "rose",
    label: "Rose",
    dotBgClass: "bg-rose-500",
    badgeBgClass: "bg-rose-50 dark:bg-rose-950/40",
    textClass: "text-rose-700 dark:text-rose-300",
    borderClass: "border-rose-200 dark:border-rose-800",
    ringClass: "ring-rose-500",
  },
  indigo: {
    id: "indigo",
    label: "Indigo",
    dotBgClass: "bg-indigo-500",
    badgeBgClass: "bg-indigo-50 dark:bg-indigo-950/40",
    textClass: "text-indigo-700 dark:text-indigo-300",
    borderClass: "border-indigo-200 dark:border-indigo-800",
    ringClass: "ring-indigo-500",
  },
  cyan: {
    id: "cyan",
    label: "Cyan",
    dotBgClass: "bg-cyan-500",
    badgeBgClass: "bg-cyan-50 dark:bg-cyan-950/40",
    textClass: "text-cyan-700 dark:text-cyan-300",
    borderClass: "border-cyan-200 dark:border-cyan-800",
    ringClass: "ring-cyan-500",
  },
  slate: {
    id: "slate",
    label: "Slate",
    dotBgClass: "bg-slate-500",
    badgeBgClass: "bg-slate-50 dark:bg-slate-900",
    textClass: "text-slate-700 dark:text-slate-300",
    borderClass: "border-slate-200 dark:border-slate-800",
    ringClass: "ring-slate-500",
  },
};

export function getColorTheme(color?: string | null): ColorThemeOption {
  if (!color || !(color.toLowerCase() in COLOR_PALETTE)) {
    return COLOR_PALETTE.blue;
  }
  return COLOR_PALETTE[color.toLowerCase() as ContextColor];
}
