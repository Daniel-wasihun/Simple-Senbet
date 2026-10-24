// src/hooks/useTranslation.ts
"use client";

import { useLanguage } from "@/context/LanguageContext";

export function useTranslation() {
  const { dictionary, language, isLoading } = useLanguage();

  const t = (path: string, p0?: { defaultValue: string; }): string => {
    if (isLoading) return "...";

    return path.split(".").reduce((obj, key) => obj?.[key], dictionary) || path;
  };

  const td = (data: any): string => {
    if (!data) return "";
    if (typeof data === "string") return data;
    // Priority: Current selected language -> English fallback -> First key available
    return data[language] || data["en"] || Object.values(data)[0] || "";
  };

  return { t, td, currentLocale: language, isLoading };
}
