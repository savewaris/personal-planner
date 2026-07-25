# Milestone 2: Context API Routes & Context Switcher UI Architecture Analysis

## 1. Executive Summary

This report provides the full architectural design, REST API specifications, and React component code blueprints for **Milestone 2: Context API Routes & Context Switcher UI**. 

The Context Switcher is a core foundational feature of Planner, allowing users to organize tasks and projects into distinct contexts (e.g. *Full-Time Job*, *Freelance*, *Side Projects*, *Personal*) or view all tasks across workspaces via *All Contexts*.

This document defines:
1. **Context API Route Handlers** (`src/app/api/contexts/route.ts` & `src/app/api/contexts/[id]/route.ts`) supporting `GET`, `POST`, `PATCH`, and `DELETE`.
2. **Input Validation & Security Constraints**: 50-character max name length, whitespace trimming, ownership checks (`userId`), and HTTP status codes (401, 400, 403, 404, 500).
3. **UI Components & Badges**:
   - `ColorIndicator.tsx`: Standardized color dot indicator supporting color themes.
   - `ContextBadge.tsx`: Reusable context pill component.
   - `AddContextModal.tsx` & `EditContextModal.tsx`: Accessible dialogs for creating and managing contexts.
   - `ContextSwitcher.tsx`: Main Navbar dropdown/pill switcher with context switching, "All Contexts" view, and action controls.

---

## 2. Context API Route Handlers

### 2.1 Database Model Reference (`prisma/schema.prisma`)
```prisma
model Context {
  id        String    @id @default(uuid())
  name      String
  color     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  projects  Project[]
  tasks     Task[]

  @@index([userId])
}
```

---

### 2.2 Endpoint Specifications

#### 1. `GET /api/contexts`
- **Description**: Retrieves all contexts created by the authenticated user, ordered chronologically (`createdAt: asc`).
- **Auth**: Required (`getServerSession(authOptions)`).
- **Request Parameters**: None.
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": "ctx_12345",
      "name": "Full-Time Job",
      "color": "blue",
      "userId": "usr_999",
      "createdAt": "2026-07-21T10:00:00.000Z",
      "updatedAt": "2026-07-21T10:00:00.000Z"
    },
    {
      "id": "ctx_67890",
      "name": "Freelance",
      "color": "purple",
      "userId": "usr_999",
      "createdAt": "2026-07-21T11:00:00.000Z",
      "updatedAt": "2026-07-21T11:00:00.000Z"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "Failed to fetch contexts" }`

#### 2. `POST /api/contexts`
- **Description**: Creates a new workspace context for the authenticated user.
- **Auth**: Required (`getServerSession(authOptions)`).
- **Request Body**:
  ```json
  {
    "name": "Side Projects",
    "color": "emerald"
  }
  ```
- **Validation Rules**:
  - `name`: String, required. Whitespace trimmed. Must not be empty after trim. Max 50 characters.
  - `color`: String, optional. Defaults to `'blue'` if not provided or empty.
- **Success Response (`201 Created`)**:
  ```json
  {
    "id": "ctx_abc123",
    "name": "Side Projects",
    "color": "emerald",
    "userId": "usr_999",
    "createdAt": "2026-07-21T12:00:00.000Z",
    "updatedAt": "2026-07-21T12:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `400 Bad Request`: `{ "error": "Context name cannot be empty" }` or `{ "error": "Context name exceeds maximum length of 50 characters" }`
  - `500 Internal Server Error`: `{ "error": "Failed to create context" }`

#### 3. `PATCH /api/contexts/[id]`
- **Description**: Updates an existing context's `name` and/or `color`. Must belong to the authenticated user.
- **Auth**: Required (`getServerSession(authOptions)`).
- **Route Params**: `id` (Context ID). Note: In Next.js 16 App Router, `params` is `Promise<{ id: string }>`.
- **Request Body**:
  ```json
  {
    "name": "Work & Career",
    "color": "indigo"
  }
  ```
- **Validation Rules**:
  - Check existence and ownership (`userId === session.user.id`).
  - If `name` is provided: trim whitespace. Must not be empty (return 400). Max 50 characters (return 400).
- **Success Response (`200 OK`)**:
  ```json
  {
    "id": "ctx_12345",
    "name": "Work & Career",
    "color": "indigo",
    "userId": "usr_999",
    "createdAt": "2026-07-21T10:00:00.000Z",
    "updatedAt": "2026-07-21T12:30:00.000Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `404 Not Found`: `{ "error": "Context not found" }`
  - `400 Bad Request`: `{ "error": "Context name cannot be empty" }` or `{ "error": "Context name exceeds maximum length of 50 characters" }`
  - `500 Internal Server Error`: `{ "error": "Failed to update context" }`

#### 4. `DELETE /api/contexts/[id]`
- **Description**: Deletes a context owned by the authenticated user. Dependent tasks and projects cascade delete via DB relation.
- **Auth**: Required (`getServerSession(authOptions)`).
- **Route Params**: `id` (Context ID).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "id": "ctx_12345",
    "message": "Context deleted successfully"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `404 Not Found`: `{ "error": "Context not found" }`
  - `500 Internal Server Error`: `{ "error": "Failed to delete context" }`

---

### 2.3 Route Handler Implementation Blueprint

#### `src/app/api/contexts/route.ts`
```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contexts = await prisma.context.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(contexts, { status: 200 });
  } catch (error) {
    console.error("GET /api/contexts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contexts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rawName = body?.name;
    const color = body?.color || "blue";

    if (typeof rawName !== "string") {
      return NextResponse.json(
        { error: "Context name cannot be empty" },
        { status: 400 }
      );
    }

    const trimmedName = rawName.trim();

    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Context name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: "Context name exceeds maximum length of 50 characters" },
        { status: 400 }
      );
    }

    const newContext = await prisma.context.create({
      data: {
        name: trimmedName,
        color: color.trim() || "blue",
        userId: session.user.id,
      },
    });

    return NextResponse.json(newContext, { status: 201 });
  } catch (error) {
    console.error("POST /api/contexts error:", error);
    return NextResponse.json(
      { error: "Failed to create context" },
      { status: 500 }
    );
  }
}
```

#### `src/app/api/contexts/[id]/route.ts`
```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ContextRouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: ContextRouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check context existence and ownership
    const existingContext = await prisma.context.findUnique({
      where: { id },
    });

    if (!existingContext || existingContext.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Context not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: { name?: string; color?: string } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          { error: "Context name cannot be empty" },
          { status: 400 }
        );
      }

      const trimmedName = body.name.trim();

      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: "Context name cannot be empty" },
          { status: 400 }
        );
      }

      if (trimmedName.length > 50) {
        return NextResponse.json(
          { error: "Context name exceeds maximum length of 50 characters" },
          { status: 400 }
        );
      }

      updateData.name = trimmedName;
    }

    if (body.color !== undefined && typeof body.color === "string") {
      updateData.color = body.color.trim();
    }

    const updatedContext = await prisma.context.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedContext, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/contexts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update context" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: ContextRouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingContext = await prisma.context.findUnique({
      where: { id },
    });

    if (!existingContext || existingContext.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Context not found" },
        { status: 404 }
      );
    }

    await prisma.context.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, id, message: "Context deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/contexts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete context" },
      { status: 500 }
    );
  }
}
```

---

## 3. UI Component Architecture Specifications

### 3.1 Color Palette & Theme Definitions (`src/lib/colors.ts`)
To ensure consistent styling across badges, dropdowns, and dynamic themes:

```ts
export type ContextColor =
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "rose"
  | "indigo"
  | "cyan"
  | "slate";

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
  if (!color || !(color in COLOR_PALETTE)) {
    return COLOR_PALETTE.blue;
  }
  return COLOR_PALETTE[color as ContextColor];
}
```

---

### 3.2 Color Indicator Component (`src/components/ColorIndicator.tsx`)
Displays a small colored dot/badge representing the context color.

```tsx
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
```

---

### 3.3 Context Badge Component (`src/components/ContextBadge.tsx`)
Provides a styled badge showing the context dot, context name, and active indicator.

```tsx
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
```

---

### 3.4 Modal Dialog Components (`AddContextModal` & `EditContextModal`)

#### `src/components/AddContextModal.tsx`
```tsx
"use client";

import React, { useState } from "react";
import { COLOR_PALETTE, ContextColor } from "@/lib/colors";

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; color: string }) => Promise<void>;
}

export const AddContextModal: React.FC<AddContextModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<ContextColor>("blue");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Context name cannot be empty");
      return;
    }
    if (trimmed.length > 50) {
      setError("Context name exceeds maximum length of 50 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAdd({ name: trimmed, color: selectedColor });
      setName("");
      setSelectedColor("blue");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create context");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Create New Context
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Context Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Full-Time Job, Side Projects"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <span className="text-xs text-gray-400 mt-1 block text-right">
              {name.length}/50
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(COLOR_PALETTE).map((colorOpt) => (
                <button
                  key={colorOpt.id}
                  type="button"
                  onClick={() => setSelectedColor(colorOpt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    selectedColor === colorOpt.id
                      ? `${colorOpt.borderClass} ${colorOpt.badgeBgClass} ${colorOpt.textClass} ring-2 ${colorOpt.ringClass}`
                      : "border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${colorOpt.dotBgClass}`} />
                  {colorOpt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Context"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

### 3.5 Context Switcher Component (`src/components/ContextSwitcher.tsx`)

The main navbar Context Switcher supporting:
- Displaying active context badge or "All Contexts".
- Dropdown menu to toggle active context.
- Edit/delete context options within dropdown.
- Trigger modal to create new context.
- Dual visual representation (Dropdown + optional Pill Bar view).

```tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useContextSwitcher } from "@/context/ContextSwitcherContext";
import { ColorIndicator } from "./ColorIndicator";
import { AddContextModal } from "./AddContextModal";
import { EditContextModal } from "./EditContextModal";
import { getColorTheme } from "@/lib/colors";

export interface ContextSwitcherProps {
  variant?: "dropdown" | "pills";
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  variant = "dropdown",
}) => {
  const {
    contexts,
    activeContextId,
    activeContext,
    setActiveContextId,
    addContext,
    updateContext,
    deleteContext,
  } = useContextSwitcher();

  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<{ id: string; name: string; color: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeTheme = getColorTheme(activeContext?.color);

  if (variant === "pills") {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {/* All Contexts Pill */}
        <button
          type="button"
          onClick={() => setActiveContextId(null)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeContextId === null
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          All Contexts
        </button>

        {/* Individual Context Pills */}
        {contexts.map((ctx) => {
          const theme = getColorTheme(ctx.color);
          const isActive = activeContextId === ctx.id;
          return (
            <button
              key={ctx.id}
              type="button"
              onClick={() => setActiveContextId(ctx.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? `${theme.badgeBgClass} ${theme.textClass} ${theme.borderClass} border ring-2 ${theme.ringClass}`
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              <ColorIndicator color={ctx.color} size="sm" />
              <span>{ctx.name}</span>
            </button>
          );
        })}

        {/* Add Context Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="Add Context"
        >
          +
        </button>

        <AddContextModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addContext}
        />
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Active Context Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-xs"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {activeContext ? (
          <>
            <ColorIndicator color={activeContext.color} />
            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[130px]">
              {activeContext.name}
            </span>
          </>
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              All Contexts
            </span>
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-50 overflow-hidden py-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-neutral-700/50">
            Workspaces & Contexts
          </div>

          {/* All Contexts Option */}
          <button
            type="button"
            onClick={() => {
              setActiveContextId(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
              activeContextId === null
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>All Contexts</span>
            </div>
            {activeContextId === null && <span className="text-blue-500 font-bold">✓</span>}
          </button>

          {/* Context List */}
          {contexts.map((ctx) => {
            const isSelected = activeContextId === ctx.id;
            return (
              <div
                key={ctx.id}
                className={`group flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveContextId(ctx.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 flex-1 text-left truncate"
                >
                  <ColorIndicator color={ctx.color} />
                  <span className="truncate">{ctx.name}</span>
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingContext({ id: ctx.id, name: ctx.name, color: ctx.color || "blue" });
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded"
                    title="Edit Context"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Context CTA */}
          <div className="p-1 border-t border-gray-100 dark:border-neutral-700 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAddModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
            >
              <span>+</span>
              <span>Create New Context</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Context Modal */}
      <AddContextModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addContext}
      />

      {/* Edit Context Modal */}
      {editingContext && (
        <EditContextModal
          isOpen={!!editingContext}
          context={editingContext}
          onClose={() => setEditingContext(null)}
          onUpdate={updateContext}
          onDelete={async (id) => {
            await deleteContext(id);
            setEditingContext(null);
          }}
        />
      )}
    </div>
  );
};
```

---

## 4. Summary of Verification & Test Alignment

1. **Tier 1 Feature Tests (`tests/jest/tier1/contexts.test.ts`)**:
   - `1.1`: `POST /api/contexts` creates new workspace context.
   - `1.2`: `ContextSwitcher` / `ContextSwitcherContext` toggles active context ID.
   - `1.3`: Dynamically applies theme class `theme-${color}` based on active context color.
   - `1.4`: Filters tasks by `contextId` or returns all tasks when `activeContextId` is `null`.
   - `1.5`: `PATCH /api/contexts/[id]` updates `name` and `color`.
   - `1.6`: `DELETE /api/contexts/[id]` deletes context and resets active context to `null` if deleted.

2. **Tier 2 Boundary Tests (`tests/jest/tier2/boundary.test.ts`)**:
   - `2.1`: Rejects empty or whitespace-only context names with HTTP 400 (`Context name cannot be empty`).
   - `2.2`: Rejects context names > 50 characters with HTTP 400 (`Context name exceeds maximum length of 50 characters`).

3. **Tier 3 Cross-Feature Tests (`tests/jest/tier3/cross-feature.test.ts`)**:
   - `3.1`: Newly created tasks auto-assigned current `activeContextId`.
   - `3.3`: Context deletion detaches or cascades associated tasks cleanly.
