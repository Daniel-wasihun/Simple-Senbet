import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return Number.isInteger(num) ? num.toString() : num.toFixed(1);
}

export function getOrdinalRank(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
