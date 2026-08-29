---
name: component-generator
description: Scaffolding and authoring UI components adhering to CSS Modules, TypeScript interfaces, and Framer Motion animation patterns.
recommended_model: flash
---

# UI Component Generator Skill

Use this skill when scaffolding or authoring reusable UI components, sections, or layout cards with clean styling, typed props, and smooth micro-interactions.

---

## Component Creation Standard

### 1. File Structure
For any new component `[ComponentName]`:
- Component file: `src/components/[ComponentName].tsx` (or `src/components/sections/[ComponentName].tsx`)
- CSS Module: `src/components/[ComponentName].module.css`

### 2. TypeScript Props Interface
Always define and export an explicit, well-documented props interface:
```typescript
export interface ComponentNameProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}
```

### 3. Component Template
```typescript
'use client';

import React from 'react';
import { FadeIn } from '@/components/MotionWrappers';
import styles from './ComponentName.module.css';

export function ComponentName({ title, description, className, children }: ComponentNameProps) {
  return (
    <FadeIn className={`${styles.container} ${className || ''}`}>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </FadeIn>
  );
}
```

### 4. CSS Module Template
```css
.container {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.container:hover {
  border-color: var(--border-focus);
  box-shadow: 0 4px 20px -2px var(--accent-glow);
}

.title {
  color: var(--text-primary);
  font-size: var(--font-size-md, 1.25rem);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm, 0.95rem);
  line-height: 1.5;
}
```

### 5. Verification
- Verify responsiveness across mobile (`375px`), tablet (`768px`), and desktop (`1440px`).
- Verify TypeScript compilation: `npx tsc --noEmit`.
- Run automated UI test suite: `npm run test:ui`.
