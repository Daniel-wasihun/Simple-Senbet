"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg border bg-white dark:bg-[#1c2438] px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b529c] dark:focus-visible:ring-[#fba81c] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          hasError
            ? "border-rose-500 focus-visible:ring-rose-500"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
