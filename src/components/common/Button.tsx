"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      isLoading = false,
      icon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isSpinning = loading || isLoading;
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-[#0b529c] hover:bg-[#083a6e] text-white shadow-xs focus-visible:ring-[#0b529c] dark:bg-[#0b529c] dark:hover:bg-[#083a6e]",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 focus-visible:ring-slate-400",
      outline:
        "border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60 focus-visible:ring-slate-400",
      ghost:
        "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 focus-visible:ring-slate-400",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500",
      gold: "bg-[#fba81c] hover:bg-[#f59e0b] text-slate-950 font-semibold shadow-xs focus-visible:ring-[#fba81c]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-xs sm:text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isSpinning}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isSpinning ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
