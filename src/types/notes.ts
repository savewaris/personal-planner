export interface NoteItem {
  id: string;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  contextId?: string | null;
}

export interface SopStep {
  id: string;
  text: string;
  completed?: boolean;
}

export interface SopLink {
  label: string;
  url: string;
}

export interface SopItem {
  id: string;
  title: string;
  category: "Design" | "Development" | "Content" | "Business" | "General" | string;
  description?: string;
  steps: SopStep[];
  links: SopLink[];
  tags: string[];
  projectId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
