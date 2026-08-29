---
name: wcag-accessibility
description: Enforcing WCAG 2.1 AA accessibility standards, semantic HTML structure, keyboard navigation, visible focus rings, ARIA roles, and screen reader readiness. Activate this skill when auditing or implementing accessible frontend interfaces.
---

# WCAG Accessibility & Inclusive Design Skill

This skill provides testing checklists, ARIA patterns, keyboard focus management, and contrast rules to ensure all user interfaces comply with WCAG 2.1 Level AA.

---

## 1. Core WCAG 2.1 AA Checklist

- [ ] **Contrast Ratio**: Normal text $\ge 4.5:1$, Large text ($\ge 18\text{pt}$ or $14\text{pt}$ bold) $\ge 3:1$, UI components & borders $\ge 3:1$.
- [ ] **Keyboard Navigability**: Every interactive element must be reachable and operable via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, `Arrow` keys).
- [ ] **Focus Visible Rings**: Focus indicators must never be removed (`outline: none` is forbidden without providing an explicit `:focus-visible` replacement).
- [ ] **Alternative Text & Icons**: Pure decorative icons must include `aria-hidden="true"`; interactive icons must have a descriptive `aria-label`.
- [ ] **Form Labels**: Every input field must have an associated `<label htmlFor="...">` or explicit `aria-label`.

---

## 2. Accessible Focus Visible Pattern

```css
/* Global / Component CSS */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
  box-shadow: 0 0 0 4px var(--accent-glow);
}
```

---

## 3. Accessible Modal & Dialog Pattern

```tsx
// Modal.tsx
'use client';
import { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

export function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="modal-title">{title}</h2>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className={styles.closeBtn}
          >
            &times;
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
```
