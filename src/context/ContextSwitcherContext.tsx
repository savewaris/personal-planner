'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

export interface Context {
  id: string;
  name: string;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface CreateContextInput {
  name: string;
  color?: string;
}

export interface UpdateContextInput {
  name?: string;
  color?: string;
}

export interface ContextSwitcherContextType {
  activeContextId: string | null;
  activeContext: Context | null;
  contexts: Context[];
  isLoading: boolean;
  setActiveContextId: (id: string | null) => void;
  setActiveContext: (context: Context | null) => void;
  addContext: (input: CreateContextInput) => Promise<Context>;
  updateContext: (id: string, input: UpdateContextInput) => Promise<Context>;
  deleteContext: (id: string) => Promise<void>;
  refreshContexts: () => Promise<void>;
}

const STORAGE_KEY = 'planner_active_context_id';

export const SUPPORTED_THEMES = [
  'blue',
  'emerald',
  'purple',
  'amber',
  'rose',
  'green',
] as const;

export type SupportedTheme = (typeof SUPPORTED_THEMES)[number];

const ContextSwitcherContext = createContext<ContextSwitcherContextType | undefined>(
  undefined
);

export function applyTheme(color?: string | null): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const themeName =
    color && (SUPPORTED_THEMES as readonly string[]).includes(color.toLowerCase() as any)
      ? color.toLowerCase()
      : color || 'default';

  root.setAttribute('data-theme', themeName);

  const existingClasses = Array.from(root.classList).filter((cls) =>
    cls.startsWith('theme-')
  );
  existingClasses.forEach((cls) => root.classList.remove(cls));
  root.classList.add(`theme-${themeName}`);
}

export function ContextSwitcherProvider({ children }: { children: ReactNode }) {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [activeContextId, setActiveContextIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setActiveContextId = useCallback((id: string | null) => {
    setActiveContextIdState(id);
    if (typeof window !== 'undefined') {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, id);
      }
    }
  }, []);

  const setActiveContext = useCallback(
    (context: Context | null) => {
      setActiveContextId(context ? context.id : null);
    },
    [setActiveContextId]
  );

  const activeContext = useMemo(() => {
    if (!activeContextId) return null;
    return contexts.find((c) => c.id === activeContextId) || null;
  }, [activeContextId, contexts]);

  useEffect(() => {
    applyTheme(activeContext?.color);
  }, [activeContext]);

  const refreshContexts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contexts');
      if (res.ok) {
        const data: Context[] = await res.json();
        setContexts(data);

        if (typeof window !== 'undefined') {
          const storedId = localStorage.getItem(STORAGE_KEY);
          if (storedId) {
            const exists = data.some((c) => c.id === storedId);
            if (exists) {
              setActiveContextIdState(storedId);
            } else {
              localStorage.removeItem(STORAGE_KEY);
              setActiveContextIdState(null);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch contexts from /api/contexts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        setActiveContextIdState(storedId);
      }
    }
    refreshContexts();
  }, [refreshContexts]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setActiveContextIdState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addContext = useCallback(
    async (input: CreateContextInput): Promise<Context> => {
      const res = await fetch('/api/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create context');
      }
      const newCtx: Context = await res.json();
      setContexts((prev) => [...prev, newCtx]);
      return newCtx;
    },
    []
  );

  const updateContext = useCallback(
    async (id: string, input: UpdateContextInput): Promise<Context> => {
      const res = await fetch(`/api/contexts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update context');
      }
      const updatedCtx: Context = await res.json();
      setContexts((prev) => prev.map((c) => (c.id === id ? updatedCtx : c)));
      return updatedCtx;
    },
    []
  );

  const deleteContext = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/contexts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete context');
      }
      setContexts((prev) => prev.filter((c) => c.id !== id));
      if (activeContextId === id) {
        setActiveContextId(null);
      }
    },
    [activeContextId, setActiveContextId]
  );

  const value = useMemo(
    () => ({
      activeContextId,
      activeContext,
      contexts,
      isLoading,
      setActiveContextId,
      setActiveContext,
      addContext,
      updateContext,
      deleteContext,
      refreshContexts,
    }),
    [
      activeContextId,
      activeContext,
      contexts,
      isLoading,
      setActiveContextId,
      setActiveContext,
      addContext,
      updateContext,
      deleteContext,
      refreshContexts,
    ]
  );

  return (
    <ContextSwitcherContext.Provider value={value}>
      {children}
    </ContextSwitcherContext.Provider>
  );
}

export function useContextSwitcher(): ContextSwitcherContextType {
  const context = useContext(ContextSwitcherContext);
  if (!context) {
    throw new Error(
      'useContextSwitcher must be used within a ContextSwitcherProvider'
    );
  }
  return context;
}
