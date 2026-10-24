import React from "react";
import { AlertCircle } from "lucide-react"; 
import { useTranslation } from "@/hooks/useTranslation";

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}
export default function EmptyState({
  title =  "",
  description = "There is nothing to display at the moment.",
  className = "",
}: EmptyStateProps) { 
const {t,isLoading:isI18nLoading} = useTranslation();
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md text-center ${className}`}
    >
      <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {t("landing.notfoundtilte")}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("landing.notfoundescription")}</p>
    </div>
  );
}
