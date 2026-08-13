export interface ProjectRequirement {
  id: string;
  title?: string;
  text?: string;
  completed: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  description?: string | null;
  status?: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | string;
  progress?: number;
  workflow?: string;
  color?: string | null;
  requirements?: ProjectRequirement[];
  diagramUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
