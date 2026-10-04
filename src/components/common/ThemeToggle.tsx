"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";

interface ThemeToggleProps {
  variant?: "icon" | "segmented" | "full";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
            theme === "light"
              ? "bg-white dark:bg-slate-900 text-brand-blue dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title={t("settings.lightTheme")}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">{t("settings.lightTheme")}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
            theme === "dark"
              ? "bg-white dark:bg-slate-900 text-brand-blue dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title={t("settings.darkTheme")}
        >
          <Moon className="h-3.5 w-3.5 text-blue-400" />
          <span className="hidden sm:inline">{t("settings.darkTheme")}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
            theme === "system"
              ? "bg-white dark:bg-slate-900 text-brand-blue dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title={t("settings.systemTheme")}
        >
          <Monitor className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline">{t("settings.systemTheme")}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors border text-slate-200 hover:text-white hover:bg-white/10 border-white/10 dark:border-slate-700/60 ${className}`}
      title={
        resolvedTheme === "dark"
          ? `${t("settings.darkTheme")} -> ${t("settings.lightTheme")}`
          : `${t("settings.lightTheme")} -> ${t("settings.darkTheme")}`
      }
      aria-label="Toggle light and dark theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="h-4 w-4 text-blue-200 hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}
