"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AdminModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | "2xl" | "3xl";
  showHeader?: boolean;
  headerAction?: ReactNode;
};

export function AdminModal({ open, onOpenChange, title, description, children, size = "lg", showHeader = true, headerAction }: AdminModalProps) {
  const width = {
    md: "sm:max-w-xl md:max-w-2xl",
    lg: "sm:max-w-2xl md:max-w-3xl lg:max-w-4xl",
    xl: "sm:max-w-4xl md:max-w-5xl lg:max-w-5xl",
    "2xl": "sm:max-w-5xl md:max-w-6xl",
    "3xl": "sm:max-w-6xl md:max-w-7xl",
  }[size];
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} className={`grid max-h-[min(90dvh,54rem)] ${showHeader ? "grid-rows-[auto_minmax(0,1fr)]" : "grid-rows-[minmax(0,1fr)]"} gap-0 overflow-hidden rounded-[6px] border border-slate-200/80 bg-white p-0 shadow-2xl ${width} dark:border-slate-800 dark:bg-slate-900`}>
      {showHeader ? <DialogHeader className="relative border-b border-slate-200/80 bg-slate-50/70 py-4 pl-5 pr-4 text-left dark:border-slate-800 dark:bg-slate-800/40 sm:pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">{title}</DialogTitle>
            {description && <DialogDescription className="mt-1 leading-5 text-slate-500 dark:text-slate-400">{description}</DialogDescription>}
          </div>
          <div className="flex shrink-0 items-center gap-2">{headerAction}
            <button type="button" onClick={() => onOpenChange(false)} aria-label="Close dialog" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0858a8] dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="h-4 w-4" /></button>
          </div>
        </div>
      </DialogHeader> : <DialogTitle className="sr-only">{title}</DialogTitle>}
      <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 bg-white dark:bg-slate-900">{children}</div>
    </DialogContent>
  </Dialog>;
}
