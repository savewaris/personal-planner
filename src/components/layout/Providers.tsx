"use client";

import React from "react";
import { PlannerStoreProvider } from "@/context/PlannerStoreContext";
import { ThemeProvider } from "@/context/ThemeContext";

export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Global App Providers
 * 
 * Encloses the app with ThemeProvider and PlannerStoreProvider.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <PlannerStoreProvider>
        {children}
      </PlannerStoreProvider>
    </ThemeProvider>
  );
}
