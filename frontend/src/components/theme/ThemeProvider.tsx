"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme: Theme = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
      setThemeState(initialTheme);
      if (initialTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const applyTheme = useCallback((newTheme: Theme) => {
    // 1. Freeze transitions immediately (exact technique from Senbet System themeStore.ts)
    // Guarantees all elements (nav, sidebar, footer, tables, cards) update at the EXACT same millisecond.
    document.documentElement.classList.add("theme-transitioning");

    const updateDOM = () => {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try {
        localStorage.setItem("theme", newTheme);
      } catch {}
      setThemeState(newTheme);
    };

    // 2. View Transitions API if supported
    const doc = typeof document !== "undefined" ? (document as Document & { startViewTransition?: (cb: () => void) => void }) : null;
    if (doc?.startViewTransition) {
      doc.startViewTransition(updateDOM);
    } else {
      updateDOM();
    }

    // 3. Remove freezing class on subsequent animation frames
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("theme-transitioning");
      });
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
