"use client";
import { useLanguage } from "@/context/LanguageContext";
import { BodyLarge, Heading2, Heading3, Heading4, Heading5 } from "../ui/typography";

interface StatCardProps {
  value: string;
  label: { en: string; am: string } | string;
}

export function StatCard({ value, label }: StatCardProps) {
  const { language } = useLanguage();
  const isAm = language === "am";

  const getLabel = () => {
    if (typeof label === "string") return label;
    return isAm ? label.am : label.en;
  };

  return (
    <div className="bg-[#EFF6FF] dark:bg-gray-800 rounded-xl p-10 flex flex-col items-center text-center gap-2 border border-blue-50 dark:border-gray-700 transition-all hover:scale-105">
      <Heading2 className="text-2xl font-black !text-[#1295FF] dark:text-blue-300 tracking-tight">
        {value}
      </Heading2>
      <BodyLarge >
        {getLabel()}
      </BodyLarge>
    </div>
  );
}
