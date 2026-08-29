---
name: bento-grid-architect
description: Designing and engineering modern, responsive Bento Grid layouts, asymmetric card structures, radial hover glows, and responsive multi-column layouts using pure CSS Modules and CSS Grid. Activate this skill when building dashboard overviews, project showcases, or featured cards.
---

# Bento Grid Architect Skill

This skill provides layout patterns and CSS Module recipes for modern, responsive Bento Grid user interfaces.

---

## 1. Bento Grid Breakpoints & Column Strategy

Always build bento layouts with CSS Grid using `auto-fit` or explicit column spans that collapse gracefully:

```css
/* BentoGrid.module.css */
.bentoGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Tablet: 2 Columns */
@media (min-width: 640px) {
  .bentoGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3-4 Column Asymmetric Layout */
@media (min-width: 1024px) {
  .bentoGrid {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(220px, auto);
  }

  .featuredHero {
    grid-column: span 2;
    grid-row: span 2;
  }

  .wideCard {
    grid-column: span 2;
  }

  .tallCard {
    grid-row: span 2;
  }
}
```

---

## 2. Interactive Radial Hover Glow Overlay

Elevate cards with interactive glow effects reacting to mouse movement:

```tsx
// BentoCard.tsx
'use client';
import { useState, MouseEvent } from 'react';
import styles from './BentoCard.module.css';

export function BentoCard({ title, description, children, className = '' }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      className={`${styles.card} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={styles.glowOverlay}
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, var(--accent-glow), transparent 70%)`,
        }}
      />
      <div className={styles.content}>
        <h3>{title}</h3>
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}
```

```css
/* BentoCard.module.css */
.card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  overflow: hidden;
  transition: border-color 0.25s ease, transform 0.25s ease;
}

.card:hover {
  border-color: var(--border-focus);
}

.glowOverlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.content {
  position: relative;
  z-index: 1;
}
```
