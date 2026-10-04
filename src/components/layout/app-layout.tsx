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
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { UserRole } from "@/types";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";

function getInitials(name: string): string {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, tRole } = useLanguage();
  const {
    user,
    currentRole,
    switchRole,
    isOwner,
    school,
    currentAcademicYear,
    logout,
    students,
    classes,
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
    {
      href: "/dashboard",
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: "/classes",
      label: t("nav.classes"),
      icon: GraduationCap,
      badge: classes.length > 0 ? classes.length : null,
    },
    {
      href: "/students",
      label: t("nav.students"),
      icon: Users,
      badge: students.length > 0 ? students.length : null,
    },
    {
      href: "/courses",
      label: t("nav.courses"),
      icon: BookOpen,
      badge: null,
    },
    {
      href: "/attendance",
      label: t("nav.attendance"),
      icon: CalendarCheck,
      badge: null,
    },
    {
      href: "/results",
      label: t("nav.results"),
      icon: Award,
      badge: null,
    },
    {
      href: "/roster",
      label: t("nav.roster"),
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      href: "/settings",
      label: t("nav.settings"),
      icon: Settings,
      badge: null,
    },
  ];

  // Role-based navigation filtering
  const roleNavPermissions: Record<UserRole, string[]> = {
    admin: [
      "/dashboard",
      "/classes",
      "/students",
      "/courses",
      "/attendance",
      "/results",
      "/roster",
      "/settings",
    ],
    teacher: [
      "/dashboard",
      "/classes",
      "/courses",
      "/attendance",
      "/results",
      "/roster",
    ],
    staff: [
      "/dashboard",
      "/classes",
      "/students",
      "/attendance",
      "/roster",
    ],
    student: [
      "/dashboard",
      "/classes",
      "/attendance",
      "/results",
      "/roster",
    ],
  };

  const visibleNavItems = navItems.filter((item) =>
    roleNavPermissions[currentRole]?.includes(item.href)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 flex-col transition-all">
        {/* Logo & Dynamic School Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-800 gap-3 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0 flex-1 group">
            <div className="h-10 w-10 rounded-xl bg-brand-gold flex items-center justify-center text-brand-blue-dark font-black shadow-sm text-lg shrink-0 group-hover:scale-105 transition-transform">
              ✝
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate font-serif leading-tight">
                {school ? school.name : t("common.appName")}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {school?.parish_name || t("app.subtitle")}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("nav.coreWorkflows")}
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 font-semibold border-l-4 border-brand-blue dark:border-blue-500 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
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
                {item.badge !== null && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 px-2">
            <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/20 p-2.5 border border-amber-200/70 dark:border-amber-900/30">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-400 mb-0.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                <span>{school?.name ? school.name.split(" ")[0] : t("common.appName")}</span>
              </div>
              <p className="text-[10px] text-amber-800 dark:text-amber-300/80 leading-tight">
                {currentAcademicYear?.name || "2017 ዓ.ም"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Profile / User Card in Sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-full bg-brand-blue/10 dark:bg-brand-blue/30 text-brand-blue dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-brand-blue/20">
              {getInitials(user?.full_name || "Admin")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.full_name || "Administrator"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {tRole(currentRole)}
                </span>
                {isOwner && (
                  <span className="text-[9px] font-semibold uppercase px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                    Owner
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <select
              value={currentRole}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 outline-none cursor-pointer flex-1"
              title="Switch Active Role"
            >
              <option value="admin">{tRole("admin")}</option>
              <option value="teacher">{tRole("teacher")}</option>
              <option value="student">{tRole("student")}</option>
              <option value="staff">{tRole("staff")}</option>
            </select>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title={t("auth.logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white dark:bg-slate-900 h-full p-4 shadow-xl flex flex-col z-50 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-brand-gold flex items-center justify-center text-brand-blue-dark font-black text-sm shrink-0">
                  ✝
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate font-serif">
                  {school ? school.name : t("common.appName")}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 mt-4 flex-1 overflow-y-auto">
              {visibleNavItems.map((item) => {
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
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {user?.full_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t("auth.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Area (Offset by sidebar width on desktop) */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        {/* App Bar (Sticky Header) */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 transition-colors">
          {/* Left: Mobile hamburger & Dynamic Created School Name as App Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="font-bold text-base sm:text-lg md:text-xl text-slate-900 dark:text-white tracking-tight font-serif truncate max-w-[220px] sm:max-w-xs md:max-w-md lg:max-w-lg">
                {school ? school.name : t("common.appName")}
              </h1>
              {school?.parish_name && (
                <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-medium truncate max-w-[180px]">
                  {school.parish_name}
                </span>
              )}
            </div>
          </div>

          {/* Right: Academic Year pill, Language Switcher, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentAcademicYear && (
              <span className="hidden md:inline-flex text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
                {currentAcademicYear.name}
              </span>
            )}
            <LanguageSwitcher variant="header" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
