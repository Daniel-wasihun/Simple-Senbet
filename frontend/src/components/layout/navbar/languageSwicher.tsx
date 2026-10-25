"use client";

import { Globe } from "lucide-react";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <label className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#141a29] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs ${className}`}>
      <Globe aria-hidden="true" className="h-3.5 w-3.5 text-[#244a72] dark:text-[#93c5fd]" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="max-w-28 cursor-pointer border-0 bg-transparent text-inherit outline-none"
      >
        <option value="am">{t("language.amharic")}</option>
        <option value="en">{t("language.english")}</option>
        <option value="om">{t("language.oromo")}</option>
      </select>
    </label>
  );
}
