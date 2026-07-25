"use client";

import React from "react";
import { ColorIndicator } from "./ColorIndicator";
import { getColorTheme } from "@/lib/colors";

interface ContextBadgeProps {
  name: string;
  color?: string | null;
  isActive?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export const ContextBadge: React.FC<ContextBadgeProps> = ({
  name,
  color,
  isActive = false,
  onClick,
  size = "md",
}) => {
  const theme = getColorTheme(color);

  const paddingClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const activeClasses = isActive
    ? `ring-2 ${theme.ringClass} font-semibold ${theme.badgeBgClass} ${theme.textClass}`
    : `bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-transparent transition-all duration-150 cursor-pointer ${paddingClasses} ${activeClasses}`}
    >
      <ColorIndicator color={color} size={size} />
      <span className="truncate max-w-[140px]">{name}</span>
    </button>
  );
};
