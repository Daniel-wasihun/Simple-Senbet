"use client";

import React, { useState } from "react";
import { Printer, Shield, Calendar, Phone, Award, User } from "lucide-react";
import { Student } from "@/types";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

interface StudentIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classNameTitle?: string;
}

export function StudentIDCardModal({
  isOpen,
  onClose,
  student,
  classNameTitle = "General",
}: StudentIDCardModalProps) {
  const { school, currentAcademicYear } = useSenbet();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"idcard" | "certificate">("idcard");

  if (!student) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const schoolName = school?.name || t("common.appName");
  const parishName = school?.parish_name || "የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን (EOTC)";
  const academicYearName = currentAcademicYear?.name || "2017 ዓ.ም";
  const todayFormatted = new Date().toLocaleDateString(
    language === "am" ? "am-ET" : language === "or" ? "om-ET" : "en-GB"
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === "idcard" ? t("cert.idCard") : t("cert.certificate")}
      size="xl"
    >
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("idcard")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "idcard"
                ? "border-brand-blue text-brand-blue dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>{t("cert.idCard")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("certificate")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "certificate"
                ? "border-brand-blue text-brand-blue dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>{t("cert.certificate")}</span>
          </button>
        </div>

        {/* Action Bar (Print button) */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 print:hidden">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === "idcard"
              ? "Official standard pocket ID card layout"
              : "Official ecclesiastical certificate of enrollment and standing"}
          </p>
          <Button
            onClick={handlePrint}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>{t("cert.print")}</span>
          </Button>
        </div>

        {/* Printable Container */}
        <div className="flex justify-center p-2 sm:p-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl overflow-x-auto print:p-0 print:bg-transparent">
          {activeTab === "idcard" ? (
            /* --- ID CARD PREVIEW --- */
            <div
              id="printable-area"
              className="w-full max-w-[420px] bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-300 relative print:shadow-none print:border-slate-400 print:w-[350px]"
              style={{ minHeight: "230px" }}
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-3.5 relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-amber-300">✝</span>
                    <div>
                      <h4 className="font-bold text-sm leading-tight tracking-wide text-white">
                        {schoolName}
                      </h4>
                      <p className="text-[10px] text-blue-200 line-clamp-1">{parishName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block bg-amber-400 text-blue-950 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                      {academicYearName}
                    </span>
                  </div>
                </div>
                <div className="text-[9px] font-semibold text-amber-300 uppercase tracking-widest mt-1">
                  {t("cert.titleId")}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex gap-3.5 items-start">
                {/* Photo box */}
                <div className="w-20 h-24 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 shrink-0 relative overflow-hidden shadow-inner">
                  <User className="h-10 w-10 text-slate-300" />
                  <span className="text-[9px] font-medium text-slate-500 mt-1 uppercase">
                    {student.gender === "female" ? t("students.female") : t("students.male")}
                  </span>
                  <div className="absolute bottom-0 w-full bg-blue-900 text-white text-[8px] text-center py-0.5 font-mono">
                    {student.student_id}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      {t("students.fullName")}
                    </span>
                    <p className="font-bold text-slate-900 text-sm leading-snug">
                      {student.full_name}
                    </p>
                  </div>

                  {student.baptismal_name && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-amber-700 block tracking-wider">
                        {t("students.baptismalName")}
                      </span>
                      <p className="font-serif font-semibold text-amber-900 text-xs">
                        ✝ {student.baptismal_name}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        {t("students.class")}
                      </span>
                      <span className="font-semibold text-blue-900 text-xs inline-block bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {classNameTitle}
                      </span>
                    </div>
                    {student.date_of_birth && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          {t("students.dateOfBirth")}
                        </span>
                        <span className="font-mono text-slate-700 text-xs">
                          {student.date_of_birth}
                        </span>
                      </div>
                    )}
                  </div>

                  {student.parent_phone && (
                    <div className="pt-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        {t("students.parentPhone")}
                      </span>
                      <span className="font-mono text-slate-700 text-xs flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5 text-slate-400" />
                        {student.parent_phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer / Signatures */}
              <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 flex items-center justify-between text-[9px] text-slate-500">
                <div>
                  <span>{t("cert.issuedDate")}: </span>
                  <span className="font-mono font-medium text-slate-700">{todayFormatted}</span>
                </div>
                <div className="text-right">
                  <div className="border-b border-dotted border-slate-400 w-24 mb-0.5"></div>
                  <span className="italic">{t("cert.signDirector")}</span>
                </div>
              </div>
            </div>
          ) : (
            /* --- OFFICIAL CERTIFICATE PREVIEW --- */
            <div
              id="printable-area"
              className="w-full max-w-[620px] bg-amber-50/40 text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border-4 border-double border-amber-900/40 relative print:shadow-none print:border-black print:w-full"
            >
              {/* Header invocation */}
              <div className="text-center space-y-1 mb-4">
                <span className="text-3xl text-amber-800">✝</span>
                <p className="text-[11px] font-serif text-slate-600 tracking-wider">
                  በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን
                </p>
                <h2 className="text-lg font-bold text-blue-950 uppercase tracking-wide">
                  {schoolName}
                </h2>
                <p className="text-xs text-slate-600 font-medium">{parishName}</p>
                <div className="inline-block mt-2 px-3 py-1 bg-amber-100 border border-amber-300 rounded text-amber-900 font-bold text-xs uppercase tracking-widest">
                  {t("cert.titleCert")}
                </div>
              </div>

              {/* Certificate Body */}
              <div className="my-6 text-sm leading-relaxed text-slate-800 space-y-3 font-serif">
                <p className="text-justify">
                  {language === "am" ? (
                    <>
                      ተማሪ <strong className="text-blue-950 font-bold">{student.full_name}</strong>
                      {student.baptismal_name ? (
                        <> (የክርስትና ስም፡ <strong className="text-amber-900 font-bold font-serif">{student.baptismal_name}</strong>)</>
                      ) : null}{" "}
                      በመለያ ቁጥር <strong className="font-mono">{student.student_id}</strong> በ
                      <strong className="text-blue-950 font-bold"> {schoolName} </strong> ሰንበት ትምህርት
                      ቤት በ<strong className="font-semibold">{academicYearName}</strong> የትምህርት ዘመን
                      በ<strong className="text-blue-900 font-bold">{classNameTitle}</strong> ክፍል
                      ተመዝግቦ/ባ የሰንበት ትምህርት ቤቱን መንፈሳዊ ትምህርት በትጋትና በመልካም ክርስቲያናዊ ሥነ-ምግባር
                      እየተከታተለ/ች የሚገኝ/የምትገኝ መሆኑን እንመሰክራለን።
                    </>
                  ) : language === "or" ? (
                    <>
                      Barataan/ttin <strong className="text-blue-950 font-bold">{student.full_name}</strong>
                      {student.baptismal_name ? (
                        <> (Maqaa Kiristinnaa: <strong className="text-amber-900 font-bold">{student.baptismal_name}</strong>)</>
                      ) : null}{" "}
                      lakk. eenyummaa <strong className="font-mono">{student.student_id}</strong> tiin
                      Mana Barumsaa Sanbata <strong className="text-blue-950 font-bold">{schoolName}</strong>{" "}
                      keessatti bara barnootaa <strong className="font-semibold">{academicYearName}</strong>{" "}
                      keessa kutaa <strong className="text-blue-900 font-bold">{classNameTitle}</strong>{" "}
                      irratti galmaa&apos;ee/tee barnoota hafuuraa amantummaadhaan hordofaa kan jiru/jirtu
                      ta&apos;uu isaa/ishee ni mirkaneessina.
                    </>
                  ) : (
                    <>
                      This is to certify that student{" "}
                      <strong className="text-blue-950 font-bold">{student.full_name}</strong>
                      {student.baptismal_name ? (
                        <> (Baptismal Name: <strong className="text-amber-900 font-bold">{student.baptismal_name}</strong>)</>
                      ) : null}
                      , bearing Student ID <strong className="font-mono">{student.student_id}</strong>, is
                      duly registered and actively attending spiritual Sunday school education in{" "}
                      <strong className="text-blue-900 font-bold">{classNameTitle}</strong> at{" "}
                      <strong className="text-blue-950 font-bold">{schoolName}</strong> during the{" "}
                      <strong className="font-semibold">{academicYearName}</strong> academic year with
                      devotion and Christian discipline.
                    </>
                  )}
                </p>
              </div>

              {/* Issue Date & Signatures */}
              <div className="mt-8 pt-4 border-t border-slate-300">
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    {t("cert.issuedDate")}: <strong className="font-mono">{todayFormatted}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <span className="font-semibold text-slate-700">{t("cert.signTeacher")}</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <span className="font-semibold text-slate-700">{t("cert.signDirector")}</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <span className="font-semibold text-slate-700">{t("cert.signParish")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
