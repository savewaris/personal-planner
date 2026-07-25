# Design System & Apple Aesthetic Guardrail Rule

Whenever modifying frontend code (`src/app/`, `src/components/`, `src/app/globals.css`), you MUST strictly adhere to the project's **Apple-Inspired Design System Specification** defined in [`DESIGN_SYSTEM.md`](file:///d:/save/Antigravity/Planner/DESIGN_SYSTEM.md).

## Core Design Rules:
1. **Background & Canvas**: Background canvas is 10% brighter Apple dark charcoal (`--background: #141417`). Never revert to pure black or dark grey backgrounds.
2. **Typography Scale**: Global typography base font size is set to `17.5px` (+10% scale). Ensure clean hierarchy and crisp readability.
3. **Creation Modals**: All creation modals (Task / Habit) MUST be **Right-Side Slide-Over Drawers** with `bg-black/40 backdrop-blur-sm` (40% translucent backdrop).
4. **Empty State Animations**: Empty states (Kanban columns, habit lists) MUST feature visible dashed borders (`border-white/20`) and spring scale hover animations (`whileHover={{ scale: 1.03 }}`).
5. **Framer Motion Micro-animations**: Maintain smooth spring transitions (`stiffness: 350, damping: 32`) on all interactive buttons, cards, and sidebar collapse states.
