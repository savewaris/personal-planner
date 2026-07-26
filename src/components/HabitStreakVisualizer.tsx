"use client";

import React from "react";
import { FlameStreakBadge } from "./FlameStreakBadge";

interface HabitStreakVisualizerProps {
  streak: number;
}

export const HabitStreakVisualizer: React.FC<HabitStreakVisualizerProps> = ({ streak }) => {
  return <FlameStreakBadge streak={streak} size="md" />;
};
