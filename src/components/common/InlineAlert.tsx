"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineAlertProps {
  type?: "info" | "success" | "warning" | "error";
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  message: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  onClose?: () => void;
  className?: string;
}

export function InlineAlert({
  type,
  variant,
  title,
  message,
  dismissible,
  onDismiss,
  onClose,
  className,
}: InlineAlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const resolvedType = variant || type || "info";
  const closeHandler = onClose || onDismiss;
  const isDismissible = dismissible !== undefined ? dismissible : !!closeHandler;

  if (dismissed) return null;

  const typeConfig = {
    info: {
      icon: Info,
      wrapper:
        "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200",
      iconColor: "text-[#0b529c] dark:text-blue-400",
    },
    success: {
      icon: CheckCircle2,
      wrapper:
        "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
      icon: AlertTriangle,
      wrapper:
        "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    error: {
      icon: AlertCircle,
      wrapper:
        "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
  };

  const config = typeConfig[resolvedType] || typeConfig.info;
  const Icon = config.icon;

  const handleClose = () => {
    setDismissed(true);
    if (closeHandler) closeHandler();
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border p-3.5 flex items-start gap-3 text-xs transition-all",
        config.wrapper,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 space-y-0.5">
        {title && <div className="font-semibold text-xs leading-snug">{title}</div>}
        <div className="leading-relaxed opacity-90">{message}</div>
      </div>
      {isDismissible && (
        <button
          onClick={handleClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
