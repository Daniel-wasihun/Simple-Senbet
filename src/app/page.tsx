"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  FileSpreadsheet,
  ArrowRight,
  Building2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";

export default function LandingPage() {
  const { school } = useSenbet();
  const { t, tClass } = useLanguage();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-blue-900/60 bg-blue-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-blue-950 font-black shadow-lg text-lg">
              ✝
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                {t("common.appName")}{" "}
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  MVP
                </span>
              </span>
              <p className="text-[11px] text-blue-300 font-serif">የሰንበት ትምህርት ቤት መረጃ አስተዳደር</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSwitcher variant="header" />
            <ThemeToggle />
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-blue-200 hover:text-white hover:bg-blue-900/50 text-xs sm:text-sm"
              >
                {t("auth.login")}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="gold"
                size="sm"
                className="font-semibold shadow-md text-xs sm:text-sm"
              >
                {t("nav.dashboard")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-amber-400/30 text-amber-300 text-xs font-medium mb-6 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Dedicated Sunday School Information & Curriculum Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-serif">
            Simplify Sunday School Management <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
              {t("classes.title")}, {t("students.title")} & {t("results.title")}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-blue-200 max-w-3xl mx-auto leading-relaxed">
            Tailored for Orthodox Sunday Schools (ሰንበት ትምህርት ቤቶች). Seamlessly organize class-based
            student registers, subjects (Bible, Mezmur, History), assessment breakdowns, daily
            attendance, automated mark calculation, and deterministic ranking.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="gold"
                className="font-bold px-8 shadow-xl text-base flex items-center gap-2"
              >
                <span>{t("nav.dashboard")}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-blue-700 bg-blue-950/60 text-blue-100 hover:bg-blue-900 text-base"
              >
                {t("auth.createSchool")}
              </Button>
            </Link>
          </div>

          {/* Active School Badge */}
          {school && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900/40 border border-blue-800 text-xs text-blue-200">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span>
                {school.name} ({school.parish_name})
              </span>
            </div>
          )}
        </div>
      </section>

      {/* The 6 Core MVP Workflows */}
      <section className="py-16 bg-slate-900/80 border-t border-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
              Core End-to-End {t("common.appName")} Workflow
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Designed around the operational needs of Sunday School teachers, administrators, and
              clergy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 p-6 hover:border-amber-500/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-900/60 text-amber-400 flex items-center justify-center mb-4">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t("classes.title")}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t("classes.subtitle")} — {tClass("Preschool")} to {tClass("Grade 12")}.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 p-6 hover:border-amber-500/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-900/60 text-amber-400 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t("students.title")}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t("students.subtitle")}</p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 p-6 hover:border-amber-500/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-900/60 text-amber-400 flex items-center justify-center mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t("courses.title")}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t("courses.subtitle")}</p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 p-6 hover:border-amber-500/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-900/60 text-amber-400 flex items-center justify-center mb-4">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t("assessments.title")}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t("assessments.validTotal")}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 p-6 hover:border-amber-500/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-900/60 text-amber-400 flex items-center justify-center mb-4">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t("attendance.title")}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t("attendance.subtitle")}</p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 p-6 hover:border-amber-500/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-900/60 text-amber-400 flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t("roster.title")}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{t("roster.subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Architecture Section */}
      <section className="py-12 border-t border-blue-950 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-amber-400 font-bold text-lg mb-1">Next.js 16</div>
              <div className="text-xs text-slate-400">Full-Stack App Router</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-amber-400 font-bold text-lg mb-1">Supabase</div>
              <div className="text-xs text-slate-400">PostgreSQL + RLS + Auth</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-amber-400 font-bold text-lg mb-1">Tailwind CSS</div>
              <div className="text-xs text-slate-400">Custom Senbet Palette</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-amber-400 font-bold text-lg mb-1">Docker Ready</div>
              <div className="text-xs text-slate-400">Containerized Deployment</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-blue-950 py-8 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} {t("common.appName")} MVP. All rights reserved.
        </p>
        <p className="mt-1 font-serif">የሰንበት ትምህርት ቤት መረጃና ትምህርት ክፍል ዲጂታል አደረጃጀት</p>
      </footer>
    </div>
  );
}
