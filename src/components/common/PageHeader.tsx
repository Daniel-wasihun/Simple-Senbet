"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  action,
  actions,
  className,
}: PageHeaderProps) {
  const actionContent = action || actions;
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0b529c] dark:text-blue-400 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-0.5">{subtitle}</p>
        )}
      </div>

      {actionContent && <div className="flex flex-wrap items-center gap-2.5">{actionContent}</div>}
    </div>
  );
}
