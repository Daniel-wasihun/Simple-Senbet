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

/**
 * Safely format text or localized JSON object { en, am } into a renderable React string.
 */
export function formatText(text: any, fallback: string = "—"): string {
  if (text === null || text === undefined || text === "") return fallback;
  if (typeof text === "string") return text;
  if (typeof text === "number") return String(text);
  if (typeof text === "object") {
    if (text.am && text.en) return text.am || text.en;
    if (text.am) return text.am;
    if (text.en) return text.en;
    const values = Object.values(text).filter((v) => typeof v === "string" || typeof v === "number");
    if (values.length > 0) return String(values[0]);
    return fallback;
  }
  return String(text);
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
