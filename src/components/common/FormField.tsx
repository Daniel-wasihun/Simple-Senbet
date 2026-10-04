"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-rose-500 animate-in fade-in-50">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
