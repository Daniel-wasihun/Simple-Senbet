// src/components/shared/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show current page and one sibling on each side
      const showLeftEllipsis = currentPage > 3;
      const showRightEllipsis = currentPage < totalPages - 2;

      if (!showLeftEllipsis) {
        // Near the start: 1 2 3 ... 20
        pages.push(2);
        pages.push(3);
        pages.push("...");
      } else if (!showRightEllipsis) {
        // Near the end: 1 ... 18 19 20
        pages.push("...");
        pages.push(totalPages - 2);
        pages.push(totalPages - 1);
      } else {
        // In the middle: 1 ... 5 ... 20
        pages.push("...");
        pages.push(currentPage);
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-16 h-8 px-8 font-normal text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700"
      >
        <ChevronLeft size={16} className="w-20 h-8" /> Prev
      </Button>

      {pageNumbers.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="w-10 h-8 flex items-center justify-center text-slate-600 dark:text-gray-300"
            >
              ...
            </span>
          );
        }

        return (
          <Button
            key={page}
            onClick={() => onPageChange(page as number)}
            variant={currentPage === page ? "primary-gradient" : "outline"}
            className={`w-10 h-8 font-normal ${currentPage === page
              ? "shadow-md shadow-blue-500/20"
              : "text-slate-600 dark:text-gray-300 border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700"
              }`}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-16 h-8 px-8 font-normal text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700"
      >
        Next <ChevronRight size={16} className="w-20 h-8 ml-0" />
      </Button>
    </div>
  );
}
