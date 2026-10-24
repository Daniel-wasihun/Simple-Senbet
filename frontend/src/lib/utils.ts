import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs:any) {
  return twMerge(clsx(inputs));
}

export function t(obj: any, locale: string): string {
  if (!obj) return "";
  // Return requested locale, or fallback to English, or first available
  return obj[locale] || obj["en"] || Object.values(obj)[0] || "";
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
