/**
 * Generic localStorage persistence middleware for Zustand.
 * Reads initial state from localStorage and syncs on every write.
 * Ready to swap for a real backend — just replace persist() calls.
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota or private-mode — silently ignore
  }
}
