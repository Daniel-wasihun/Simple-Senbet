"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  FileSpreadsheet,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { UserRole } from "@/types";
import { Button } from "@/components/common/Button";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, tRole } = useLanguage();
  const {
    user,
    currentRole,
    switchRole,
    school,
    schools,
    switchSchool,
    currentAcademicYear,
    logout,
    resetToSampleData,
  } = useSenbet();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on public pages like /, /login, /register, /create-school, don't show full app chrome
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/create-school";

  if (isPublicPage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/classes", label: t("nav.classes"), icon: GraduationCap },
    { href: "/students", label: t("nav.students"), icon: Users },
    { href: "/courses", label: t("nav.courses"), icon: BookOpen },
    { href: "/attendance", label: t("nav.attendance"), icon: CalendarCheck },
    { href: "/results", label: t("nav.results"), icon: Award },
    { href: "/roster", label: t("nav.roster"), icon: FileSpreadsheet },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-brand-blue-dark dark:bg-slate-900 text-white shadow-md border-b border-blue-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Mobile hamburger & Logo */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800/60 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <Link href="/dashboard" className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-lg bg-brand-gold flex items-center justify-center text-brand-blue-dark font-black shadow-inner text-base">
                  ✝
                </div>
                <div>
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                    {t("common.appName")}
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold">
                      MVP
                    </span>
                  </span>
                  <p className="text-[11px] text-blue-200 dark:text-slate-400 truncate max-w-[180px] sm:max-w-xs font-serif">
                    {school ? school.name : t("common.appName")}
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: School & Academic Year Selector */}
            <div className="hidden md:flex items-center space-x-2">
              {schools.length > 1 ? (
                <div className="flex items-center bg-blue-950/60 dark:bg-slate-800/80 rounded-lg px-2.5 py-1 border border-blue-700/50 dark:border-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-amber-400 mr-1.5" />
                  <select
                    value={school?.id || ""}
                    onChange={(e) => switchSchool(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none cursor-pointer pr-2"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center bg-blue-950/50 dark:bg-slate-800/60 rounded-lg px-3 py-1 border border-blue-800/60 dark:border-slate-700 text-xs text-blue-100 dark:text-slate-300">
                  <Building2 className="h-3.5 w-3.5 text-amber-400 mr-1.5" />
                  <span className="truncate max-w-[180px]">{school?.parish_name || "Parish"}</span>
                </div>
              )}

              {currentAcademicYear && (
                <span className="text-xs px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 font-medium">
                  {currentAcademicYear.name}
                </span>
              )}
            </div>

            {/* Right: Controls (Language, Theme, Role, Reset, Signout) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Language Switcher */}
              <LanguageSwitcher variant="header" />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Role Switcher */}
              <div className="flex items-center bg-blue-950/70 dark:bg-slate-800 rounded-lg px-2 py-1 border border-blue-800 dark:border-slate-700 text-xs">
                <span className="text-[10px] text-blue-300 dark:text-slate-400 uppercase tracking-wider pr-1 font-semibold hidden xl:inline">
                  {t("common.role")}:
                </span>
                <select
                  value={currentRole}
                  onChange={(e) => switchRole(e.target.value as UserRole)}
                  className="bg-transparent text-xs text-amber-300 font-medium outline-none cursor-pointer"
                  title="Switch Role to test role-based access"
                >
                  <option value="admin" className="bg-slate-900 text-white">
                    {tRole("admin")}
                  </option>
                  <option value="teacher" className="bg-slate-900 text-white">
                    {tRole("teacher")}
                  </option>
                  <option value="staff" className="bg-slate-900 text-white">
                    {tRole("staff")}
                  </option>
                  <option value="student" className="bg-slate-900 text-white">
                    {tRole("student")}
                  </option>
                </select>
              </div>

              {/* Reset Demo button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToSampleData}
                title={t("settings.resetConfirm")}
                className="text-blue-200 hover:text-white hover:bg-blue-800/70 dark:hover:bg-slate-800 h-8 px-2 text-xs hidden lg:flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{t("common.reset")}</span>
              </Button>

              {/* User info & Logout */}
              {user && (
                <span className="text-xs text-blue-100 dark:text-slate-300 hidden 2xl:inline font-medium">
                  {user.full_name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-blue-200 dark:text-slate-300 hover:text-white hover:bg-blue-800 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-700/50"
                title={t("auth.logout")}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">{t("auth.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs transition-colors">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("nav.dashboard")} & {t("classes.title")}
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 font-semibold border-l-4 border-brand-blue dark:border-blue-500 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`h-4 w-4 ${
                          active
                            ? "text-brand-blue dark:text-blue-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 px-3">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-400 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                  {t("common.appName")}
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/80 leading-tight">
                  {t("classes.title")} → {t("students.title")} → {t("courses.title")} →{" "}
                  {t("attendance.title")} → {t("results.title")} → {t("roster.title")}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white dark:bg-slate-900 h-full p-4 shadow-xl flex flex-col z-50 transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">
                  {t("common.appName")}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 mt-4 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        active
                          ? "bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 font-semibold border-l-4 border-brand-blue dark:border-blue-500"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
