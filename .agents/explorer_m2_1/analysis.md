# Milestone 2 Analysis: Command Center Navigation & Workspace Switcher (R2)

## Executive Summary
This report presents the architectural blueprint and design specification for **Milestone 2 (R2: Command Center Navigation & Workspace Switcher)** of the Life Planner Next.js application. R2 transforms the traditional navigation layout into an ultra-fluid, dark glassmorphic Command Center featuring:
1. **Responsive Collapsible Glass Sidebar (`Sidebar.tsx`)**: Desktop collapsible (64px mini / 240px expanded) and mobile slide-over drawer with active context branding and smooth Framer Motion transitions.
2. **Command Center Top Navigation (`Navbar.tsx`)**: Sticky glass bar hosting dynamic context switcher pills, breadcrumbs, `Cmd+K` palette trigger input, and mobile menu trigger.
3. **Global `Cmd+K` / `Ctrl+K` Command Palette Modal (`CommandPaletteModal.tsx`)**: Keyboard-driven modal for instant context switching, global search filtering, page navigation, and quick creation shortcuts.
4. **Floating Quick-Add Action Button (`QuickAddFab.tsx`)**: Bottom-right speed-dial menu for quick creation of Tasks, Habits, and Contexts.
5. **Unified State Management**: State flow connecting `ContextSwitcherContext` with UI layout state (`NavigationContext`).

---

## 1. Existing Navigation & Context Codebase Inspection

### Inspection Matrix

| File Path | Current Role & Implementation | R2 Required Transformations |
| flex-1 | --- | --- |
| `src/components/Navbar.tsx` | Top header (145 lines) with static brand logo, dropdown context switcher, and NextAuth profile dropdown. | Redesign into sticky dark glassmorphic top navigation (`backdrop-blur-xl bg-zinc-950/70 border-b border-white/10`). Integrate dynamic context pills, `Cmd+K` trigger input badge, mobile menu hamburger, and Personal Mode badge. |
| `src/components/ContextSwitcher.tsx` | Client component (248 lines) offering `dropdown` and `pills` variants with color dots and modal triggers. | Enhance pills variant with active glow ambient ring, horizontal scroll indicator, and integrate into top nav and sidebar. |
| `src/components/AddContextModal.tsx` | Standard backdrop modal (133 lines) for creating context with color swatch picker. | Upgrade to dark glassmorphism (`glass-card`, `backdrop-blur-xl`, custom radio swatches for 6 theme colors), smooth Framer Motion entry/exit. |
| `src/components/EditContextModal.tsx` | Modal (166 lines) for renaming context, changing color theme, or deleting context. | Upgrade aesthetic to match design system tokens, maintain delete confirmation safeguards. |
| `src/context/ContextSwitcherContext.tsx` | Global React context (256 lines) managing `contexts`, `activeContextId`, `activeContext`, CRUD operations, `localStorage` persistence, and `applyTheme()` attribute switching. | Central state hub for context switching. Integrate hooks to trigger theme updates and data re-filtering across Task Hub and Habit Tracker. |
| `src/app/page.tsx` | Single page layout (161 lines) rendering Navbar, header text, pills switcher, TaskList, HabitTracker. | Restructure into Command Center layout wrapper with fixed/responsive `Sidebar`, top `Navbar`, main dashboard workspace content area, `QuickAddFab`, and `CommandPaletteModal`. |
| `src/app/layout.tsx` | Root layout (38 lines) loading Geist fonts and wrapping with `Providers`. | Ensure layout supports full-height flex/grid structure (`h-screen overflow-hidden` or `min-h-screen`) and wraps global modals. |

---

## 2. R2 Component Design Specifications

### A. Responsive Collapsible Glass Sidebar (`src/components/Sidebar.tsx`)

#### Visual & Functional Requirements
- **Modes**:
  - **Desktop Expanded** (`w-64` / `240px`): Full branding ("Planner" with gradient icon), Active Context section with color indicator badge & workspace switcher trigger, main navigation menu items with icons and text labels, context list sub-navigation, collapse button (`ChevronLeft`).
  - **Desktop Collapsed** (`w-16` / `64px`): Icon-only branding ("P"), active context color ring around avatar/badge, icon-only nav items with hover tooltips (`group-hover`), expand button (`ChevronRight`).
  - **Mobile Drawer** (`< 768px`): Overlay slide-in drawer (`w-72` max-w-[80vw]) with dark backdrop blur (`bg-black/60 backdrop-blur-md`). Closes on backdrop tap or item selection.

#### Component Architecture & Code Blueprint
```tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useContextSwitcher } from "@/context/ContextSwitcherContext";
import { ColorIndicator } from "./ColorIndicator";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { contexts, activeContextId, activeContext, setActiveContextId } = useContextSwitcher();

  const navItems = [
    { label: "Dashboard", href: "/", icon: "GridIcon" },
    { label: "Tasks", href: "/#tasks", icon: "CheckSquareIcon" },
    { label: "Habits", href: "/#habits", icon: "FlameIcon" },
    { label: "Analytics", href: "/#analytics", icon: "BarChartIcon" },
    { label: "Settings", href: "/#settings", icon: "SettingsIcon" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } max-md:fixed max-md:w-72 ${
          mobileOpen ? "translate-x-0" : "max-md:-translate-x-full"
        }`}
      >
        {/* Brand & Workspace Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                P
              </div>
              <span className="font-bold text-white tracking-tight">Planner</span>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
              P
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Active Context Card */}
        {!collapsed && (
          <div className="p-3 mx-2 my-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Active Workspace
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <ColorIndicator color={activeContext?.color} />
                <span className="text-xs font-semibold text-white truncate">
                  {activeContext ? activeContext.name : "All Contexts"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === item.href
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center text-base">
                {item.icon === "GridIcon" && "📊"}
                {item.icon === "CheckSquareIcon" && "✅"}
                {item.icon === "FlameIcon" && "🔥"}
                {item.icon === "BarChartIcon" && "📈"}
                {item.icon === "SettingsIcon" && "⚙️"}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};
```

---

### B. Command Center Top Navigation Bar (`src/components/Navbar.tsx`)

#### Visual & Functional Requirements
- Sticky dark glass top navigation bar (`sticky top-0 z-30 h-16 bg-zinc-950/70 border-b border-white/10 backdrop-blur-xl`).
- Left Section: Mobile Sidebar Toggle button (hamburger / close icon), Breadcrumb ("Workspace / [Active Context]").
- Center Section: Horizontal scrollable Context Switcher Pills (`ContextSwitcher variant="pills"`), featuring context color dots, active theme ambient glow, and "+ Add Context" trigger.
- Right Section: Quick Search palette input trigger with visual `Cmd+K` / `Ctrl+K` shortcut badge, Personal Mode avatar badge ("Local User").

#### Layout Diagram
```
+-----------------------------------------------------------------------------------------------+
| [☰ Mobile] Workspace / [Context] | [ (Dot) Work ] [ (Dot) Personal ] [+] | 🔍 Search [⌘K]  (U) |
+-----------------------------------------------------------------------------------------------+
```

---

### C. Command Palette Modal (`src/components/CommandPaletteModal.tsx`)

#### Visual & Functional Requirements
- **Global Key Listener**: Listens to `KeyDown` events for `(e.metaKey || e.ctrlKey) && e.key === 'k'`, preventing browser defaults and opening palette. Also closes on `Escape`.
- **Glassmorphic Dialog**: Centered modal overlay (`bg-black/70 backdrop-blur-md`), container with dark glass (`bg-zinc-900/90 border border-white/15 shadow-2xl rounded-2xl`).
- **Live Search & Filter**: Real-time query matching across 4 categorized result sections:
  1. **Quick Actions**: "Create Task", "Create Habit", "Create Context", "Toggle Dark Theme".
  2. **Workspaces & Contexts**: Switch to any context directly (executes `setActiveContextId(id)`).
  3. **Navigation Links**: Jump to Dashboard, Task Hub, Habit Tracker, Analytics, Settings.
  4. **Search Matches**: Search items matching title or description.
- **Keyboard Navigation**: Up/Down Arrow key selection, Enter key execution, highlighted index focus.

#### Component Architecture & Code Blueprint
```tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContextSwitcher } from "@/context/ContextSwitcherContext";
import { ColorIndicator } from "./ColorIndicator";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTask?: () => void;
  onOpenCreateHabit?: () => void;
  onOpenCreateContext?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateTask,
  onOpenCreateHabit,
  onOpenCreateContext,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { contexts, setActiveContextId } = useContextSwitcher();

  // Listen for Cmd+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: "new-task", title: "Create New Task", category: "Quick Actions", icon: "➕", action: () => onOpenCreateTask?.() },
    { id: "new-habit", title: "Create New Habit", category: "Quick Actions", icon: "🔥", action: () => onOpenCreateHabit?.() },
    { id: "new-context", title: "Create New Context", category: "Quick Actions", icon: "📁", action: () => onOpenCreateContext?.() },
    ...contexts.map((ctx) => ({
      id: `ctx-${ctx.id}`,
      title: `Switch to Context: ${ctx.name}`,
      category: "Workspaces",
      icon: <ColorIndicator color={ctx.color} />,
      action: () => setActiveContextId(ctx.id),
    })),
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: (typeof actions)[0]) => {
    item.action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-zinc-900/90 border border-white/15 rounded-2xl shadow-2xl overflow-hidden glass-card"
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <span className="text-zinc-400 text-lg mr-3">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base font-medium"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs font-mono text-zinc-400 bg-white/10 rounded-md border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Command Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No matching commands or actions found.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  idx === selectedIndex
                    ? "bg-indigo-600/30 text-white border border-indigo-500/30"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
```

---

### D. Floating Quick-Add Action Button (`src/components/QuickAddFab.tsx`)

#### Visual & Functional Requirements
- **Position**: `fixed bottom-6 right-6 z-40`.
- **Main Trigger**: Circular glass gradient button (`w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-2xl shadow-indigo-500/40 text-white flex items-center justify-center`). Rotates icon 45 degrees (`rotate-45`) when expanded.
- **Speed-Dial Popup**: Vertical stack of action pill buttons rendered with Framer Motion staggered entry:
  - "New Task" button (triggers Task Creation Modal).
  - "New Habit" button (triggers Habit Creation Modal).
  - "New Context" button (triggers `AddContextModal`).
- Tooltip labels with subtle glass borders.

#### Component Architecture & Code Blueprint
```tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAddFabProps {
  onOpenCreateTask: () => void;
  onOpenCreateHabit: () => void;
  onOpenCreateContext: () => void;
}

export const QuickAddFab: React.FC<QuickAddFabProps> = ({
  onOpenCreateTask,
  onOpenCreateHabit,
  onOpenCreateContext,
}) => {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: "New Task", icon: "✅", onClick: onOpenCreateTask },
    { label: "New Habit", icon: "🔥", onClick: onOpenCreateHabit },
    { label: "New Context", icon: "📁", onClick: onOpenCreateContext },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Speed Dial Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="flex flex-col items-end space-y-2 mb-3"
          >
            {actions.map((action, idx) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900/90 border border-white/15 text-white font-medium text-xs shadow-xl backdrop-blur-xl hover:bg-zinc-800 hover:scale-105 transition-all"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Circular Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-2xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Quick Add Menu"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          +
        </motion.span>
      </button>
    </div>
  );
};
```

---

## 3. Comprehensive State Flow & Synchronization Architecture

### State Flow Diagram

```
                              +---------------------------------------+
                              |      ContextSwitcherContext           |
                              | - activeContextId: string | null     |
                              | - contexts: Context[]                 |
                              | - setActiveContextId(id)              |
                              | - addContext(), updateContext()       |
                              +-------------------+-------------------+
                                                  |
              +-----------------------------------+-----------------------------------+
              |                                   |                                   |
              v                                   v                                   v
+---------------------------+       +---------------------------+       +---------------------------+
|       Sidebar.tsx         |       |        Navbar.tsx         |       |   CommandPaletteModal     |
| - Displays active workspace|       | - Renders Context Pills   |       | - Searches Contexts       |
| - Switches context on click|      | - Highlights active chip  |       | - Switches context on Enter|
+---------------------------+       +---------------------------+       +---------------------------+
              |                                   |                                   |
              +-----------------------------------+-----------------------------------+
                                                  |
                                                  v
                                    +---------------------------+
                                    | Task Hub & Habit Tracker  |
                                    | (Filters data by active   |
                                    |  contextId in real time)  |
                                    +---------------------------+
```

### Layout State Management (`NavigationContext` / Layout State)
To coordinate modal triggers and sidebar state across the Command Center navigation, we recommend a lightweight `NavigationContext` (or wrapping state in the root dashboard layout):

```ts
interface NavigationState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  createTaskModalOpen: boolean;
  setCreateTaskModalOpen: (v: boolean) => void;
  createHabitModalOpen: boolean;
  setCreateHabitModalOpen: (v: boolean) => void;
  createContextModalOpen: boolean;
  setCreateContextModalOpen: (v: boolean) => void;
}
```

#### Synchronized Interaction Triggers
1. **Workspace Context Switch**:
   - Triggered via Sidebar context item click, Top Nav Pill click, or `Cmd+K` palette selection.
   - `setActiveContextId(id)` updates context state.
   - `applyTheme(color)` instantly toggles standard CSS color tokens (`data-theme="indigo"`, `data-theme="emerald"`, etc.).
   - `TaskList` and `HabitTracker` reactively re-fetch/re-filter items matching `contextId`.
2. **`Cmd+K` Palette Toggle**:
   - Keyboard listener sets `commandPaletteOpen(true)`.
   - Palette overlay mounts with Framer Motion backdrop blur.
   - Selecting a Quick Action opens the respective creation modal (`createTaskModalOpen`, `createHabitModalOpen`, `createContextModalOpen`) and closes the palette.
3. **FAB Speed Dial**:
   - Clicking FAB opens speed dial menu.
   - Selecting "New Task", "New Habit", or "New Context" invokes `setCreateTaskModalOpen(true)`, `setCreateHabitModalOpen(true)`, or `setCreateContextModalOpen(true)`.

---

## 4. Summary of Worker Action Items for Milestone 2 (R2)

1. **Create `src/components/Sidebar.tsx`**:
   - Implement responsive collapsible glass sidebar with desktop expanded/collapsed modes and mobile drawer.
2. **Update `src/components/Navbar.tsx`**:
   - Transform into sticky dark glassmorphic top navigation bar hosting dynamic context pills, mobile toggle, `Cmd+K` trigger input, and user badge.
3. **Create `src/components/CommandPaletteModal.tsx`**:
   - Implement global `Cmd+K` listener, live search filter, keyboard arrow navigation, and categorized action execution.
4. **Create `src/components/QuickAddFab.tsx`**:
   - Implement floating speed-dial button with Framer Motion animation popups for quick creation.
5. **Integrate Layout in `src/app/page.tsx` & `src/app/layout.tsx`**:
   - Connect all navigation components with `ContextSwitcherContext` and layout state.
