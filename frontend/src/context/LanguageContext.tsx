"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import enCommon from "@/locales/en/common.json";
import amCommon from "@/locales/am/common.json";
import omCommon from "@/locales/om/common.json";
import enPublic from "@/locales/en/public.json";
import amPublic from "@/locales/am/public.json";
import omPublic from "@/locales/om/public.json";
import enChurch from "@/locales/en/church.json";
import amChurch from "@/locales/am/church.json";
import omChurch from "@/locales/om/church.json";

export type Language = "en" | "am" | "om";
type Dictionary = typeof enCommon & { public: typeof enPublic; church: typeof enChurch };
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  dictionary: Dictionary;
  isLoading: boolean;
};

const dictionaries: Record<Language, Dictionary> = {
  en: { ...enCommon, public: enPublic, church: enChurch },
  am: { ...amCommon, public: amPublic, church: amChurch },
  om: { ...omCommon, public: omPublic, church: omChurch },
};
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("am");

  useEffect(() => {
    const saved = window.localStorage.getItem("preferred-lang");
    if (saved === "en" || saved === "am" || saved === "om") setLanguageState(saved);
    else if (saved === "or") {
      setLanguageState("om");
      window.localStorage.setItem("preferred-lang", "om");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("preferred-lang", nextLanguage);
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage,
    dictionary: dictionaries[language],
    isLoading: false,
  }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
