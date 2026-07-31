"use client";

import React from "react";
import { PlannerStoreProvider } from "@/context/PlannerStoreContext";

export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Global App Providers
 * 
 * Encloses the app with PlannerStoreProvider.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <PlannerStoreProvider>
      {children}
    </PlannerStoreProvider>
  );
}
