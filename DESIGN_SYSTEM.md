# Planner — Design System & Token Specification

> **Mandatory Rule for AI Assistants & Developers**:
> This document is the single source of truth for the Planner visual design system. Whenever making code updates, bug fixes, or feature additions, you MUST NOT change the visual design tokens, component styles, or aesthetic contracts defined in this document without explicit user consent.

---

## 1. Technical Vocabulary (Simple Explanation)

| Term | Simple Definition | How It Protects Your App |
|------|-------------------|--------------------------|
| **Design System** | The single rulebook for how every screen, button, card, and font must look across the entire app. | Stops the app from changing looks every time a fix or update is made. |
| **Design Tokens** | Visual variables (colors, fonts, border-radius, glass transparency, shadows, animations) stored in one central location. | Ensures changing a color in one file updates the whole app consistently instead of using random hex codes everywhere. |
| **Semantic Variables** | Meaningful labels assigned to tokens (e.g. `--color-primary`, `--glass-bg`, `--status-done`). | Keeps design intent clear (e.g. "Done status is always Emerald green"). |
| **Component Contract** | Immutable structure and style rules for reusable UI widgets (Cards, Buttons, Modals, Badges). | Guarantees that fixing backend data logic never alters how the button or card looks. |

---

## 2. Design Tokens (Single Source of Truth)

### Background & Surface Tokens
- **App Background**: `#09090b` (zinc-950) with subtle 36px grid pattern (`rgba(255, 255, 255, 0.03)`).
- **Glass Card Background**: `rgba(39, 39, 42, 0.5)` with `backdrop-filter: blur(16px)` and `border: 1px solid rgba(255, 255, 255, 0.08)`.
- **Glass Header Background**: `rgba(24, 24, 27, 0.7)` with `backdrop-filter: blur(16px)`.

### Primary Brand Gradients
- **Brand Gradient**: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)` (Indigo → Purple → Pink)
- **Gradient Text Class**: `.gradient-text` with `background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)`

### Context Theme Palettes
- **Personal / Blue**: `--theme-primary: #3b82f6`
- **Work / Emerald**: `--theme-primary: #10b981`
- **Freelance / Purple**: `--theme-primary: #a855f7`

### Task Priority Badges
- **HIGH Priority**: `bg-rose-500/15 text-rose-400 border-rose-500/30`
- **MEDIUM Priority**: `bg-amber-500/15 text-amber-400 border-amber-500/30`
- **LOW Priority**: `bg-emerald-500/15 text-emerald-400 border-emerald-500/30`

### Task Status Columns
- **To Do**: Indigo accent (`from-indigo-500/20 to-blue-500/10`)
- **In Progress**: Amber accent (`from-amber-500/20 to-orange-500/10`)
- **Done**: Emerald accent (`from-emerald-500/20 to-teal-500/10`)

---

## 3. Immutable Component Contracts

### 1. Buttons (`.btn-premium`)
- Premium gradient background, 12px border-radius, font-semibold, hover lift (`translateY(-2px)`), shadow glow (`0 4px 15px rgba(99, 102, 241, 0.35)`).

### 2. Cards (`.glass-card`)
- Dark glassmorphism, 16px border-radius, subtle 1px border (`rgba(255,255,255,0.08)`), hover border glow (`rgba(99,102,241,0.4)`).

### 3. Modals & Overlays (`CommandPalette`, `QuickAddFAB`)
- Black backdrop blur (`bg-black/70 backdrop-blur-md`), Framer Motion spring transition (`damping: 25, stiffness: 350`), 16px border-radius.

---

## 4. Enforcement Rule for AI Developers

1. **Before modifying any UI file**: Read `DESIGN_SYSTEM.md` and `src/app/globals.css`.
2. **Never hardcode inline style overrides**: Use existing `.glass-card`, `.btn-premium`, and Tailwind theme utility classes.
3. **Preserve motion transitions**: Keep Framer Motion micro-animations (`whileHover`, `whileTap`, `AnimatePresence`) intact.
