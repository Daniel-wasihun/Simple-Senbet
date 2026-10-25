"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // Freeze ALL element transitions before toggling the class.
    // This guarantees every element (sidebar, cards, text, tables) updates
    // instantly at the exact same millisecond with zero delay or glitch.
    document.documentElement.classList.add("theme-transitioning");

    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    // Remove on the very next paint frame so normal hover/focus transitions work
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("theme-transitioning");
      });
    });
  };

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark/light theme"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-[#141a29] dark:text-[#fba81c] dark:hover:bg-[#1c2438] transition-colors cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[#fba81c]" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" />
      )}
    </button>
  );
}
