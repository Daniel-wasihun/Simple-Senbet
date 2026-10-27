// src/components/common/ConfirmDialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  variant?: "destructive" | "primary";
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  variant = "destructive",
  icon,
}: ConfirmDialogProps) {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-input bg-card dark:bg-card">
        <AlertDialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-full ${
                variant === "destructive"
                  ? "bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400"
                  : "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
              }`}
            >
              {icon || (variant === "destructive" ? <Trash2 size={20} /> : <AlertTriangle size={20} />)}
            </div>
            <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white">
              {title || (isAm ? "እርግጠኛ ነዎት?" : "Are you sure?")}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground font-medium">
            {description ||
              (isAm
                ? "ይህ ተግባር አንዴ ከተከናወነ በኋላ ሊመለስ አይችልም።"
                : "This action cannot be undone. This will permanently delete the record.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-2">
          <AlertDialogCancel asChild className={undefined}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="font-medium border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild className={undefined}>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Prevents auto-closing so we can handle loading
                onConfirm();
              }}
              disabled={isLoading}
              className="font-semibold px-5 min-w-[100px] bg-[#0858a8] hover:bg-[#074c91] active:bg-[#063e77] text-white cursor-pointer shadow-2xs border-0 focus-visible:ring-2 focus-visible:ring-[#0858a8]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAm ? (
                variant === "destructive" ? "ይሰርዙ" : "ያረጋግጡ"
              ) : (
                "Confirm"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
