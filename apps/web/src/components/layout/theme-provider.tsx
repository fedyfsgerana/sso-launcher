"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = Readonly<{
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}>;

const STORAGE_KEY = "sso-theme";
const THEME_EVENT = "sso-theme-change";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getThemeSnapshot(): ThemePreference {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return isThemePreference(storedTheme) ? storedTheme : "system";
}

function getThemeServerSnapshot(): ThemePreference {
  return "system";
}

function subscribeTheme(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, listener);
  };
}

function getSystemDarkSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemDarkServerSnapshot() {
  return false;
}

function subscribeSystemTheme(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);

  return () => {
    media.removeEventListener("change", listener);
  };
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") {
    return preference;
  }

  return getSystemDarkSnapshot() ? "dark" : "light";
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

type ThemeProviderProps = Readonly<{
  children: ReactNode;
}>;

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot,
  );
  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    applyTheme(resolveTheme(getThemeSnapshot()));
  }, [theme, systemDark]);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(resolveTheme(nextTheme));
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
