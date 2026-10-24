// src/context/LanguageContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "am";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dictionary: any;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Helper for deep merging nested translation objects
function deepMerge(target: any, source: any) {
  if (!source) return target;
  Object.keys(source).forEach((key) => {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [dictionary, setDictionary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadDictionary = async (lang: Language) => {
    setIsLoading(true);
    try {
      const fetchLocales = (l: string) => Promise.all([
        import(`@/locales/${l}/common.json`),
        import(`@/locales/${l}/products.json`),
        import(`@/locales/${l}/dashboard.json`),
        import(`@/locales/${l}/landing.json`),
        import(`@/locales/${l}/service.json`),
        import(`@/locales/${l}/blogs.json`),
        import(`@/locales/${l}/blog.json`),
        import(`@/locales/${l}/partner.json`),
        import(`@/locales/${l}/navigation.json`),
        import(`@/locales/${l}/contactPage.json`),
        import(`@/locales/${l}/contactForm.json`),
        import(`@/locales/${l}/globalOffices.json`),
        import(`@/locales/${l}/faq.json`),
        import(`@/locales/${l}/export.json`),
        import(`@/locales/${l}/login.json`),
        import(`@/locales/${l}/blog-detail.json`),
        import(`@/locales/${l}/aboutUs.json`),
        import(`@/locales/${l}/companyValue.json`),
        import(`@/locales/${l}/timeLine.json`),
        import(`@/locales/${l}/wcu.json`),
        import(`@/locales/${l}/testimonial.json`),
        import(`@/locales/${l}/team.json`),
        import(`@/locales/${l}/slider.json`),
        import(`@/locales/${l}/admin-contact.json`),
        import(`@/locales/${l}/support.json`),
        import(`@/locales/${l}/subscription.json`),
        import(`@/locales/${l}/compliances.json`),
        import(`@/locales/${l}/office.json`),
        import(`@/locales/${l}/process.json`),
        import(`@/locales/${l}/sidebar.json`),
        import(`@/locales/${l}/admin-header.json`),
        import(`@/locales/${l}/users.json`),
        import(`@/locales/${l}/legal.json`),
        import(`@/locales/${l}/cart.json`),
        import(`@/locales/${l}/register.json`),
        import(`@/locales/${l}/password.json`),
        import(`@/locales/${l}/roles.json`),
        import(`@/locales/${l}/order.json`),
        import(`@/locales/${l}/import.json`),
      ]);

      const [enFiles, langFiles] = await Promise.all([
        fetchLocales("en"),
        lang === "en" ? Promise.resolve([]) : fetchLocales(lang)
      ]);

      const buildDictionary = (files: any[]) => ({
        common: files[0].default,
        products: files[1].default,
        dashboard: files[2].default,
        landing: files[3].default,
        service: files[4].default,
        blogs: files[5].default,
        blog: files[6].default,
        partner: files[7].default,
        navigation: files[8].default,
        contactPage: files[9].default,
        contactForm: files[10].default,
        globalOffices: files[11].default,
        faq: files[12].default,
        export: files[13].default,
        login: files[14].default,
        blogDetail: files[15].default,
        about: files[16].default,
        companyValue: files[17].default,
        timeLine: files[18].default,
        wcu: files[19].default,
        testimonial: files[20].default,
        team: files[21].default,
        slider: files[22].default,
        contact: files[23].default,
        support: files[24].default,
        subscription: files[25].default,
        compliance: files[26].default,
        offices: files[27].default,
        process: files[28].default,
        sidebar: files[29].default,
        adminHeader: files[30].default,
        users: files[31].default,
        legal: files[32].default,
        cart: files[33].default,
        register: files[34].default,
        password: files[35].default,
        roles: files[36].default,
        order: files[37].default,
        import: files[38].default,
      });

      const enDict = buildDictionary(enFiles); 
      if (lang === "en") {
        setDictionary(enDict);
      } else {
        const langDict = buildDictionary(langFiles);
        // Deep clone EN base to avoid polluting the module cache
        const mergedDict = JSON.parse(JSON.stringify(enDict));
        // Deep merge: Language has priority over English base overrides the clone
        setDictionary(deepMerge(mergedDict, langDict));
      }
    } catch (error) {
      console.error("Failed to load dictionary:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("preferred-lang") as Language;
    const initialLang: Language = (saved === "en" || saved === "am") ? saved : "en";
    setLanguage(initialLang);
    loadDictionary(initialLang);
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("preferred-lang", lang);
    loadDictionary(lang);
  };

  if (!mounted) {
    return null; // Or a simple placeholder to avoid layout shift
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        dictionary,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
