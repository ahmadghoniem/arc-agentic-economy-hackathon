/**
 * chat-storage.ts
 *
 * Tiny localStorage helpers used by the chat hooks. SSR-safe (returns the
 * fallback when `window` is unavailable). Errors are swallowed because the
 * chat session is a UX-nice-to-have, not load-bearing state.
 */

export const CHAT_STORAGE_KEYS = {
  messages: "omniclaw_messages",
  steps: "omniclaw_steps",
  plan: "omniclaw_plan",
} as const

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors
  }
}

export function clearStorage(...keys: string[]): void {
  if (typeof window === "undefined") return
  keys.forEach((key) => localStorage.removeItem(key))
}
