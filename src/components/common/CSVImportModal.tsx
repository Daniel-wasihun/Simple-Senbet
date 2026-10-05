"use client";

import React, { useState } from "react";
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/context/language-context";
import { ClassModel } from "@/types";
import {
  downloadStudentCSVTemplate,
  parseStudentImportCSV,
  ParsedImportStudent,
} from "@/lib/io";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassModel[];
  onImportSuccess: (imported: ParsedImportStudent[]) => void;
}

export function CSVImportModal({
  isOpen,
  onClose,
  classes,
  onImportSuccess,
}: CSVImportModalProps) {
  const { t } = useLanguage();
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsedList, setParsedList] = useState<ParsedImportStudent[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage("");
    setSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      validateAndPreview(text);
    };
    reader.onerror = () => {
      setErrorMessage(t("students.importError"));
    };
    reader.readAsText(file, "utf-8");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvText(val);
    setErrorMessage("");
    setSuccessCount(null);
    if (val.trim()) {
      validateAndPreview(val);
    } else {
      setParsedList([]);
    }
  };

  const validateAndPreview = (text: string) => {
    const result = parseStudentImportCSV(text, classes);
    if (!result.success) {
      setErrorMessage(result.error || t("students.importError"));
      setParsedList([]);
    } else {
      setErrorMessage("");
      setParsedList(result.students);
    }
  };

  const handleConfirmImport = () => {
    if (parsedList.length === 0) return;
    onImportSuccess(parsedList);
    setSuccessCount(parsedList.length);
    setTimeout(() => {
      setCsvText("");
      setFileName("");
      setParsedList([]);
      setSuccessCount(null);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("students.importTitle")}
      description={t("students.importDesc")}
      size="lg"
    >
      <div className="space-y-4">
        {/* Template download header */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60">
          <div>
            <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              {t("students.downloadTemplate")}
            </h4>
            <p className="text-[11px] text-blue-700 dark:text-blue-300">
              CSV template with column headers and sample Sunday school records.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadStudentCSVTemplate}
            className="flex items-center gap-1.5 h-8 text-xs bg-white dark:bg-slate-900"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t("action.export")}</span>
          </Button>
        </div>

        {/* File upload input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t("students.uploadFile")}
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-medium cursor-pointer border border-slate-300 dark:border-slate-700 transition-colors">
              <Upload className="h-4 w-4 text-slate-500" />
              <span>{fileName || t("students.uploadFile")}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {fileName && (
              <span className="text-xs text-slate-500 truncate max-w-[200px]">
                {fileName}
              </span>
            )}
          </div>
        </div>

        {/* Paste CSV textarea */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t("students.pasteCsv")}
          </label>
          <textarea
            value={csvText}
            onChange={handleTextChange}
            placeholder="Full Name,Christian Name,Gender,Class,Parent Phone&#10;ዮሐንስ ተስፋዬ,ወልደ ጊዮርጊስ,male,Grade 1,+251911223344"
            rows={4}
            className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success feedback */}
        {successCount !== null && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {t("students.importedSuccess").replace("{count}", String(successCount))}
            </span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedList.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-brand-blue" />
                {parsedList.length} students detected
              </span>
              <span className="text-[11px]">Showing first 3 records</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="px-2.5 py-1.5">Full Name</th>
                    <th className="px-2.5 py-1.5">Baptismal Name</th>
                    <th className="px-2.5 py-1.5">Gender</th>
                    <th className="px-2.5 py-1.5">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {parsedList.slice(0, 3).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-2.5 py-1.5 font-medium">{item.fullName}</td>
                      <td className="px-2.5 py-1.5 text-slate-500">
                        {item.baptismalName || "—"}
                      </td>
                      <td className="px-2.5 py-1.5 capitalize">{item.gender}</td>
                      <td className="px-2.5 py-1.5 text-slate-500 font-mono text-[11px]">
                        {item.parentPhone || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmImport}
            disabled={parsedList.length === 0}
          >
            {t("students.importCsv")} ({parsedList.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
