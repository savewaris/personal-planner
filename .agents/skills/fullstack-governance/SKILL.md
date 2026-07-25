---
name: fullstack-governance
description: >-
  Full-stack software engineering governance enforcing Design Systems, Architecture Structures, Schema Rules, and 4-Point Quality Verification.
---

# Fullstack Engineering Governance Skill

## Overview
Equips AI agents with strict governance protocols across the 4 Core Engineering Pillars:
1. **Design System**: Strict design tokens and Framer Motion contracts (`DESIGN_SYSTEM.md`).
2. **Architecture & Structure**: Layer isolation and naming conventions (`src/components/`, `src/services/`, `src/lib/`, `src/context/`).
3. **Data & Schema**: Prisma model migrations, seeding, and API payload contracts.
4. **4-Point Quality Verification**: `npx tsc --noEmit` ➔ `npx jest` ➔ DevTools Visual Screenshot ➔ Security audit.

## Workflow Execution
- Always inspect `DESIGN_SYSTEM.md` before UI changes.
- Always use `api` service (`src/services/api.ts`) and `usePlannerStore()` for data flow.
- Always run `npx tsc --noEmit` and `npx jest` before concluding turn.
