"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Menu,
  X,
  LogOut,
  Home,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarItem } from "@/components/layout/SidebarItem";

interface NavItem {
  label: string;
  amharicLabel: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

// Exact ordered navigation options as requested:
// 1. Dashboard -> 2. Member Registration -> 3. Academic Director -> 4. Attendance -> 5. Payments
const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    amharicLabel: "ዋና ገጽ",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
    roles: [
      "superadmin",
      "academic_director",
      "finance_officer",
      "attendance_officer",
      "teacher",
      "member_coordinator",
      "student",
    ],
  },
  {
    label: "Member Registration",
    amharicLabel: "የአባላት ምዝገባ",
    href: "/member/super-admin/dashboard",
    icon: Users,
    roles: ["superadmin", "member_coordinator", "student"],
  },
  {
    label: "Academic Director",
    amharicLabel: "የትምህርት ክፍል",
    href: "/acadamic/super-admin/dashboard",
    icon: GraduationCap,
    roles: ["superadmin", "academic_director"],
  },
  {
    label: "Attendance",
    amharicLabel: "የቁጥጥርና ክትትል",
    href: "/attendance/super-admin/dashboard",
    icon: CalendarCheck,
    roles: ["superadmin", "academic_director", "attendance_officer", "teacher"],
  },
  {
    label: "Payments",
    amharicLabel: "ክፍያዎችና ሂሳብ",
    href: "/super-admin/dashboard/payments",
    icon: CreditCard,
    roles: ["superadmin", "finance_officer"],
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Handle logout with instant zero-delay feedback
  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.success("Signed out successfully.");
    try {
      await logout();
    } catch {
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filter visible nav items based on user role
  const visibleNavItems = useMemo(() => {
    if (!user) return DASHBOARD_NAV_ITEMS;
    const userRole = (user.role || "").toLowerCase();
    if (userRole === "superadmin" || userRole === "admin") {
      return DASHBOARD_NAV_ITEMS;
    }
    return DASHBOARD_NAV_ITEMS.filter(
      (item) => !item.roles || item.roles.includes(userRole)
    );
  }, [user]);

  // Current active item
  const currentItem = useMemo(() => {
    return (
      DASHBOARD_NAV_ITEMS.find((item) => pathname.startsWith(item.href)) ||
      DASHBOARD_NAV_ITEMS[0]
    );
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#fbf9f4] dark:bg-[#0a0e1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0f243e] dark:border-slate-700 border-t-[#c5a866] dark:border-t-[#fba81c] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#5f7081] dark:text-slate-400">
            Loading Sunday School Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-[#f1f5f9]">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar: Fixed 100vh, separately scrollable on its own, with exact Senbet System UI */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen flex flex-col shrink-0 bg-white dark:bg-[#141a29] text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 shadow-xs transition-transform duration-200 ease-in-out md:static md:translate-x-0 overflow-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header (Pinned at top) */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#0e1424] shrink-0">
          <Link href="/" className="flex items-center gap-3 group" title="Simple Senbet">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#c5a866] dark:border-[#fba81c]/40 bg-[#f5ecda] dark:bg-[#1c2438] text-[#8c7140] dark:text-[#fba81c] shadow-2xs transition-transform group-hover:scale-105">
              <EthiopianOrthodoxCross className="h-5 w-5 text-[#8c7140] dark:text-[#fba81c]" />
            </span>
            <div>
              <span className="block font-serif text-base font-bold text-[#0f243e] dark:text-slate-100 tracking-tight">
                Simple Senbet
              </span>
              <span className="block text-[9px] font-medium text-[#8c7140] dark:text-[#fba81c] uppercase tracking-[0.14em]">
                የሰንበት ት/ቤት መድረክ
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items (Separately Scrollable on its own, NO role card in sidebar) */}
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            የአገልግሎት ክፍሎች (Departments)
          </p>
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/super-admin/dashboard" && pathname.startsWith(item.href));
            return (
              <SidebarItem
                key={item.href}
                label={item.label}
                amharicLabel={item.amharicLabel}
                href={item.href}
                icon={item.icon}
                isActive={isActive}
                onClick={() => setMobileOpen(false)}
              />
            );
          })}
        </nav>

        {/* Sidebar Footer (Pinned at bottom) */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1 bg-slate-50/80 dark:bg-[#0e1424] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2438] hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <Home className="h-4 w-4 text-[#8c7140] dark:text-[#fba81c]" />
            <span>Public Website / ዋና ገጽ</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out / ውጣ"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column: 100vh, flex-col, overflow-hidden */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-[#0a0e1a]">
        {/* Pinned Top Navbar */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#141a29] border-b border-slate-200 dark:border-slate-800/80 shadow-2xs flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {currentItem.label}
              </span>
              <span className="text-slate-400 dark:text-slate-600 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-medium text-[#8c7140] dark:text-[#fba81c] hidden sm:inline">
                {currentItem.amharicLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Instant Theme Toggle (Light / Dark mode from Senbet System) */}
            <ThemeToggle />

            {/* Quick Ledger Link */}
            <Link
              href="/super-admin/dashboard/payments"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Payments</span>
            </Link>

            {/* User Chip: The user role is shown ONLY ONCE here in the top nav bar */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1c2438] border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                  {user.name}
                </span>
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-white dark:bg-[#141a29] text-[#0f243e] dark:text-[#fba81c] border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {user.role?.replace("_", " ")}
                </span>
              </div>
            )}

            {/* Quick Sign Out Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Separately Scrollable Middle Page Content! */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-[#0a0e1a] transition-colors">
          <div className="dashboard-content w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
