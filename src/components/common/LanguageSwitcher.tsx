"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n/translations";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "header" | "pill" | "select" | "full";
}

export function LanguageSwitcher({ className, variant = "header" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === "pill" || variant === "full") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
          className
        )}
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
              language === l.code
                ? "bg-white dark:bg-slate-900 text-brand-blue dark:text-brand-gold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {l.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs">
        <Globe className="h-3.5 w-3.5 text-brand-blue dark:text-brand-gold shrink-0" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="bg-transparent text-xs text-slate-800 dark:text-slate-100 font-semibold outline-none cursor-pointer pr-1"
          aria-label="Select Language"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option
              key={l.code}
              value={l.code}
              className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium"
            >
              {l.flag} {l.nativeName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
