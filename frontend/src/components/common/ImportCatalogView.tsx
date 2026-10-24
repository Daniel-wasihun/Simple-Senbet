"use client";

import { useState, useMemo, useEffect } from "react";
import { FilterCard } from "../common/FilterCard";
import { ProductCard } from "./productCard";
import { ProductListHeader } from "./ProductListHeader";
import { Pagination } from "./Pagination";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

export function ImportCatalogView({
  initialProducts,
}: {
  initialProducts: any[];
}) {
  const { language } = useLanguage();
  const { td, t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [destination, setDestination] = useState("all"); // Represents 'Origin' for imports
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. Dynamic Filters Extraction
  const categories = useMemo(
    () => Array.from(new Set(initialProducts.map((p) => p.category))),
    [initialProducts]
  );

  // For Import, we treat "Origin" as the primary filter for the "Destination" dropdown
  const origins = useMemo(
    () =>
      Array.from(new Set(initialProducts.map((p) => p.origin).filter(Boolean))),
    [initialProducts]
  );

  // 2. Filter Logic
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch =
        (p.name.en.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (p.name.am?.toLowerCase().includes(search.toLocaleLowerCase()) ?? false);
      const matchesCat = category === "all" || p.category === category;
      const matchesOrigin = destination === "all" || p.origin === destination;

      return matchesSearch && matchesCat && matchesOrigin;
    });
  }, [search, category, destination, initialProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, destination]);

  // 3. Pagination Slicing
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <>
      <FilterCard
        categories={categories}
        destinations={origins} // Pass origins into the destination slot
        activeCategory={category}
        onSearch={setSearch}
        onCategoryChange={setCategory}
        onDestinationChange={setDestination}
        onClear={() => {
          setSearch("");
          setCategory("all");
          setDestination("all");
        }}
      />

      <div className="container mx-auto max-w-[1440px] px-3 lg:px-5">
        <ProductListHeader
          count={filteredProducts.length}
          viewMode={viewMode}
          onViewChange={setViewMode}
          type="import"
        />

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 "
              : "flex flex-col gap-6"
          }
        >
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.product_code}
              variant="import"
              image={product.img_url || "/images/default.webp"}
              category={product.category}
              title={td(product.name)}
              origin={product.origin}
              description={td(product.short_description)}
              price={product.price}
              unit={product.unit}
              currency={product.currency}
              type="import"
              productCode={product.product_code}
              viewMode={viewMode}
            />
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-32 text-center text-slate-400 dark:text-gray-500 font-bold bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed dark:border-gray-700">
              {t("import.view.noResults")}
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
