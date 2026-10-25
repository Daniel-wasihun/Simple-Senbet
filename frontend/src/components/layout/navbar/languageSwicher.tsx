"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const [lang, setLang] = useState<"en" | "am">("am");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("preferred-lang");
      if (saved === "en" || saved === "am") {
        setLang(saved);
      }
    } catch {}
  }, []);

  const toggleLang = () => {
    const nextLang = lang === "am" ? "en" : "am";
    setLang(nextLang);
    try {
      localStorage.setItem("preferred-lang", nextLang);
      window.dispatchEvent(new CustomEvent("languagechange", { detail: nextLang }));
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={lang === "am" ? "Switch to English (ወደ እንግሊዝኛ)" : "ወደ አማርኛ ቀይር (Switch to Amharic)"}
      aria-label="Change language"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#141a29] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c2438] transition-colors cursor-pointer shadow-2xs ${className}`}
    >
      <Globe className="w-3.5 h-3.5 text-[#8c7140] dark:text-[#fba81c]" />
      <span>{lang === "am" ? "አማርኛ" : "English"}</span>
    </button>
  );
}
