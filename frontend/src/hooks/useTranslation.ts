"use client";

import { useLanguage } from "@/context/LanguageContext";

type TranslationOptions = { defaultValue?: string };

function lookup(dictionary: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, dictionary);
}

export function useTranslation() {
  const { dictionary, language, isLoading } = useLanguage();

  const t = (path: string, options?: TranslationOptions): string => {
    const value = lookup(dictionary, path);
    if (typeof value === "string") return value;
    return options?.defaultValue ?? path;
  };

  const get = (path: string): unknown => lookup(dictionary, path);

  const td = (data: unknown): string => {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      const localized = data as Record<string, unknown>;
      const value = localized[language] ?? localized.en ?? Object.values(localized)[0];
      return typeof value === "string" ? value : "";
    }
    return String(data);
  };

  return { t, td, get, currentLocale: language, isLoading };
}
