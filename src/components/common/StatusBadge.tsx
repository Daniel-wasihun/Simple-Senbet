"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { AttendanceStatus, UserRole, StudentStatus } from "@/types";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "present"
  | "absent"
  | "late"
  | "permission"
  | "pass"
  | "fail"
  | "progress";

interface StatusBadgeProps {
  status?: string;
  variant?: BadgeVariant;
  label?: string;
  attendance?: AttendanceStatus;
  role?: UserRole;
  studentStatus?: StudentStatus;
  resultStatus?: "Passed" | "Failed" | "In Progress" | "pass" | "fail";
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  variant,
  label,
  attendance,
  role,
  studentStatus,
  resultStatus,
  className,
  size = "md",
}: StatusBadgeProps) {
  const { tAttendance, tRole, tStudentStatus, tResult } = useLanguage();

  let resolvedVariant: BadgeVariant = variant || "neutral";
  let displayLabel = label;

  if (status) {
    const s = status.toLowerCase();
    if (s === "present" || s === "absent" || s === "late" || s === "permission") {
      resolvedVariant = s as AttendanceStatus;
      displayLabel = tAttendance(s as AttendanceStatus);
    } else if (s === "active" || s === "graduated" || s === "transferred" || s === "suspended") {
      resolvedVariant = s === "active" ? "success" : s === "graduated" ? "info" : "danger";
      displayLabel = tStudentStatus(s as StudentStatus);
    } else if (s === "pass" || s === "passed") {
      resolvedVariant = "success";
      displayLabel = tResult("Passed");
    } else if (s === "fail" || s === "failed") {
      resolvedVariant = "danger";
      displayLabel = tResult("Failed");
    } else {
      displayLabel = status;
    }
  } else if (attendance) {
    resolvedVariant = attendance;
    displayLabel = tAttendance(attendance);
  } else if (role) {
    resolvedVariant = role === "admin" ? "warning" : role === "teacher" ? "info" : "neutral";
    displayLabel = tRole(role);
  } else if (studentStatus) {
    resolvedVariant =
      studentStatus === "active" ? "success" : studentStatus === "graduated" ? "info" : "danger";
    displayLabel = tStudentStatus(studentStatus);
  } else if (resultStatus) {
    const norm = resultStatus.toLowerCase();
    resolvedVariant =
      norm === "passed" || norm === "pass"
        ? "success"
        : norm === "failed" || norm === "fail"
          ? "danger"
          : "warning";
    displayLabel =
      norm === "passed" || norm === "pass"
        ? tResult("Passed")
        : norm === "failed" || norm === "fail"
          ? tResult("Failed")
          : tResult("In Progress");
  }

  const variantStyles: Record<BadgeVariant, string> = {
    success:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    warning:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    danger:
      "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    info: "bg-blue-50 dark:bg-blue-950/50 text-[#0b529c] dark:text-blue-400 border-blue-200 dark:border-blue-800",
    neutral:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    present:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    absent:
      "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    late: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    permission:
      "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    pass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    fail: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    progress:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border transition-colors",
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 shrink-0" />
      <span>{displayLabel}</span>
    </span>
  );
}
