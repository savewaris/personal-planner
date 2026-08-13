export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | string;
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | string;

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  tags?: string | string[] | null;
  subtasks?: string | null;
  contextId?: string | null;
  projectId?: string | null;
  context?: {
    id: string;
    name: string;
    color?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type GroupByOption = "status" | "context" | "priority" | "tag";
