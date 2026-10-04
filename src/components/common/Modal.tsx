"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          "relative z-50 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141a29] text-slate-900 dark:text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden",
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between">
            <div className="space-y-1 pr-6">
              {title && (
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
