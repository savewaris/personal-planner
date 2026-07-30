"use client";

import React from "react";
import { ContextSwitcherProvider } from "@/context/ContextSwitcherContext";
import { PlannerStoreProvider } from "@/context/PlannerStoreContext";

export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Global App Providers
 * 
 * Encloses the app with ContextSwitcherProvider and PlannerStoreProvider.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ContextSwitcherProvider>
      <PlannerStoreProvider>
        {children}
      </PlannerStoreProvider>
    </ContextSwitcherProvider>
  );
}
