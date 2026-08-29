---
name: ux-ui-verifier
description: Automated verification and self-healing runbook for global UX/UI standards, WCAG 2.2 AA accessibility, responsive layout integrity, and touch usability.
recommended_model: flash_lite
---

# UX/UI Global Standards Verifier & Self-Healing Skill

Use this skill whenever creating, updating, or reviewing UI components, pages, or styling across any web application to ensure complete adherence to global UX/UI standards without manual checking.

---

## 1. Global Standards Enforced

1. **WCAG 2.2 AA Accessibility**:
   - Color contrast ratio $\ge 4.5:1$ for normal text, $\ge 3:1$ for large text/icons.
   - Distinct focus rings on interactive elements (`:focus-visible`).
   - Accessible ARIA labels on icon-only buttons.
   - Screen-reader valid hierarchy with unique `<h1>` per page.
2. **Nielsen Norman 10 Usability Heuristics**:
   - Visibility of system status (loading states, hover feedback, active indicators).
   - Error prevention & recovery (form validation, clear action triggers).
   - Aesthetic and minimalist design (consistent typography and spacing).
3. **Responsive Viewport Integrity**:
   - Zero horizontal overflow across Mobile (`375px`), Tablet (`768px`), and Desktop (`1440px`).
   - Fluid typography (`clamp()`) and flexible grid cards (`minmax(auto-fit, ...)`).
4. **Touch & Interaction Ergonomics**:
   - Minimum standalone interactive touch targets $\ge 44 \times 44\text{px}$ (or $\ge 24\text{px}$ WCAG 2.5.8 strict minimum).
   - Adequate tap spacing to avoid misclicks on touchscreens.
5. **Motion Safety**:
   - Support for `@media (prefers-reduced-motion: reduce)` to eliminate vestibular motion triggers.

---

## 2. Automated Test Execution

Run the complete headless Playwright + Axe-Core test suite:

```bash
# Run headless UX/UI audit across all viewports
npm run test:ui

# Run headed mode (interactive browser) for manual visual inspection
npm run test:ui:headed

# View HTML audit report
npm run test:ui:report
```

---

## 3. Self-Healing Playbook for Common Failures

| Failure Detected | Root Cause | Automated Self-Healing Action |
| :--- | :--- | :--- |
| **Color Contrast Failure** | Text color too faint against card/background | Update text color to use higher-contrast token (`var(--text-primary)` or `var(--text-secondary)`). |
| **Horizontal Overflow** | Fixed pixel width or unconstrained flex item | Add `max-width: 100%`, `box-sizing: border-box`, or use `minmax(0, 1fr)` in CSS Grid. |
| **Undersized Touch Target** | Icon button < 24px/44px | Add padding: `padding: 0.5rem;` or `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;`. |
| **Missing Image Alt** | `<img>` tag without description | Add descriptive `alt="Preview thumbnail"` or `alt="" aria-hidden="true"` if purely decorative. |
| **Heading Hierarchy Jump** | Page jumps from `<h1>` to `<h3>` | Adjust heading tags sequentially (`h1` $\rightarrow$ `h2` $\rightarrow$ `h3`). |

---

## 4. Agent Quality Gate Protocol

Before marking any UI task as done:
1. Execute `npm run test:ui`.
2. Verify all test suites pass with **0 violations**.
3. If violations occur, apply the Self-Healing Playbook and re-run until clean.
4. Execute `npm run agent:doctor` to ensure overall repository integrity.
