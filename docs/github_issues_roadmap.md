# Personal Planner — Development Roadmap & GitHub Issues

This document tracks structured GitHub issues and implementation roadmaps for the **Personal Planner** application.

---

## 📌 Issue #1: feat(tasks): Time-Horizon Smart Board (Overdue, Today, This Week, This Month, Completed)
- **GitHub Issue**: [#11](https://github.com/savewaris/personal-planner/issues/11)
- **Status**: ✅ Completed & Verified
- **Labels**: `feature`, `frontend`, `ui/ux`, `enhancement`

### 🎯 Overview & Rationale
Transform the Task Hub with an intelligent **Time-Horizon Smart Kanban Board** that categorizes tasks by temporal urgency and planning horizons rather than only static workflow states.

### 📋 Board Structure (5 Smart Time Horizons)
1. **⚠️ Overdue (Urgent Alert)**: Tasks with past due dates that require immediate attention or rescheduling.
2. **🔥 Today (Focus)**: Tasks due today (`YYYY-MM-DD`).
3. **⚡ This Week (Active Horizon)**: Tasks due within the next 7 days.
4. **📅 This Month (Strategic Horizon)**: Tasks due within the next 30 days.
5. **✅ Completed (Accomplished)**: Finished tasks with momentum indicators.

---

## 📌 Issue #2: feat(tasks): Task Editing Drawer Modal & Multi-Project Filtering and Grouping
- **GitHub Issue**: [#12](https://github.com/savewaris/personal-planner/issues/12)
- **Status**: ✅ Completed & Verified
- **Labels**: `feature`, `frontend`, `ui/ux`, `enhancement`

### 🎯 Overview & Rationale
Empower users to effortlessly modify task details and organize their workflows by specific initiatives through an interactive **Slide-over Edit Task Drawer** and flexible **Project Filtering & Grouping** in the Task Hub.

### 📋 Feature 1: Slide-over Edit Task Drawer / Modal
- **Trigger**: Clicking anywhere on a task card body or clicking a dedicated `✏️ Edit` icon opens the slide-over drawer with smooth spring physics (`stiffness: 380, damping: 30`).
- **Editable Properties**:
  1. **Title**: Direct input with validation.
  2. **Description**: Multiline textarea for rich notes and sub-tasks.
  3. **Priority**: Visual selector (`LOW` 🟢, `MEDIUM` 🟡, `HIGH` 🟠, `URGENT` 🔴).
  4. **Due Date**: Date picker with quick shortcuts (*Today*, *Tomorrow*, *Next Week*, *End of Month*).
  5. **Workspace Context**: Context dropdown with color dots (`#work`, `#personal`, `#study`).
  6. **Project Association**: Project dropdown selector to assign or reassign task to an active project (or *No Project*).
  7. **Tags**: Interactive tag pills with auto-suggest and comma separation.
  8. **Danger Zone**: Delete task button with confirmation.
- **Persistence**: Real-time optimistic update in `PlannerStoreContext` and background `PATCH /api/tasks/[id]` request.

### 📋 Feature 2: Multi-Project Filtering & Grouping
- **Header Project Filter Dropdown**:
  - Located in the Task Hub toolbar next to search and view switchers.
  - Options:
    - `All Projects` (default - displays all tasks).
    - `No Project / Standalone Tasks` (tasks without `projectId`).
    - List of all active user projects with color dots and task counts.
  - Filters both Kanban and List views instantaneously.
- **Kanban 'Project' Grouping Mode**:
  - Add `groupBy: "project"` alongside *Time Horizon*, *Status*, *Priority*, *Workspace*, and *Tags*.
  - Columns represent active user projects plus an `Unassigned / Standalone` column.
  - **Drag-and-Drop Assignment**: Dragging a card between project columns automatically updates its `projectId` in the database.

### 🧪 Acceptance Criteria & Test Plan
- [x] Clicking a task card opens the `EditTaskDrawer` pre-populated with current task values.
- [x] Submitting changes updates the task in memory immediately and sends `PATCH /api/tasks/[id]`.
- [x] Project filter dropdown filters all tasks across Kanban and List views.
- [x] Switching Kanban grouping to "Project" displays project columns and handles drag-and-drop reassignment.
- [x] Fully responsive on Mobile (375px), Tablet (768px), and Desktop (1440px) with 0 horizontal overflow.
- [x] Meets WCAG 2.2 AA accessibility and >= 24px touch target ergonomics.
- [x] Codebase Doctor (23/23), Jest unit tests (58/58), and Playwright suites pass.
