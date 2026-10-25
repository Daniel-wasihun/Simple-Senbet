"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-transparent ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark/light theme"
      title={isDark ? "Switch to light theme (የቀን ገጽታ)" : "Switch to dark theme (የጨለማ ገጽታ)"}
      className={`relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-[#141a29] dark:text-[#fba81c] dark:hover:bg-[#1c2438] cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[#fba81c]" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" />
      )}
    </button>
  );
}
