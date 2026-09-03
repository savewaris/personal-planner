---
name: 🤖 AI Agent Task (Markdown)
about: Structured specification for autonomous AI agent execution
title: "[TASK]: "
labels: ["agent:ready", "feature"]
---

### 🎯 Core Objective
<!-- Concise 1-2 sentence summary of what needs to be built, fixed, or refactored -->

### 📁 Target Files & Scope Boundaries
<!-- Explicit file paths or modules the agent should touch -->
- `src/...`
- `src/types/...`

### 🚫 Non-Goals & Invariants
<!-- What the agent must NOT break, refactor, or change -->
- Do NOT change existing auth architecture.
- Do NOT introduce unneeded third-party libraries.

### 📋 Technical Requirements
<!-- Step-by-step layer breakdown -->
1. **Database / Schema**: 
2. **Backend / API**: 
3. **Frontend / UI**: 

### ✅ Acceptance Criteria & Verification Commands
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Automated UI tests pass (`npm run test:ui`)
- [ ] Production build succeeds (`npm run build`)
- [ ] System health check passes (`npm run agent:doctor`)
