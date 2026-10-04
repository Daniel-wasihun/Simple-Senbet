"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: "primary" | "secondary" | "gold" | "emerald" | "indigo";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtext,
  icon,
  iconBgColor,
  trend,
  variant = "primary",
  className,
}: StatCardProps) {
  const variantBgColors = {
    primary: "bg-blue-50 dark:bg-blue-950/60 text-[#0b529c] dark:text-blue-400",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    gold: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
    indigo: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400",
  };

  const resolvedBgColor = iconBgColor || variantBgColors[variant];

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
      return <IconComponent className="h-5 w-5" />;
    }
    return null;
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141a29] p-5 shadow-2xs hover:shadow-xs transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
              resolvedBgColor
            )}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </div>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {trend && (
              <span
                className={cn(
                  "font-semibold",
                  trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
