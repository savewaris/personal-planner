---
name: framer-motion-physics
description: Physics-based spring animations, micro-interactions, scroll-linked effects, layout transitions, and reduced-motion accessibility with Framer Motion. Activate this skill when building or refining animated UI components, interactive cards, modals, or page transitions.
---

# Framer Motion Physics & Micro-Interactions Skill

This skill provides production-ready physics formulas, motion hooks, and interaction recipes using Framer Motion (`framer-motion`).

---

## 1. Physics Spring Presets

Always prefer spring physics over linear or fixed-duration easing curves.

```tsx
// 1. Tactile Snap (Buttons, micro-interactions, toggles)
export const tactileSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

// 2. Smooth Floating (Modals, cards, fly-out drawers)
export const floatingSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
  mass: 1,
};

// 3. Dynamic Stagger (Lists, Bento card grids)
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: floatingSpring,
  },
};
```

---

## 2. Micro-Interactions & Hover Gestures

```tsx
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.97 }}
  transition={tactileSpring}
  className={styles.button}
>
  Explore Portfolio
</motion.button>
```

---

## 3. Dynamic Layout Shifts & AnimatePresence

Prevent abrupt layout snapping when filtering or reordering items:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function FilterableGrid({ items, selectedCategory }) {
  return (
    <motion.div layout className={styles.grid}>
      <AnimatePresence mode="popLayout">
        {items
          .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
          .map(item => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={floatingSpring}
              className={styles.card}
            >
              <h3>{item.title}</h3>
            </motion.div>
          ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## 4. Reduced Motion & Accessibility

Always respect user OS preferences for reduced motion:

```tsx
import { useReducedMotion, motion } from 'framer-motion';

export function AccessibleCard({ children }) {
  const shouldReduceMotion = useReducedMotion();

  const animationProps = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: floatingSpring };

  return <motion.div {...animationProps}>{children}</motion.div>;
}
```
