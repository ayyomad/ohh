/**
 * App-wide theme state.
 *
 * A single data-theme attribute on <html> is all the "engine" needed: the
 * tokens in styles/tokens.css react to it. localStorage failures (private
 * mode, blocked storage) must never break the app, so every storage access
 * is wrapped.
 */

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ohh-theme";

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Apply the stored theme synchronously; MUST run before the first React
 * render (called from main.tsx) or the first paint flashes the wrong theme.
 */
export function applyInitialTheme(): Theme {
  const theme = readStoredTheme();
  document.documentElement.dataset.theme = theme;
  return theme;
}

interface ThemeController {
  theme: Theme;
  toggleTheme: () => void;
}

export function useTheme(): ThemeController {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Non-persistent environments still get the correct visual theme.
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const toggleTheme = useCallback((): void => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
}
