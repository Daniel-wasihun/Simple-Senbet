/**
 * Shared Admin UI Tokens & Styling
 * Standardized across all administration and dashboard workspaces
 * matching the reference design of MemberRegistry (http://localhost:5174/members)
 */

export const BRAND = "#0858a8";
export const BRAND_HOVER = "#074c91";
export const BRAND_ACTIVE = "#063e77";

export const btnBase =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[4px] px-3.5 text-xs font-semibold shadow-2xs transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 cursor-pointer";

export const btnPrimary = `${btnBase} bg-[#0858a8] text-white hover:bg-[#074c91] active:bg-[#063e77] focus-visible:ring-[#0858a8]`;

export const btnSecondary = `${btnBase} border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:ring-slate-400`;

export const btnDanger = `${btnBase} bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-600`;

export const btnWarning = `${btnBase} bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus-visible:ring-amber-600`;

export const btnSuccess = `${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-600`;

export const inputCls = (error?: boolean) =>
  `h-9 w-full rounded-[4px] border ${
    error
      ? "border-rose-400 dark:border-rose-600 focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
      : "border-slate-200/90 dark:border-slate-700 focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8]"
  } bg-white dark:bg-[#141a29] px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none shadow-2xs transition`;

export const textareaCls = (error?: boolean) =>
  `w-full rounded-[4px] border ${
    error
      ? "border-rose-400 dark:border-rose-600 focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
      : "border-slate-200/90 dark:border-slate-700 focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8]"
  } bg-white dark:bg-[#141a29] p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none shadow-2xs transition min-h-20`;

export const labelCls = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";

export const tableContainerCls =
  "overflow-hidden rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] shadow-xs";

export const tableHeaderRowCls =
  "border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50";

export const tableHeaderCellCls =
  "py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200";

export const tableRowCls = (isSelected?: boolean) =>
  `transition-colors ${
    isSelected
      ? "bg-blue-50/60 dark:bg-blue-950/20"
      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
  }`;

export const actionBtnBase =
  "inline-flex h-8 w-8 items-center justify-center rounded-[4px] transition shadow-2xs cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed";

export const actionBtnView = `${actionBtnBase} bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60`;

export const actionBtnEdit = `${actionBtnBase} bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60`;

export const actionBtnDelete = `${actionBtnBase} bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60`;

export const actionBtnSuccess = `${actionBtnBase} bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60`;

export const modalStickyFooter =
  "sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-5 mt-6 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-5 py-3 sm:px-6 backdrop-blur-xs";

export const cardCls =
  "rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-5 shadow-xs";

export const detailCardCls =
  "rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-3";

/**
 * Parses and returns a clean localized string from string, object or JSON
 */
export function nestedLocalizedText(
  value: unknown,
  lang: "en" | "am" | "om" = "en"
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const t = value.trim();
    if (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    ) {
      try {
        return nestedLocalizedText(JSON.parse(t), lang);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.en !== undefined || obj.am !== undefined || obj.om !== undefined) {
      const cur = obj[lang];
      if (typeof cur === "string" && cur.trim()) return cur.trim();
      return String(obj.en || obj.am || obj.om || "—");
    }
    if (obj.name) return nestedLocalizedText(obj.name, lang);
    if (obj.title) return nestedLocalizedText(obj.title, lang);
    return String(obj.full_name ?? obj.code ?? obj.id ?? "—");
  }
  return String(value);
}
