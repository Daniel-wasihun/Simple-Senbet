"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface SidebarItemProps {
  label: string;
  amharicLabel: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  label,
  amharicLabel,
  href,
  icon: Icon,
  isActive,
  onClick,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all select-none cursor-pointer ${
        isActive
          ? "bg-blue-50 dark:bg-blue-950/40 text-slate-900 dark:text-white font-medium"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {/* Subtle indicator bar from Senbet System (never jarring, just a clean indicator) */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-blue-600 dark:bg-blue-400 rounded-r-full"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-3 truncate">
        <Icon
          className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
            isActive
              ? "text-blue-700 dark:text-blue-300"
              : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }`}
        />
        <span className="truncate">{label}</span>
      </div>

      {amharicLabel && <span
        className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ml-1.5 transition-colors ${
          isActive
            ? "text-blue-700 dark:text-blue-300 font-semibold bg-blue-100/70 dark:bg-blue-950/60"
            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
        }`}
      >
        {amharicLabel}
      </span>}
    </Link>
  );
}
