"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  CreditCard,
  DollarSign,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface NavItem {
  label: string;
  amharicLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    label: "Main Overview",
    amharicLabel: "ዋና ገጽ",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "academic_director"],
  },
  {
    label: "Academic Department",
    amharicLabel: "የትምህርት ክፍል",
    href: "/acadamic/super-admin/dashboard",
    icon: GraduationCap,
    roles: ["superadmin", "academic_director", "teacher"],
  },
  {
    label: "Attendance & Liturgy",
    amharicLabel: "የቁጥጥርና ክትትል",
    href: "/attendance/super-admin/dashboard",
    icon: CalendarCheck,
    roles: ["superadmin", "attendance_officer", "teacher", "academic_director"],
  },
  {
    label: "Finance & Accounts",
    amharicLabel: "የሂሳብና በጀት ክፍል",
    href: "/finance/super-admin/dashboard",
    icon: DollarSign,
    roles: ["superadmin", "finance_officer"],
  },
  {
    label: "Member Registry",
    amharicLabel: "የአባላትና ምዝገባ",
    href: "/member/super-admin/dashboard",
    icon: Users,
    roles: ["superadmin", "member_coordinator", "student"],
  },
  {
    label: "Payment Ledger",
    amharicLabel: "የክፍያዎች መዝገብ",
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

  // Handle logout with instant feedback
  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.info("Signing out from Simple Senbet portal...");
    try {
      await logout();
      toast.success("Signed out successfully.");
    } catch {
      toast.error("Sign out encountered an error, redirecting...");
      router.push("/login");
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
          <div className="w-10 h-10 border-4 border-[#0f243e] dark:border-slate-700 border-t-[#c5a866] rounded-full animate-spin" />
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Left Sidebar: Fixed 100vh, separately scrollable on its own */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen flex flex-col shrink-0 bg-[#0a192e] dark:bg-[#0d1527] text-[#fbf6ec] border-r border-[#c5a866]/30 dark:border-slate-800 shadow-xl transition-transform duration-200 ease-in-out md:static md:translate-x-0 overflow-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header (Pinned at top) */}
        <div className="h-16 px-5 border-b border-white/10 dark:border-white/5 flex items-center justify-between bg-[#071324] dark:bg-[#09101d] shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#c5a866] bg-[#c5a866]/20 text-[#dfc896]">
              <EthiopianOrthodoxCross className="h-5 w-5 text-[#dfc896]" />
            </span>
            <div>
              <span className="block font-serif text-base font-bold text-white tracking-tight">
                Simple Senbet
              </span>
              <span className="block text-[9px] font-medium text-[#c5a866] uppercase tracking-[0.14em]">
                የሰንበት ት/ቤት መድረክ
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/70 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Role Card (Pinned) */}
        {user && (
          <div className="p-3 mx-3 my-2.5 rounded-xl bg-white/5 dark:bg-white/[0.03] border border-white/10 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#c5a866] text-[#0a192e] font-serif font-bold text-sm shrink-0">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#dfc896] truncate">
                    {user.role?.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items (Separately Scrollable on its own!) */}
        <nav className="flex-1 min-h-0 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c5a866]/80">
            የአገልግሎት ክፍሎች (Departments)
          </p>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#c5a866] text-[#0a192e] font-bold shadow-md shadow-[#c5a866]/20"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-[#0a192e]" : "text-[#dfc896] group-hover:text-white"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                    isActive ? "bg-[#0a192e]/20 text-[#0a192e]" : "text-white/50"
                  }`}
                >
                  {item.amharicLabel}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Pinned at bottom) */}
        <div className="p-3 border-t border-white/10 dark:border-white/5 space-y-1 bg-[#071324] dark:bg-[#09101d] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/5 hover:text-white transition"
          >
            <Home className="h-4 w-4 text-[#c5a866]" />
            <span>Public Website / ዋና ገጽ</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out / ውጣ"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column: 100vh, flex-col, overflow-hidden */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-[#0a0e1a]">
        {/* Pinned Top Navbar */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#141a29] border-b border-slate-200 dark:border-slate-800/80 shadow-xs flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 transition-colors">
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

            {/* User Chip */}
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
