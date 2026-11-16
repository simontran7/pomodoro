import { useEffect, useState } from "react";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** useState that persists to localStorage. Falls back to in-memory state if storage is unavailable. */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed: unknown = JSON.parse(raw);
      // Merge objects so newly added settings get their defaults.
      if (isPlainObject(initial) && isPlainObject(parsed)) return { ...initial, ...parsed } as T;
      return parsed as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked (private mode, quota): keep working in memory.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
