import { useState, useCallback } from 'react';

const VIEWED_CONCEPTS_KEY = 'ppc_viewed_concepts';

function readFromStorage(): Set<string> {
  try {
    const raw = sessionStorage.getItem(VIEWED_CONCEPTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeToStorage(viewed: Set<string>): void {
  try {
    sessionStorage.setItem(VIEWED_CONCEPTS_KEY, JSON.stringify([...viewed]));
  } catch {
    // sessionStorage may be unavailable in some environments
  }
}

export function useViewedConcepts() {
  const [viewed, setViewed] = useState<Set<string>>(() => readFromStorage());

  const markViewed = useCallback((id: string) => {
    setViewed((prev) => {
      if (prev.has(id)) return prev; // idempotent — return same reference
      const next = new Set(prev);
      next.add(id);
      writeToStorage(next);
      return next;
    });
  }, []); // stable — no external dependencies

  const isViewed = useCallback((id: string) => viewed.has(id), [viewed]);

  return { markViewed, isViewed };
}
