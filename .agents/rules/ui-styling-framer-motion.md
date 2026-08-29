# UI, Scoped Styling & Framer Motion Rules

## 1. Zero CSS-in-JS & Scoped Styling

- **Scoped Styling Modules**: Use `[ComponentName].module.css` colocated with components.
- **CSS Variables & Tokens**: Utilize semantic design tokens:
  - Backgrounds: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-card)`, `var(--bg-card-hover)`
  - Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
  - Accents: `var(--accent-primary)`, `var(--accent-glow)`, `var(--accent-secondary)`
  - Borders: `var(--border-subtle)`, `var(--border-focus)`
  - Fluid Typography: `clamp()` based responsive font tokens.

---

## 2. Framer Motion Physics & Micro-Interactions

- **Physics Springs**: Prefer spring configurations (`stiffness: 380, damping: 30, mass: 0.8`) over linear eases.
- **Hardware Acceleration**: Animate `transform` (`x`, `y`, `scale`) and `opacity`. Avoid layout thrashing.
- **Reduced Motion Support**: Ensure animations honor `prefers-reduced-motion`.

---

## 3. Automated UX/UI Verification Gate

Before completing any task touching UI components:
1. Run `npm run test:ui` (Playwright + Axe-Core).
2. Ensure 0 WCAG 2.2 AA violations and 0 layout overflow issues across mobile, tablet, and desktop viewports.
