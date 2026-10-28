"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "sso-stored-choice";

function readStored(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function useStoredChoice<T extends string>(
  key: string | null,
  allowed: readonly T[],
) {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange);
    window.addEventListener(CHANGE_EVENT, onChange);

    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => (key ? readStored(key) : null), [key]);

  const stored = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = allowed.find((item) => item === stored) ?? null;

  const setValue = useCallback(
    (next: T) => {
      if (!key) {
        return;
      }

      writeStored(key, next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, setValue] as const;
}
