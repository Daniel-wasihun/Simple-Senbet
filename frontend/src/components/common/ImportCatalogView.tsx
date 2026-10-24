"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { useTranslation } from "@/hooks/useTranslation";

interface CatalogProduct {
  product_code: string;
  name: { en: string; am?: string };
  short_description?: { en?: string; am?: string };
  category: string;
  origin?: string;
  img_url?: string;
  price?: number;
  unit?: string;
  currency?: string;
}

export function ImportCatalogView({ initialProducts }: { initialProducts: CatalogProduct[] }) {
  const { td, t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [origin, setOrigin] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const categories = useMemo(() => Array.from(new Set(initialProducts.map((product) => product.category))), [initialProducts]);
  const origins = useMemo(() => Array.from(new Set(initialProducts.map((product) => product.origin).filter((value): value is string => Boolean(value)))), [initialProducts]);
  const filtered = useMemo(() => initialProducts.filter((product) => {
    const name = `${product.name.en} ${product.name.am || ""}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (category === "all" || product.category === category) && (origin === "all" || product.origin === origin);
  }), [category, initialProducts, origin, search]);
  const pages = Math.ceil(filtered.length / pageSize);
  const visibleProducts = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [category, origin, search]);

  return <section className="mx-auto max-w-7xl px-4 py-8">
    <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_12rem_12rem]">
      <label className="relative"><span className="sr-only">Search products</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label>
      <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Filter by origin" value={origin} onChange={(event) => setOrigin(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="all">All origins</option>{origins.map((value) => <option key={value}>{value}</option>)}</select>
    </div>
    {visibleProducts.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{visibleProducts.map((product) => <article key={product.product_code} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="grid h-40 place-items-center bg-slate-100 text-4xl text-slate-300">{product.img_url ? <img src={product.img_url} alt="" className="h-full w-full object-cover" /> : "✥"}</div><div className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">{product.category}{product.origin ? ` · ${product.origin}` : ""}</p><h2 className="mt-2 font-semibold text-slate-900">{td(product.name)}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{product.short_description ? td(product.short_description) : ""}</p>{product.price !== undefined && <p className="mt-4 font-bold text-slate-900">{product.currency || ""} {product.price} <span className="text-xs font-normal text-slate-500">{product.unit}</span></p>}</div></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-sm font-semibold text-slate-500">{t("import.view.noResults")}</div>}
    <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
  </section>;
}
