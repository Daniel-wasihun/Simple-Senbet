"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";

const pageContainer = "w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7 animate-pulse";
const cardBox = "rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs";
const tableBox = "overflow-hidden rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] shadow-xs";

/**
 * Standard table rows shimmer skeleton matching the reference design.
 */
export function TableShimmerSkeleton({
  rows = 6,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full divide-y divide-slate-100 dark:divide-slate-800/80">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-3.5 px-4">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={`h-4 ${
                cIdx === 0
                  ? "w-28"
                  : cIdx === 1
                  ? "w-40 flex-1"
                  : cIdx === columns - 1
                  ? "w-24 ml-auto"
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
 * Common Header Shimmer matching MemberRegistry reference:
 * Eyebrow + Title + Subtitle + Action buttons
 */
function PageHeaderShimmer({
  eyebrowWidth = "w-28",
  titleWidth = "w-64",
  subtitleWidth = "w-80",
  hasSecondaryBtn = true,
  primaryBtnWidth = "w-32",
}: {
  eyebrowWidth?: string;
  titleWidth?: string;
  subtitleWidth?: string;
  hasSecondaryBtn?: boolean;
  primaryBtnWidth?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <Skeleton className={`h-3 ${eyebrowWidth} mb-1`} />
        <Skeleton className={`h-6 ${titleWidth} mt-1`} />
        <Skeleton className={`h-3.5 ${subtitleWidth} mt-1.5`} />
      </div>
      <div className="flex items-center gap-2">
        {hasSecondaryBtn && <Skeleton className="h-9 w-24 rounded-[4px]" />}
        <Skeleton className={`h-9 ${primaryBtnWidth} rounded-[4px]`} />
      </div>
    </div>
  );
}

/**
 * Dedicated Shimmer Skeleton for Member Registration & Directory (/members).
 */
export function MemberRegistryShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      {/* Header */}
      <PageHeaderShimmer
        eyebrowWidth="w-32"
        titleWidth="w-72"
        subtitleWidth="w-96"
        hasSecondaryBtn={true}
        primaryBtnWidth="w-36"
      />

      {/* Toolbar: Search input + Class filter + Status filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <Skeleton className="h-9 w-full sm:w-96 rounded-[4px]" />
          <Skeleton className="h-9 w-44 rounded-[4px]" />
          <Skeleton className="h-9 w-36 rounded-[4px]" />
        </div>
      </div>

      {/* Directory Table */}
      <div className={tableBox}>
        <div className="overflow-x-auto">
          <div className="w-full min-w-[700px]">
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-3.5 px-4">
              <div className="w-10"><Skeleton className="h-4 w-4 rounded-[2px]" /></div>
              <div className="flex-1 px-4"><Skeleton className="h-3.5 w-24" /></div>
              <div className="w-40 px-4"><Skeleton className="h-3.5 w-28" /></div>
              <div className="w-28 px-4"><Skeleton className="h-3.5 w-16" /></div>
              <div className="w-36 px-4"><Skeleton className="h-3.5 w-24" /></div>
              <div className="w-32 px-4 flex justify-end"><Skeleton className="h-3.5 w-16" /></div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center py-3.5 px-4">
                  <div className="w-10"><Skeleton className="h-4 w-4 rounded-[2px]" /></div>
                  <div className="flex-1 px-4 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="w-40 px-4"><Skeleton className="h-4 w-28" /></div>
                  <div className="w-28 px-4"><Skeleton className="h-4 w-16" /></div>
                  <div className="w-36 px-4"><Skeleton className="h-4 w-24" /></div>
                  <div className="w-32 px-4 flex items-center justify-end gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-[4px]" />
                    <Skeleton className="h-8 w-8 rounded-[4px]" />
                    <Skeleton className="h-8 w-8 rounded-[4px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-[4px]" />
          <Skeleton className="h-9 w-20 rounded-[4px]" />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for Main Dashboard Overview (/dashboard).
 */
export function DashboardOverviewShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      <PageHeaderShimmer
        eyebrowWidth="w-28"
        titleWidth="w-64"
        subtitleWidth="w-96"
        hasSecondaryBtn={true}
        primaryBtnWidth="w-32"
      />

      {/* Quick Metrics: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cardBox}>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="w-9 h-9 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Summary Card */}
      <div className={cardBox}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-20 rounded-[4px]" />
            <Skeleton className="h-6 w-20 rounded-[4px]" />
            <Skeleton className="h-6 w-16 rounded-[4px]" />
            <Skeleton className="h-6 w-20 rounded-[4px]" />
          </div>
        </div>
        <div className="mt-3.5 space-y-2">
          <Skeleton className="h-3 w-36" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Sessions Table */}
      <div className={tableBox}>
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-36 rounded-[4px]" />
          <Skeleton className="h-9 w-40 rounded-[4px]" />
          <Skeleton className="h-9 w-32 rounded-[4px]" />
          <Skeleton className="h-9 w-20 rounded-[4px]" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={5} columns={6} />
        </div>
      </div>
    </main>
  );
}
export const DashboardContentShimmerSkeleton = DashboardOverviewShimmerSkeleton;

/**
 * Dedicated Shimmer Skeleton for Attendance Dashboard (/attendance).
 */
export function AttendanceDashboardShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      <PageHeaderShimmer
        eyebrowWidth="w-36"
        titleWidth="w-80"
        subtitleWidth="w-96"
        hasSecondaryBtn={true}
        primaryBtnWidth="w-32"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cardBox}>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="w-9 h-9 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>

      <div className={cardBox}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-[4px]" />
            <Skeleton className="h-6 w-20 rounded-[4px]" />
            <Skeleton className="h-6 w-20 rounded-[4px]" />
          </div>
        </div>
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <Skeleton className="h-3.5 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className={tableBox}>
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-36 rounded-[4px]" />
          <Skeleton className="h-9 w-40 rounded-[4px]" />
          <Skeleton className="h-9 w-32 rounded-[4px]" />
          <Skeleton className="h-9 w-20 rounded-[4px]" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={6} columns={7} />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for Academic Performance & Gradebook (/academics).
 */
export function AcademicDashboardShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      <PageHeaderShimmer
        eyebrowWidth="w-32"
        titleWidth="w-72"
        subtitleWidth="w-96"
        hasSecondaryBtn={true}
        primaryBtnWidth="w-28"
      />

      <div className={tableBox}>
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-44 rounded-[4px]" />
            <Skeleton className="h-9 w-32 rounded-[4px]" />
            <Skeleton className="h-9 w-32 rounded-[4px]" />
            <Skeleton className="h-9 w-28 rounded-[4px]" />
            <Skeleton className="h-9 w-32 rounded-[4px]" />
          </div>
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={8} columns={9} />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for School Management Workspaces
 * (/academics/academic-years, /academics/school-classes, /academics/courses,
 *  /academics/teaching-assignments, /academics/assessments, /academics/assessment-results).
 */
export function SchoolManagementWorkspaceShimmerSkeleton({
  moduleName = "Management",
}: {
  moduleName?: string;
}) {
  return (
    <main className={pageContainer}>
      <PageHeaderShimmer
        eyebrowWidth="w-28"
        titleWidth="w-64"
        subtitleWidth="w-80"
        hasSecondaryBtn={true}
        primaryBtnWidth="w-36"
      />

      {/* Toolbar: Search input + Select All indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <Skeleton className="h-9 w-full sm:w-96 rounded-[4px]" />
          <Skeleton className="h-9 w-40 rounded-[4px]" />
        </div>
      </div>

      {/* Crisp Table */}
      <div className={tableBox}>
        <div className="overflow-x-auto">
          <div className="w-full min-w-[700px]">
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-3.5 px-4">
              <div className="w-10"><Skeleton className="h-4 w-4 rounded-[2px]" /></div>
              <div className="flex-1 px-4"><Skeleton className="h-3.5 w-28" /></div>
              <div className="w-44 px-4"><Skeleton className="h-3.5 w-24" /></div>
              <div className="w-36 px-4"><Skeleton className="h-3.5 w-20" /></div>
              <div className="w-32 px-4 flex justify-end"><Skeleton className="h-3.5 w-16" /></div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center py-3.5 px-4">
                  <div className="w-10"><Skeleton className="h-4 w-4 rounded-[2px]" /></div>
                  <div className="flex-1 px-4 space-y-1.5">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="w-44 px-4"><Skeleton className="h-4 w-28" /></div>
                  <div className="w-36 px-4"><Skeleton className="h-4 w-20" /></div>
                  <div className="w-32 px-4 flex items-center justify-end gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-[4px]" />
                    <Skeleton className="h-8 w-8 rounded-[4px]" />
                    <Skeleton className="h-8 w-8 rounded-[4px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-[4px]" />
          <Skeleton className="h-9 w-20 rounded-[4px]" />
        </div>
      </div>
    </main>
  );
}
export const ManagementPageShimmerSkeleton = SchoolManagementWorkspaceShimmerSkeleton;

/**
 * Dedicated Shimmer Skeleton for Finance & Member Payments (/finance).
 */
export function FinancePaymentsShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-36 mb-1" />
          <Skeleton className="h-6 w-64 mt-1" />
          <Skeleton className="h-3.5 w-80 mt-1.5" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-[4px]" />
          <Skeleton className="h-9 w-36 rounded-[4px]" />
          <Skeleton className="h-9 w-28 rounded-[4px]" />
          <Skeleton className="h-9 w-20 rounded-[4px]" />
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cardBox}>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
              <Skeleton className="w-9 h-9 rounded-[4px]" />
            </div>
            <Skeleton className="h-3 w-36 mt-2" />
          </div>
        ))}
      </div>

      {/* Status Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-2.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center space-y-1">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Table Box */}
      <div className={tableBox}>
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-full sm:w-80 rounded-[4px]" />
          <Skeleton className="h-9 w-44 rounded-[4px]" />
          <Skeleton className="h-9 w-40 rounded-[4px]" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={7} columns={7} />
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-[4px]" />
          <Skeleton className="h-9 w-20 rounded-[4px]" />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for Access Management (/administration/access & /administration/users).
 */
export function AccessManagementShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      <PageHeaderShimmer
        eyebrowWidth="w-36"
        titleWidth="w-72"
        subtitleWidth="w-96"
        hasSecondaryBtn={false}
        primaryBtnWidth="w-32"
      />

      {/* Workspace Tabs */}
      <div className="flex gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-3">
        <Skeleton className="h-9 w-36 rounded-[4px]" />
        <Skeleton className="h-9 w-40 rounded-[4px]" />
        <Skeleton className="h-9 w-44 rounded-[4px]" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-9 w-full sm:w-96 rounded-[4px]" />
        <Skeleton className="h-9 w-44 rounded-[4px]" />
      </div>

      {/* Table */}
      <div className={tableBox}>
        <div className="p-4">
          <TableShimmerSkeleton rows={7} columns={5} />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for Student Promotion Workspace (/academics/promotions).
 */
export function PromotionsShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      <PageHeaderShimmer
        eyebrowWidth="w-32"
        titleWidth="w-64"
        subtitleWidth="w-96"
        hasSecondaryBtn={false}
        primaryBtnWidth="w-28"
      />

      {/* Criteria Parameter Card */}
      <div className={cardBox}>
        <div className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-80" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Skeleton className="h-9 w-full rounded-[4px]" />
            <Skeleton className="h-9 w-full rounded-[4px]" />
            <Skeleton className="h-9 w-full rounded-[4px]" />
            <Skeleton className="h-9 w-full rounded-[4px]" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-9 w-36 rounded-[4px]" />
          </div>
        </div>
      </div>

      {/* Simulation Result Preview Card */}
      <div className={tableBox}>
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-28 rounded-[4px]" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={6} columns={6} />
        </div>
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for Attendance Roll Call Session (/attendance/[id]).
 */
export function AttendanceTakingShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-28 rounded-[4px]" />
      </div>

      {/* Session Info Card */}
      <div className={cardBox}>
        <div className="space-y-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-6 w-80" />
          <Skeleton className="h-3.5 w-60" />
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 rounded-[6px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-[4px]" />
          <Skeleton className="h-6 w-20 rounded-[4px]" />
          <Skeleton className="h-6 w-16 rounded-[4px]" />
          <Skeleton className="h-6 w-20 rounded-[4px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-[4px]" />
          <Skeleton className="h-9 w-32 rounded-[4px]" />
        </div>
      </div>

      {/* Student Roster Cards */}
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-3.5 rounded-[4px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-18 rounded-[4px]" />
              <Skeleton className="h-8 w-18 rounded-[4px]" />
              <Skeleton className="h-8 w-18 rounded-[4px]" />
              <Skeleton className="h-8 w-18 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/**
 * Dedicated Shimmer Skeleton for Student Report Card (/report-cards/[id]).
 */
export function ReportCardShimmerSkeleton() {
  return (
    <main className={pageContainer}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-28 rounded-[4px]" />
      </div>

      {/* Student Profile Card */}
      <div className={cardBox}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <div className="p-3 rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Subject Results Table */}
      <div className={tableBox}>
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="p-4">
          <TableShimmerSkeleton rows={5} columns={6} />
        </div>
      </div>
    </main>
  );
}

/**
 * Route-matched skeleton selector: returns the exact matching skeleton
 * for any route in the application.
 */
export function OptimisticPageSkeleton({ path }: { path: string }) {
  if (path === "/members") {
    return <MemberRegistryShimmerSkeleton />;
  }
  if (path === "/finance") {
    return <FinancePaymentsShimmerSkeleton />;
  }
  if (path === "/attendance") {
    return <AttendanceDashboardShimmerSkeleton />;
  }
  if (path.startsWith("/attendance/")) {
    return <AttendanceTakingShimmerSkeleton />;
  }
  if (path === "/academics") {
    return <AcademicDashboardShimmerSkeleton />;
  }
  if (path === "/academics/promotions") {
    return <PromotionsShimmerSkeleton />;
  }
  if (path.startsWith("/report-cards/")) {
    return <ReportCardShimmerSkeleton />;
  }
  if (path === "/administration/access" || path === "/administration/users") {
    return <AccessManagementShimmerSkeleton />;
  }
  if (path.startsWith("/academics/")) {
    return <SchoolManagementWorkspaceShimmerSkeleton />;
  }
  // Default overview dashboard
  return <DashboardOverviewShimmerSkeleton />;
}

/**
 * Full application shell shimmer skeleton shown when initial session is loading.
 */
export function DashboardAppShimmerSkeleton({ path }: { path?: string } = {}) {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-[#f1f5f9]">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex w-64 h-screen flex-col shrink-0 bg-white dark:bg-[#111624] border-r border-slate-200/80 dark:border-slate-800/80">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-[#0b529c]/10 dark:bg-[#fba81c]/10 flex items-center justify-center shrink-0">
            <EthiopianOrthodoxCross className="w-5 h-5 text-[#0b529c] dark:text-[#fba81c]" />
          </div>
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>

        <div className="flex-1 px-3 py-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[4px] bg-slate-50 dark:bg-slate-800/30"
            >
              <Skeleton className="w-5 h-5 rounded-[4px] shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[4px] bg-slate-50 dark:bg-slate-800/30">
            <Skeleton className="w-5 h-5 rounded-[4px] shrink-0" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      </aside>

      {/* Main Area Skeleton */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 shrink-0 bg-white dark:bg-[#111624] border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-36 rounded-[4px]" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-[4px]" />
            <Skeleton className="h-8 w-8 rounded-[4px]" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <OptimisticPageSkeleton path={path ?? "/dashboard"} />
        </main>
      </div>
    </div>
  );
}
