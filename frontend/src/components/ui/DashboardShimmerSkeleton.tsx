"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";

/**
 * Shimmer skeleton representing table rows.
 */
export function TableShimmerSkeleton({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full space-y-3 py-2">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="flex items-center gap-4 py-3 px-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={`h-4 ${
                cIdx === 0
                  ? "w-24"
                  : cIdx === 1
                  ? "w-36 flex-1"
                  : cIdx === columns - 1
                  ? "w-20"
                  : "w-28"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for the inner dashboard overview area.
 */
export function DashboardContentShimmerSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome Shimmer */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* Filter / Tabs Row Shimmer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Main Table Card Shimmer */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
        <TableShimmerSkeleton rows={6} columns={6} />
      </div>
    </div>
  );
}

/**
 * Dedicated Shimmer Skeleton for Member Registration & Directory (/members/dashboard).
 */
export function MemberRegistryShimmerSkeleton() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header with Title and Action buttons */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </header>

      {/* Search Input Shimmer */}
      <div className="flex max-w-lg gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Member Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111624] shadow-sm">
        <div className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16 ml-auto" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={7} columns={5} />
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for School Management Workspaces
 * (/academics/academic-years, /academics/school-classes, /academics/courses,
 *  /academics/teaching-assignments, /academics/enrollments, /academics/assessments,
 *  /academics/assessment-results, /administration/users).
 */
export function ManagementPageShimmerSkeleton() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </header>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111624] shadow-sm">
        <div className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16 ml-auto" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={6} columns={6} />
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for Attendance Dashboard (/attendance/dashboard).
 */
export function AttendanceDashboardShimmerSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        ))}
      </div>

      {/* Filter and Session List Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
        <TableShimmerSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

/**
 * Dedicated Shimmer Skeleton for Finance & Member Payments (/finance/dashboard).
 */
export function FinancePaymentsShimmerSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Finance Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Finance Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Filter and Ledger Table */}
      <div className="rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="ml-auto h-9 w-24 rounded-xl" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={6} columns={7} />
        </div>
      </div>
    </div>
  );
}

/**
 * Dedicated Shimmer Skeleton for Access Management (/administration/access).
 */
export function AccessManagementShimmerSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-200 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Section Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-sm">
          <TableShimmerSkeleton rows={6} columns={4} />
        </div>
      </div>
    </section>
  );
}

/**
 * Dedicated Shimmer Skeleton for Student Promotion Workspace (/academics/promotions).
 */
export function PromotionsShimmerSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Selection Form Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <Skeleton className="h-5 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Simulation Result Preview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <TableShimmerSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

/**
 * Route-matched skeleton selector: returns the exact matching skeleton
 * for any sidebar destination.
 */
export function OptimisticPageSkeleton({ path }: { path: string }) {
  if (path === "/members/dashboard") {
    return <MemberRegistryShimmerSkeleton />;
  }
  if (path === "/attendance/dashboard") {
    return <AttendanceDashboardShimmerSkeleton />;
  }
  if (path === "/finance/dashboard") {
    return <FinancePaymentsShimmerSkeleton />;
  }
  if (path === "/administration/access" || path === "/administration/users") {
    return <AccessManagementShimmerSkeleton />;
  }
  if (path === "/academics/promotions") {
    return <PromotionsShimmerSkeleton />;
  }
  if (path.startsWith("/academics/")) {
    return <ManagementPageShimmerSkeleton />;
  }
  // Default overview dashboard
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardContentShimmerSkeleton />
    </div>
  );
}

/**
 * Full application shell shimmer skeleton shown when initial session is loading.
 * Displays sidebar, navbar, and content shimmer without ANY spinner.
 */
export function DashboardAppShimmerSkeleton() {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-[#f1f5f9]">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex w-64 h-screen flex-col shrink-0 bg-white dark:bg-[#111624] border-r border-slate-200/80 dark:border-slate-800/80">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-[#0b529c]/10 dark:bg-[#fba81c]/10 flex items-center justify-center shrink-0">
            <EthiopianOrthodoxCross className="w-5 h-5 text-[#0b529c] dark:text-[#fba81c]" />
          </div>
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>

        {/* Nav Items Shimmer */}
        <div className="flex-1 px-3 py-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30"
            >
              <Skeleton className="w-5 h-5 rounded-md shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30">
            <Skeleton className="w-5 h-5 rounded-md shrink-0" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      </aside>

      {/* Main Area Skeleton */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar Skeleton */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#111624] border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* Body Shimmer */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <DashboardContentShimmerSkeleton />
        </main>
      </div>
    </div>
  );
}
