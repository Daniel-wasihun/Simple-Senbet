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

  // Handle logout with feedback
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
    return DASHBOARD_NAV_ITEMS.find((item) => pathname.startsWith(item.href)) || DASHBOARD_NAV_ITEMS[0];
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0f243e] border-t-[#c5a866] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#5f7081]">Loading Sunday School Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f243e] flex flex-col md:flex-row">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a192e] text-[#fbf6ec] flex flex-col border-r border-[#c5a866]/30 shadow-xl transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between bg-[#071324]">
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

        {/* User Role Card */}
        {user && (
          <div className="p-4 mx-3 my-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#c5a866] text-[#0a192e] font-serif font-bold text-sm">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#dfc896] truncate">
                    {user.role?.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
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
                  className={`text-[9px] px-1.5 py-0.5 rounded ${
                    isActive ? "bg-[#0a192e]/20 text-[#0a192e]" : "text-white/50"
                  }`}
                >
                  {item.amharicLabel}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 space-y-1 bg-[#071324]">
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
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out / ውጣ"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-xs flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm sm:text-base font-bold text-slate-900">
                {currentItem.label}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-medium text-[#8c7140] hidden sm:inline">
                {currentItem.amharicLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Public Link */}
            <Link
              href="/super-admin/dashboard/payments"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payments</span>
            </Link>

            {/* User Chip */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-800 hidden sm:inline">{user.name}</span>
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-white text-[#0f243e] border border-slate-200 shadow-2xs">
                  {user.role?.replace("_", " ")}
                </span>
              </div>
            )}

            {/* Quick Sign Out Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition disabled:opacity-50"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Inner Container (with duplicate header suppressor) */}
        <div className="dashboard-content flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
