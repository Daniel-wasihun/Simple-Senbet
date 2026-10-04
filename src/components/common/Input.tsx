"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, hasError, ...props }, ref) => {
    const renderIcon = () => {
      if (!icon) return null;
      if (React.isValidElement(icon)) {
        return icon;
      }
      if (
        typeof icon === "function" ||
        (typeof icon === "object" && icon !== null && "$$typeof" in icon)
      ) {
        const IconComponent = icon as React.ComponentType<{ className?: string }>;
        return <IconComponent className="h-4 w-4" />;
      }
      return null;
    };

    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            {renderIcon()}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-lg border bg-white dark:bg-[#1c2438] px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 shadow-2xs transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b529c] dark:focus-visible:ring-[#fba81c] disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-9",
            hasError
              ? "border-rose-500 focus-visible:ring-rose-500"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
