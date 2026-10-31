"use client";

import React, { useId } from "react";
import { labelCls, inputCls } from "@/components/admin/adminUiTokens";

export type SupportedLocale = "en" | "am" | "om";

export const SUPPORTED_LOCALES: Array<{
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
}> = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
  },
  {
    code: "am",
    label: "Amharic",
    nativeLabel: "አማርኛ",
  },
  {
    code: "om",
    label: "Afaan Oromoo",
    nativeLabel: "Afaan Oromoo",
  },
];

export type LocalizedFieldInputProps = {
  label: string;
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string>) => void;
  activeLocale: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  required?: boolean;
  multiline?: boolean;
  placeholders?: Partial<Record<SupportedLocale, string>>;
  errors?: Record<string, string>;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function LocalizedFieldInput({
  label,
  value = { en: "", am: "", om: "" },
  onChange,
  activeLocale = "en",
  required = true,
  multiline = false,
  placeholders = {},
  errors = {},
  disabled = false,
  id: customId,
  className = "",
}: LocalizedFieldInputProps) {
  const generatedId = useId();
  const inputId = customId || `${generatedId}-${activeLocale}`;

  const langLabel =
    activeLocale === "am" ? "አማርኛ" : activeLocale === "om" ? "Afaan Oromoo" : "English";

  const currentText = value?.[activeLocale] ?? "";

  const handleTextChange = (text: string) => {
    onChange({
      ...value,
      [activeLocale]: text,
    });
  };

  const errorMsg =
    errors[`${label.toLowerCase()}.${activeLocale}`] ||
    errors[activeLocale] ||
    (required && activeLocale === "en" && !currentText.trim() && errors.required
      ? errors.required
      : undefined);

  const placeholderText =
    placeholders[activeLocale] || `${label} (${langLabel})`;

  return (
    <div className={className}>
      {/* Label and Language Badge (identical to /members) */}
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={inputId} className={labelCls}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
          {langLabel}
        </span>
      </div>

      <div className="relative">
        {multiline ? (
          <textarea
            id={inputId}
            disabled={disabled}
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholderText}
            rows={3}
            className={`w-full min-h-20 py-2 rounded-[4px] border px-3 text-xs bg-white dark:bg-[#0e1320] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden transition ${
              errorMsg
                ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/20"
                : "border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-sky-500"
            }`}
          />
        ) : (
          <input
            id={inputId}
            type="text"
            disabled={disabled}
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholderText}
            className={inputCls(Boolean(errorMsg))}
          />
        )}
      </div>

      {errorMsg && (
        <p className="mt-0.5 text-[11px] text-rose-500 font-medium">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
