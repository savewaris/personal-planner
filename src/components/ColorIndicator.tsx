"use client";

import React from "react";
import { getColorTheme } from "@/lib/colors";

interface ColorIndicatorProps {
  color?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ColorIndicator: React.FC<ColorIndicatorProps> = ({
  color,
  size = "md",
  className = "",
}) => {
  const theme = getColorTheme(color);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
  };

  return (
    <span
      className={`inline-block rounded-full shrink-0 ${theme.dotBgClass} ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    />
  );
};
