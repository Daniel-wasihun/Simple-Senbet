"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { Button } from "./Button";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchable = true,
  searchPlaceholder,
  searchFilter,
  filterSlot,
  actionSlot,
  emptyState,
  loading = false,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 1. Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery.trim().toLowerCase()));
  }, [data, searchQuery, searchFilter]);

  // 2. Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a: T, b: T) => {
      const recA = a as Record<string, unknown>;
      const recB = b as Record<string, unknown>;
      const valA = recA[sortKey];
      const valB = recB[sortKey];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortOrder]);

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortKey(null);
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const fromRecord = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRecord = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Toolbar (Search + Filters + Actions) */}
      {(searchable || filterSlot || actionSlot) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#141a29] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {searchable && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder || t("table.searchPlaceholder")}
                  className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm bg-slate-50 dark:bg-[#1c2438] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0b529c] dark:focus:ring-[#fba81c] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {filterSlot && <div className="shrink-0">{filterSlot}</div>}
          </div>

          {actionSlot && <div className="shrink-0 flex items-center gap-2">{actionSlot}</div>}
        </div>
      )}

      {/* Main Table Container */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141a29] shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50/80 dark:bg-[#111624] text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 select-none",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.sortable &&
                        "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors",
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        col.align === "center" && "justify-center",
                        col.align === "right" && "justify-end"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {sortKey === col.key ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#0b529c] dark:text-[#fba81c]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#0b529c] dark:text-[#fba81c]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-4 py-3.5">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-sm w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center">
                    {emptyState || (
                      <div className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                        {t("table.noData")}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={keyExtractor(item)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#1c2438]/40 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 align-middle",
                          col.align === "center" && "text-center",
                          col.align === "right" && "text-right",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(item, (currentPage - 1) * pageSize + idx)
                          : String((item as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        {sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-500 dark:text-slate-400">
            <div>
              {t("table.showing", {
                from: fromRecord,
                to: toRecord,
                total: sortedData.length,
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                  <span>{t("table.previous")}</span>
                </Button>

                <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                  {t("table.page", { current: currentPage, total: totalPages })}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs"
                >
                  <span>{t("table.next")}</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
