export interface HabitLog {
  id?: string;
  date: string;
  completed: boolean;
  value?: number;
}

export interface HabitItem {
  id: string;
  title?: string;
  name?: string;
  frequency?: "DAILY" | "WEEKLY" | string;
  targetCount?: number;
  streakCount?: number;
  streak?: number;
  bestStreak?: number;
  completedToday?: boolean;
  logs: HabitLog[];
  color?: string | null;
  createdAt?: string;
}
