"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useLanguage } from "@/context/language-context";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const desc = description || message || "";
  const confirmBtnText = confirmText || confirmLabel || t("action.confirm");
  const cancelBtnText = cancelText || cancelLabel || t("action.cancel");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
            variant === "danger"
              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
              : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
          }`}
        >
          {variant === "danger" ? (
            <Trash2 className="h-6 w-6" />
          ) : (
            <AlertTriangle className="h-6 w-6" />
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{desc}</p>

        <div className="mt-6 flex items-center justify-center gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelBtnText}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmBtnText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
