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
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", labelAm: "ዳሽቦርድ", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", labelAm: "ክፍሎች", icon: GraduationCap },
  { href: "/students", label: "Students", labelAm: "ተማሪዎች", icon: Users },
  { href: "/courses", label: "Courses", labelAm: "ትምህርቶች", icon: BookOpen },
  { href: "/attendance", label: "Daily Attendance", labelAm: "ዕለታዊ መገኘት", icon: CalendarCheck },
  { href: "/results", label: "Results Entry", labelAm: "ውጤት ማስገቢያ", icon: Award },
  { href: "/roster", label: "Class Roster & Rank", labelAm: "ደረጃ ሮስተር", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", labelAm: "ቅንብሮች", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-blue-900 text-white shadow-md border-b border-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Mobile hamburger & Logo */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <Link href="/dashboard" className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center text-blue-950 font-black shadow-inner text-base">
                  ✝
                </div>
                <div>
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                    Senbet School{" "}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                      MVP
                    </span>
                  </span>
                  <p className="text-[11px] text-blue-200 truncate max-w-[200px] sm:max-w-xs font-serif">
                    {school ? school.name : "ሰንበት ትምህርት ቤት"}
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: School & Academic Year Selector */}
            <div className="hidden md:flex items-center space-x-2">
              {schools.length > 1 ? (
                <div className="flex items-center bg-blue-950/60 rounded-lg px-2.5 py-1 border border-blue-700/50">
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
                <div className="flex items-center bg-blue-950/50 rounded-lg px-3 py-1 border border-blue-800/60 text-xs text-blue-100">
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

            {/* Right: Role Switcher & User Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Quick Role Switcher for Testing MVP */}
              <div className="flex items-center bg-blue-950/70 rounded-lg p-1 border border-blue-800 text-xs">
                <span className="text-[10px] text-blue-300 uppercase tracking-wider px-1 font-semibold hidden sm:inline">
                  Role:
                </span>
                <select
                  value={currentRole}
                  onChange={(e) => switchRole(e.target.value as UserRole)}
                  className="bg-transparent text-xs text-amber-300 font-medium outline-none cursor-pointer font-sans"
                  title="Switch Role to test role-based access"
                >
                  <option value="admin" className="bg-slate-900 text-white">
                    Admin / Owner
                  </option>
                  <option value="teacher" className="bg-slate-900 text-white">
                    Teacher
                  </option>
                  <option value="staff" className="bg-slate-900 text-white">
                    Staff
                  </option>
                  <option value="student" className="bg-slate-900 text-white">
                    Student
                  </option>
                </select>
              </div>

              {/* Sample Data Reset */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToSampleData}
                title="Reset sample students, classes, and exams"
                className="text-blue-200 hover:text-white hover:bg-blue-800 h-8 px-2 text-xs hidden lg:flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Demo</span>
              </Button>

              {/* User info & Logout */}
              {user && (
                <span className="text-xs text-blue-100 hidden xl:inline font-medium">
                  {user.full_name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-blue-200 hover:text-white hover:bg-blue-800 px-2 py-1.5 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Core Workflows
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-blue-50 text-blue-900 font-semibold border-l-4 border-blue-800 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`h-4 w-4 ${active ? "text-blue-800" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-serif">{item.labelAm}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100 px-3">
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Senbet Workflow
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Class → Students → Courses → Assessments → Daily Attendance → Results → Roster
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white h-full p-4 shadow-xl flex flex-col z-50">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-900">Senbet School Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 mt-4 flex-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        active
                          ? "bg-blue-50 text-blue-900 font-semibold border-l-4 border-blue-800"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-400">{item.labelAm}</span>
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
