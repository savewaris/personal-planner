---
name: design-system
description: >-
  Guidelines, best practices, and scaffolding templates for enforcing Design Systems, Design Tokens, Framer Motion animations, and dark glassmorphism styling in web applications.
---

# Design System Enforcement Skill

## Overview
This skill provides guidelines and templates for defining, inspecting, and locking down a web application's visual design tokens (colors, typography, spacing, component contracts).

## Dependencies
- `ui-ux-designer`: For design token structures and accessibility.

## Quick Start
1. Inspect `DESIGN_SYSTEM.md` and `src/app/globals.css`.
2. Reference tokens programmatically via `src/lib/tokens.ts`.
3. Use Framer Motion for interactive feedback (`whileHover`, `whileTap`, `AnimatePresence`).

## Common Mistakes
1. Hardcoding ad-hoc inline styles or custom hex colors instead of using central design tokens.
2. Altering component visual layouts when updating backend API data fetching logic.
3. Removing Framer Motion transition props (`layout`, `AnimatePresence`).
