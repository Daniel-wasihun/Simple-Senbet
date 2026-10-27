// src/components/admin/common/DataTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Table as TableIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/common/Pagination";
import { useLanguage } from "@/context/LanguageContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  exportValue?: (item: T) => string;
  className?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  itemsPerPage?: number;
  fileName?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  searchPlaceholder = "Search...",
  itemsPerPage = 10,
  fileName = "export-data",
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  // Filtering logic
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item: any) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // EXPORT LOGIC: Prepare data
  const getExportData = () => {
    return filteredData.map((item) => {
      const row: any = {};
      columns.forEach((col) => {
        // Exclude "Actions" from export
        if (col.header.toLowerCase() === "actions" || col.header === "ድርጊቶች")
          return;

        if (col.exportValue) {
          row[col.header] = col.exportValue(item);
        } else if (typeof col.accessor === "string") {
          row[col.header] = item[col.accessor];
        } else {
          row[col.header] = "-"; // Fallback for complex nodes without exportValue
        }
      });
      return row;
    });
  };

  const exportToExcel = async () => {
    setExporting("excel");
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
      const ws = XLSX.utils.json_to_sheet(getExportData());
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(
        wb,
        `${fileName}-${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = async () => {
    setExporting("pdf");
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
      const doc = new jsPDF();
      const exportData = getExportData();
      const headers = Object.keys(exportData[0] || {});
      const body = exportData.map((row) => Object.values(row));

      autoTable(doc, {
        head: [headers],
        body: body as any,
        theme: "striped",
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { top: 20 },
      });
      doc.save(`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 p-1">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900/50 p-1.5 py-0.5 rounded-lg">
            <Button
              onClick={exportToExcel}
              disabled={exporting !== null || filteredData.length === 0}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 gap-2 px-3 rounded-md transition-all duration-200 bg-green-500/20",
                "text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400",
                "hover:bg-green-50 dark:hover:bg-green-900/20",
                "border border-transparent hover:border-green-200 dark:hover:border-green-800",
                exporting === "excel" &&
                  "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              )}
            >
              {exporting === "excel" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <TableIcon size={16} />
              )}
              <span className="hidden sm:inline">Excel</span>
            </Button>

            {/* <div className="h-6 w-px bg-slate-200 dark:bg-gray-700" /> */}

            <Button
              onClick={exportToPDF}
              disabled={exporting !== null || filteredData.length === 0}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 gap-2 px-3 rounded-md transition-all duration-200 bg-red-500/20",
                "text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400",
                "hover:bg-red-50 dark:hover:bg-red-900/20",
                "border border-transparent hover:border-red-200 dark:hover:border-red-800",
                exporting === "pdf" &&
                  "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              )}
            >
              {exporting === "pdf" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div
        className="rounded-xl border border-slate-200 dark:border-gray-800 
                     bg-white dark:bg-gray-900 overflow-hidden 
                     transition-all duration-200"
      >
        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="">
            <TableHeader
              className="bg-gradient-to-r from-slate-50 to-slate-100/50 
                                   dark:from-gray-900 dark:to-gray-800/50 
                                   border-b border-slate-200 dark:border-gray-800"
            >
              <TableRow className="hover:bg-transparent">
                {columns.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      "text-slate-600 dark:text-slate-400",
                      "px-6 py-1 first:rounded-tl-lg last:rounded-tr-lg",
                      "border-r border-red-200/50 dark:border-gray-800/50 last:border-r-0",
                      col.className
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="">
              {isLoading ? (
                // Loading State
                <TableRow className="">
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center px-6 py-12"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Loading data...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                // Data Rows
                paginatedData.map((item, rowIdx) => (
                  <TableRow
                    key={rowIdx}
                    className={cn(
                      "group transition-all duration-150",
                      "hover:bg-slate-50/70 dark:hover:bg-gray-800/50",
                      "border-b border-slate-100 dark:border-gray-800/50 last:border-b-0",
                      rowIdx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-slate-50/30 dark:bg-gray-900/30"
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <TableCell
                        key={colIdx}
                        className={cn(
                          "px-6 py-0.5",
                          "text-xs font-normal",
                          "text-slate-800 dark:text-slate-200",
                          "group-hover:text-slate-900 dark:group-hover:text-white cursor-pointer",
                          "transition-colors duration-150",
                          col.cellClassName
                        )}
                      >
                        {typeof col.accessor === "function"
                          ? col.accessor(item)
                          : (item[col.accessor] as React.ReactNode)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="">
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center px-6 py-12"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-gray-800">
                        <Search className="h-6 w-6 text-slate-400 dark:text-gray-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-normal text-slate-700 dark:text-slate-300">
                          {searchTerm ? "No results found" : emptyMessage}
                        </p>
                        {searchTerm && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Try adjusting your search term
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-1 p-2
                       border-t border-slate-200 dark:border-gray-800 
                       bg-slate-50/50 dark:bg-gray-900/50"
        >
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-300">
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredData.length
              )}
              -{Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-300">
              {filteredData.length}
            </span>{" "}
            {filteredData.length === 1 ? "item" : "items"}
          </div>

          {!isLoading && filteredData.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
