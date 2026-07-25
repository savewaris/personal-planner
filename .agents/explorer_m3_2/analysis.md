# Analysis Report: Habit Tracker & Streak Engine (Milestone 3)

**Author**: Explorer Agent (`explorer_m3_2`)  
**Date**: 2026-07-21  
**Target Project**: Planner Next.js Application (`d:/save/Antigravity/Planner`)  

---

## 1. Executive Summary & Scope Overview

Milestone 3 includes the **Habit Tracker & Streak Engine**, a key feature enabling users to define daily habits, track completion on a calendar basis, and maintain continuous completion streaks. 

This analysis report provides comprehensive technical specifications, database interaction models, algorithmic specs for streak calculation, Next.js App Router API route handlers, and React component blueprints for `HabitTracker.tsx`.

### Core Requirements
1. **API Route Handlers**:
   - `GET /api/habits`: Retrieves all habits for the authenticated user with calculated streaks and daily completion status.
   - `POST /api/habits`: Creates a new habit (`name`).
   - `POST /api/habits/[id]/log`: Toggles daily habit completion (`completed: boolean`, `date?: string`), recalculates consecutive day streaks, and persists streak updates.
2. **Streak Calculation Algorithm**:
   - Counts consecutive preceding calendar days with completed logs (`completed: true`).
   - Handles active streaks (logs completed today or yesterday).
   - Resets streak count to `0` when a day is missed (no log today or yesterday).
   - Handles edge cases: month boundaries (Jan 31 -> Feb 1), leap years (Feb 28 -> Feb 29), duplicate dates, and unchecking completed logs.
3. **Frontend Habit Tracker Component**:
   - `src/components/HabitTracker.tsx`: Globally visible daily checklist widget on the main dashboard (`data-testid="habit-tracker"`).
   - Displays habit items, streak counters with flame icons (`data-testid="streak-counter"`), today's completion checkboxes (`data-testid="habit-check-today"`), and a habit creation form (`data-testid="habit-name-input"`, `data-testid="add-habit-btn"`).
   - Unaffected by workspace context filters (habits are global per user).

---

## 2. Database & Data Model Analysis

The database model is defined in `prisma/schema.prisma` lines 72–96:

```prisma
model Habit {
  id          String     @id @default(uuid())
  name        String
  streak      Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  logs        HabitLog[]

  @@index([userId])
}

model HabitLog {
  id          String   @id @default(uuid())
  date        DateTime @default(now())
  completed   Boolean  @default(true)
  
  habitId     String
  habit       Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@index([habitId])
}
```

### Data Normalization & Formatting Notes:
1. **Date Normalization**:
   - `HabitLog.date` is stored as `DateTime` in Prisma.
   - To avoid timezone discrepancies between UTC and local system times, all dates must be normalized to `YYYY-MM-DD` strings during calculation and query filtering.
   - When storing in Prisma, `date` should be normalized to midnight UTC (`YYYY-MM-DDT00:00:00.000Z`).
2. **Cascade Deletions**:
   - Deleting a `Habit` automatically cascades to delete all associated `HabitLog` rows (`onDelete: Cascade`).
   - Deleting a `User` cascades to all `Habit` records.
3. **Log Uniqueness per Date**:
   - Each habit should ideally have at most one active log record per calendar date (`YYYY-MM-DD`).
   - The API handler for `/api/habits/[id]/log` will perform an upsert (or lookup by habitId + date range) to prevent duplicate log creation for the same day.

---

## 3. Streak Calculation Algorithm Specification

### Algorithm Logic & Rules
The streak calculation logic is derived from `tests/jest/tier1/habits.test.ts` and `tests/jest/tier2/boundary.test.ts`.

1. **Filter Completed Logs**: Extract all logs where `completed === true`.
2. **Format and Deduplicate Dates**: Convert all completed log dates to `YYYY-MM-DD` formatted strings and take unique values.
3. **Sort Descending**: Sort unique date strings in descending order (most recent first).
4. **Empty Check**: If no completed logs exist, `streak = 0`.
5. **Check Active Window (Today / Yesterday)**:
   - Let `latestDate` be the most recent completed date (`uniqueDates[0]`).
   - Let `todayStr` be `formatDate(new Date())`.
   - Let `yesterdayStr` be `formatDate(new Date(Date.now() - 86400000))`.
   - If `latestDate !== todayStr` and `latestDate !== yesterdayStr`, the streak is broken -> Return `0`.
6. **Count Consecutive Days**:
   - Initialize `currentDate = new Date(latestDate)`.
   - Iterate through `uniqueDates`:
     - If `logDate === currentDate.toISOString().split('T')[0]`, increment `streak` and subtract 1 day from `currentDate`.
     - Else (a day was skipped), break the loop.
   - Return `streak`.

### Code Specification (`src/lib/streak.ts`)

```typescript
export interface HabitLogInput {
  id?: string;
  habitId?: string;
  date: string | Date;
  completed: boolean;
}

/**
 * Normalizes a Date object or ISO string to YYYY-MM-DD format.
 */
export function formatDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Calculates the current consecutive daily streak for a habit based on its log history.
 *
 * Rules:
 * - Only logs with completed === true are counted.
 * - Duplicate logs on the same date are deduplicated.
 * - The streak remains active if the most recent completion is TODAY or YESTERDAY.
 * - If the most recent completion is older than yesterday, streak resets to 0.
 * - Consecutive preceding days are counted backwards from the latest completion.
 */
export function calculateStreak(logs: HabitLogInput[], refDate: Date = new Date()): number {
  // Filter completed logs and normalize dates
  const completedDates = logs
    .filter((log) => log.completed)
    .map((log) => formatDateKey(log.date));

  if (completedDates.length === 0) {
    return 0;
  }

  // Deduplicate and sort descending (latest date first)
  const uniqueDates = Array.from(new Set(completedDates)).sort((a, b) => (a < b ? 1 : -1));

  const todayStr = formatDateKey(refDate);
  const yesterdayDate = new Date(refDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterdayDate);

  const latestCompletedDate = uniqueDates[0];

  // Streak is broken if latest completion is neither today nor yesterday
  if (latestCompletedDate !== todayStr && latestCompletedDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  // Start checking backwards from the latest completed date
  const expectedDate = new Date(latestCompletedDate + 'T00:00:00.000Z');

  for (const logDateStr of uniqueDates) {
    const expectedStr = expectedDate.toISOString().split('T')[0];

    if (logDateStr === expectedStr) {
      streak++;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else {
      // Gap detected in daily completions
      break;
    }
  }

  return streak;
}
```

### Edge Case Handling Matrix
| Scenario | Example Dates | Result / Behavior |
|---|---|---|
| **Completed Today** | Log on `2026-07-21` (Today) | Streak active (`streak >= 1`). Counts today + previous consecutive days. |
| **Completed Yesterday, Pending Today** | Log on `2026-07-20` (Yesterday) | Streak active (`streak >= 1`). User has until end of today to complete without losing streak. |
| **Missed Yesterday & Today** | Last log on `2026-07-18` (3 days ago) | Streak broken (`streak = 0`). |
| **Unchecking Today** | `2026-07-21` changed to `completed: false` | Recalculates logs without today. If yesterday was done, streak becomes count up to yesterday; otherwise `0`. |
| **Month Boundary Transition** | `2026-01-31` and `2026-02-01` | JS `Date.setUTCDate(d - 1)` handles month decrement seamlessly across Jan/Feb. |
| **Leap Year Transition** | `2028-02-28`, `2028-02-29`, `2028-03-01` | Handled properly by UTC date calculations in leap year (2028). |
| **Duplicate Logs on Same Date** | Two logs for `2026-07-21` | `Set` deduplicates date keys before calculating streak. |

---

## 4. API Route Handlers Architecture

### 4.1 `src/app/api/habits/route.ts`

**Endpoints**:
- `GET /api/habits`: List all habits for the logged-in user with streaks and completion status.
- `POST /api/habits`: Create a new habit for the logged-in user.

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateStreak, formatDateKey } from '@/lib/streak';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetDateStr = searchParams.get('date') || formatDateKey(new Date());

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: {
        logs: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedHabits = habits.map((habit) => {
      const formattedLogs = habit.logs.map((log) => ({
        id: log.id,
        habitId: log.habitId,
        date: formatDateKey(log.date),
        completed: log.completed,
      }));

      const computedStreak = calculateStreak(formattedLogs);
      const todayLog = formattedLogs.find((l) => l.date === targetDateStr);
      const completedToday = todayLog ? todayLog.completed : false;

      return {
        id: habit.id,
        name: habit.name,
        streak: computedStreak,
        userId: habit.userId,
        createdAt: habit.createdAt.toISOString(),
        updatedAt: habit.updatedAt.toISOString(),
        logs: formattedLogs,
        completedToday,
      };
    });

    return NextResponse.json(formattedHabits);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = body.name?.trim();

    if (!name || name.length === 0) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Habit name exceeds 100 characters' }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        name,
        userId: session.user.id,
        streak: 0,
      },
      include: {
        logs: true,
      },
    });

    return NextResponse.json(
      {
        id: newHabit.id,
        name: newHabit.name,
        streak: 0,
        userId: newHabit.userId,
        createdAt: newHabit.createdAt.toISOString(),
        updatedAt: newHabit.updatedAt.toISOString(),
        logs: [],
        completedToday: false,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

### 4.2 `src/app/api/habits/[id]/log/route.ts`

**Endpoint**:
- `POST /api/habits/[id]/log`: Toggles/logs completion status for habit `id` on target `date` (defaults to today `YYYY-MM-DD`), recalculates `streak`, and updates `Habit.streak` in the database.

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateStreak, formatDateKey } from '@/lib/streak';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habitId = params.id;
    const body = await request.json();
    const { completed, date: customDate } = body;

    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Field "completed" must be a boolean' }, { status: 400 });
    }

    // Verify habit ownership
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { logs: true },
    });

    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Target date normalized to YYYY-MM-DD
    const targetDateStr = customDate ? formatDateKey(customDate) : formatDateKey(new Date());
    const targetMidnight = new Date(`${targetDateStr}T00:00:00.000Z`);

    // Check for existing log on this date
    const existingLog = habit.logs.find(
      (log) => formatDateKey(log.date) === targetDateStr
    );

    if (existingLog) {
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed },
      });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId,
          date: targetMidnight,
          completed,
        },
      });
    }

    // Refetch all logs to recalculate streak
    const updatedLogs = await prisma.habitLog.findMany({
      where: { habitId },
    });

    const formattedLogs = updatedLogs.map((log) => ({
      id: log.id,
      habitId: log.habitId,
      date: formatDateKey(log.date),
      completed: log.completed,
    }));

    const newStreak = calculateStreak(formattedLogs);

    // Update habit streak in database
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: { streak: newStreak },
      include: { logs: true },
    });

    const todayLog = formattedLogs.find((l) => l.date === targetDateStr);

    return NextResponse.json({
      id: updatedHabit.id,
      name: updatedHabit.name,
      streak: newStreak,
      userId: updatedHabit.userId,
      createdAt: updatedHabit.createdAt.toISOString(),
      updatedAt: updatedHabit.updatedAt.toISOString(),
      logs: formattedLogs,
      completedToday: todayLog ? todayLog.completed : false,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

## 5. Frontend Habit Component Specification (`src/components/HabitTracker.tsx`)

### Layout & Test ID Contract
The component must satisfy `tests/e2e/tier1-habits.spec.ts` selector requirements:
- Root Widget Container: `data-testid="habit-tracker"` or `data-testid="habits-widget"`
- Individual Habit Card/Row: `data-testid="habit-card-{id}"` or `.habit-item`
- Habit Creation Input: `data-testid="habit-name-input"`
- Add Habit Button: `data-testid="add-habit-btn"`
- Completion Checkbox / Toggle: `data-testid="habit-check-today"`
- Streak Counter / Badge: `data-testid="streak-counter"` or `.streak-badge`

### Component Code Spec (`src/components/HabitTracker.tsx`)

```tsx
'use client';

import React, { useState, useEffect } from 'react';

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
  userId: string;
  logs: HabitLog[];
  completedToday?: boolean;
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('Failed to fetch habits');
      const data = await res.json();
      setHabits(data);
    } catch (err: any) {
      setError(err.message || 'Error loading habits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabitName.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create habit');
      }

      const created: Habit = await res.json();
      setHabits((prev) => [...prev, created]);
      setNewHabitName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLog = async (habitId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const updatedCompletedToday = newStatus;
          // Temp streak tweak for instant feedback
          const tempStreak = newStatus ? h.streak + 1 : Math.max(0, h.streak - 1);
          return { ...h, completedToday: updatedCompletedToday, streak: tempStreak };
        }
        return h;
      })
    );

    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update habit log');
      const updatedHabit: Habit = await res.json();

      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? updatedHabit : h))
      );
    } catch (err: any) {
      // Revert on error
      fetchHabits();
    }
  };

  return (
    <section
      data-testid="habit-tracker"
      className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Daily Habits
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Track your streaks
        </span>
      </div>

      {/* Habit Creation Form */}
      <form onSubmit={handleCreateHabit} className="mb-5 flex gap-2">
        <input
          type="text"
          data-testid="habit-name-input"
          placeholder="Add a new habit..."
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          data-testid="add-habit-btn"
          disabled={isSubmitting || !newHabitName.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          Add Habit
        </button>
      </form>

      {error && (
        <div className="mb-4 text-xs text-red-500">{error}</div>
      )}

      {loading ? (
        <div className="py-6 text-center text-sm text-zinc-400">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No habits created yet. Add your first habit above!
        </div>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => (
            <li
              key={habit.id}
              data-testid={`habit-card-${habit.id}`}
              className="habit-item flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  data-testid="habit-check-today"
                  aria-label={`Mark ${habit.name} completed today`}
                  checked={habit.completedToday || false}
                  onChange={() => handleToggleLog(habit.id, habit.completedToday || false)}
                  className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700"
                />
                <span
                  className={`text-sm font-medium ${
                    habit.completedToday
                      ? 'text-zinc-400 line-through dark:text-zinc-500'
                      : 'text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {habit.name}
                </span>
              </div>

              <div
                data-testid="streak-counter"
                className="streak-badge flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/60 dark:text-orange-400"
              >
                <span>🔥</span>
                <span>{habit.streak} {habit.streak === 1 ? 'day' : 'days'}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

---

## 6. Synthesis & Key Architectural Decisions

1. **Global User Profile Scope**:
   - `Habit` records are linked directly to `User` via `userId`. They are NOT bound to `Context` (Work/Personal workspace). This ensures habits remain persistent and visible across all workspace views.
2. **Deterministic Date Math**:
   - Normalizing date keys to `YYYY-MM-DD` strings prevents timezone shift bugs when comparing dates across client and server environments.
3. **Database Transaction Consistency**:
   - `POST /api/habits/[id]/log` guarantees that `Habit.streak` column in database stays synchronized with `calculateStreak(habit.logs)` on every log modification.

---

## 7. Verification Method

To verify the implementation once coded:

1. **Unit Testing**:
   ```bash
   npx jest tests/jest/tier1/habits.test.ts
   npx jest tests/jest/tier2/boundary.test.ts
   npx jest tests/jest/tier3/cross-feature.test.ts
   ```
2. **E2E Testing**:
   ```bash
   npx playwright test tests/e2e/tier1-habits.spec.ts
   ```
3. **Prisma Validation**:
   ```bash
   npx prisma validate
   ```
