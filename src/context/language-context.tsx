"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SupportedLanguage, translations } from "@/i18n/translations";
import {
  translateClassName,
  translateCourseName,
  translateAttendanceStatus,
  translateRole,
  translateGender,
  translateStudentStatus,
  translateResultStatus,
  translateAssessmentType,
} from "@/i18n/domain";
import { AttendanceStatus, UserRole, StudentStatus, AssessmentType } from "@/types";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tClass: (name: string) => string;
  tCourse: (name: string) => string;
  tAttendance: (status: AttendanceStatus) => string;
  tRole: (role: UserRole) => string;
  tGender: (gender: "male" | "female") => string;
  tStudentStatus: (status: StudentStatus) => string;
  tResult: (status: "Passed" | "Failed" | "In Progress") => string;
  tAssessmentType: (type: AssessmentType) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_STORAGE_KEY = "senbet_language_v1";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLanguage | null;
      if (stored && ["en", "am", "or"].includes(stored)) {
        setLanguageState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key] || translations.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tClass: (name) => translateClassName(name, language),
        tCourse: (name) => translateCourseName(name, language),
        tAttendance: (status) => translateAttendanceStatus(status, language),
        tRole: (role) => translateRole(role, language),
        tGender: (gender) => translateGender(gender, language),
        tStudentStatus: (status) => translateStudentStatus(status, language),
        tResult: (status) => translateResultStatus(status, language),
        tAssessmentType: (type) => translateAssessmentType(type, language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
