export interface RoutineItem {
  id: string;
  title: string;
  timeOfDay?: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | string;
  dayKey?: string;
  completed: boolean;
  order?: number;
  tags?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}
