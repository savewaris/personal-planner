---
name: design-system-tokens
description: Establishing semantic design tokens, CSS custom properties, HSL color ramps, fluid typography clamp scales, and theme switching architecture. Activate this skill when auditing, refactoring, or expanding design tokens and theme variables.
---

# Design System Tokens Skill

This skill provides architecture guidelines and templates for structuring semantic design tokens and fluid responsive scales using standard CSS custom properties.

---

## 1. Semantic Token Hierarchy

Separate base palette tokens (raw colors) from semantic alias tokens (UI roles):

```css
:root {
  /* 1. Base Neutral Scale (HSL / Hex) */
  --color-neutral-950: #09090b;
  --color-neutral-900: #121316;
  --color-neutral-800: #1c1d22;
  --color-neutral-700: #2b2d35;
  --color-neutral-400: #a1a1aa;
  --color-neutral-100: #f4f4f5;

  /* 2. Base Accent Colors */
  --color-cyan-500: #06b6d4;
  --color-cyan-400: #22d3ee;
  --color-violet-500: #8b5cf6;
  --color-emerald-500: #10b981;
  --color-rose-500: #f43f5e;

  /* 3. Semantic Theme Mappings */
  --bg-primary: var(--color-neutral-950);
  --bg-secondary: var(--color-neutral-900);
  --bg-card: rgba(18, 19, 22, 0.7);
  --bg-card-hover: rgba(28, 29, 34, 0.85);

  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --accent-primary: var(--color-cyan-400);
  --accent-secondary: var(--color-violet-500);
  --accent-glow: rgba(34, 211, 238, 0.15);

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(34, 211, 238, 0.4);

  /* 4. Spatial Radii & Shadow Tokens */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  --shadow-subtle: 0 4px 20px -2px rgba(0, 0, 0, 0.3);
  --shadow-elevation: 0 20px 40px -15px rgba(0, 0, 0, 0.6);

  /* 5. Fluid Typography Scale */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.8rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.35vw, 0.925rem);
  --font-size-base: clamp(1rem, 0.95rem + 0.25vw, 1.05rem);
  --font-size-lg: clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 2rem);
  --font-size-3xl: clamp(2rem, 1.75rem + 1.25vw, 2.75rem);
  --font-size-hero: clamp(2.5rem, 2rem + 2.5vw, 4rem);
}
```

---

## 2. Using Fluid Typography in CSS Modules

```css
/* HeroSection.module.css */
.heroTitle {
  font-size: var(--font-size-hero);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.bodyCopy {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.6;
}
```
