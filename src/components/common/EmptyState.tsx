"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return <FolderOpen className="h-6 w-6" />;
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (
      typeof icon === "function" ||
      (typeof icon === "object" && icon !== null && "$$typeof" in icon)
    ) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="h-6 w-6" />;
    }
    return <FolderOpen className="h-6 w-6" />;
  };

  const actionContent =
    action ||
    (actionLabel && onAction ? (
      <Button onClick={onAction} variant="primary" size="sm">
        {actionLabel}
      </Button>
    ) : null);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 my-4",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-3 shadow-2xs">
        {renderIcon()}
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionContent && <div>{actionContent}</div>}
    </div>
  );
}
