"use client";

import { useId } from "react";
import { Check, Globe } from "lucide-react";

export type SupportedLocale = "en" | "am" | "om";

export const SUPPORTED_LOCALES: Array<{
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
  isMandatory: boolean;
  placeholder: string;
}> = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    isMandatory: true,
    placeholder: "Enter English text (mandatory)",
  },
  {
    code: "am",
    label: "Amharic",
    nativeLabel: "አማርኛ",
    isMandatory: false,
    placeholder: "የአማርኛ ጽሑፍ ያስገቡ (አማራጭ)",
  },
  {
    code: "om",
    label: "Afaan Oromoo",
    nativeLabel: "Afaan Oromoo",
    isMandatory: false,
    placeholder: "Barreeffama Afaan Oromoo galchaa (filannoo)",
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
  onLocaleChange,
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

  const currentLocaleConfig =
    SUPPORTED_LOCALES.find((item) => item.code === activeLocale) ??
    SUPPORTED_LOCALES[0];

  const currentText = value[activeLocale] ?? "";
  const isMandatory = currentLocaleConfig.isMandatory && required;

  const handleTextChange = (text: string) => {
    onChange({
      ...value,
      [activeLocale]: text,
    });
  };

  const isFilled = (code: SupportedLocale) => {
    return Boolean(value[code]?.trim());
  };

  const errorMsg =
    errors[`${label.toLowerCase()}.${activeLocale}`] ||
    errors[activeLocale] ||
    (isMandatory && !currentText.trim() && errors.required
      ? errors.required
      : undefined);

  const placeholderText =
    placeholders[activeLocale] || currentLocaleConfig.placeholder;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Quick Language Status Indicator */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
          <span className="font-normal text-slate-400">·</span>
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
              isMandatory
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Globe className="h-3 w-3" />
            {currentLocaleConfig.nativeLabel} ({currentLocaleConfig.label})
            {isMandatory ? " · Mandatory" : " · Optional"}
          </span>
        </label>

        {/* Quick Locale Pills for fast switching / visual progress */}
        <div
          role="tablist"
          aria-label={`${label} language selection`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-900"
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const filled = isFilled(locale.code);
            const isSelected = activeLocale === locale.code;

            return (
              <button
                key={locale.code}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onLocaleChange?.(locale.code)}
                title={`${locale.label} (${locale.nativeLabel})${
                  locale.isMandatory && required ? " - Mandatory" : " - Optional"
                }`}
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition ${
                  isSelected
                    ? "bg-white text-blue-700 shadow-xs dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <span>{locale.code.toUpperCase()}</span>
                {locale.isMandatory && required && (
                  <span className="text-[10px] text-rose-500">*</span>
                )}
                {filled && (
                  <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Single Active Input (Clean, shows only one language at a time) */}
      <div className="relative">
        {multiline ? (
          <textarea
            id={inputId}
            disabled={disabled}
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholderText}
            rows={3}
            className="min-h-20 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        ) : (
          <input
            id={inputId}
            type="text"
            disabled={disabled}
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholderText}
            className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        )}
      </div>

      {errorMsg && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
