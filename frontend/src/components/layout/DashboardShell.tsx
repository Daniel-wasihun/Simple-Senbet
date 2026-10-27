"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  Home,
  UserRound,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { EthiopianOrthodoxCross } from "@/components/public/PublicSiteLayout";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarItem } from "@/components/layout/SidebarItem";
import { LanguageSwitcher } from "@/components/layout/navbar/languageSwicher";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigationStore } from "@/store/useNavigationStore";
import {
  DashboardAppShimmerSkeleton,
  DashboardContentShimmerSkeleton,
  OptimisticPageSkeleton,
} from "@/components/ui/DashboardShimmerSkeleton";
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_LINKS,
  ADMIN_ROUTE_PERMISSIONS,
} from "@/config/admin-nav.config";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (user.name.slice(0, 2) || "U").toUpperCase();
  }, [user?.name]);

  const { optimisticPath, setOptimisticPath } = useNavigationStore();
  const currentPath = optimisticPath ?? pathname;

  // Clear optimistic path on real route transition
  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname, setOptimisticPath]);

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    const roles = (user.roles || []).map((r) =>
      typeof r === "string" ? r.toLowerCase() : ""
    );
    return (
      role === "superadmin" ||
      role === "admin" ||
      role === "administrator" ||
      roles.includes("superadmin") ||
      roles.includes("admin") ||
      roles.includes("administrator") ||
      Boolean(user.permissions?.includes("*"))
    );
  }, [user]);

  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);

  // All sidebar options listed normally; superadmin gets full access to everything,
  // otherwise strictly checked against user permissions.
  const navigationItems = useMemo(() => {
    const allLinks = [
      ...ADMIN_NAV_LINKS,
      ...ADMIN_NAV_GROUPS.flatMap((group) => group.links),
    ];
    if (isSuperAdmin) {
      return allLinks;
    }
    return allLinks.filter((item) =>
      item.permissions.some((permission) => permissions.includes(permission))
    );
  }, [isSuperAdmin, permissions]);

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  const fallbackRoute = navigationItems[0]?.href ?? "/";

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, pathname, router, user]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (isSuperAdmin) return; // Superadmin has access to everything and is never blocked

    const routeRule = ADMIN_ROUTE_PERMISSIONS.find(
      ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (
      routeRule &&
      !routeRule.permissions.some((permission) => permissions.includes(permission))
    ) {
      router.replace(fallbackRoute);
    }
  }, [fallbackRoute, isLoading, isSuperAdmin, pathname, permissions, router, user]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        sidebarToggleRef.current?.focus();
      } else if (event.key === "Tab") {
        const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])"
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.requestAnimationFrame(() =>
      sidebarRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus()
    );
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  // Handle logout with instant zero-delay feedback
  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.success(t("dashboard.signedOut"));
    try {
      await logout();
    } catch {
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setOptimisticPath(href);
    }
    setMobileOpen(false);
  };

  // Current active item for header title
  const currentItem = useMemo(() => {
    return (
      navigationItems
        .filter((item) => isItemActive(item.href))
        .sort((left, right) => right.href.length - left.href.length)[0] ?? navigationItems[0]
    );
  }, [navigationItems, currentPath]);

  // Zero-spinner: display skeleton shimmer on initial session load (route-aware)
  if (isLoading || !user || !currentItem) {
    return <DashboardAppShimmerSkeleton path={pathname} />;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-[#f1f5f9]">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("dashboard.closeSidebar")}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar: Fixed 100vh, separately scrollable on its own, with exact Senbet System UI */}
      <aside
        ref={sidebarRef}
        id="dashboard-sidebar"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label={t("navigation.main")}
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen flex flex-col shrink-0 bg-white dark:bg-[#141a29] text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 shadow-xs transition-transform duration-200 ease-in-out md:static md:translate-x-0 overflow-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header (Pinned at top) */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#0e1424] shrink-0">
          <Link href={fallbackRoute} className="flex items-center gap-3 group" title="Simple Senbet">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#2563EB] dark:border-[#60A5FA]/40 bg-[#EFF6FF] dark:bg-[#1c2438] text-[#1D4ED8] dark:text-[#60A5FA] shadow-2xs transition-transform group-hover:scale-105">
              <EthiopianOrthodoxCross className="h-5 w-5 text-[#1D4ED8] dark:text-[#60A5FA]" />
            </span>
            <div>
              <span className="block font-serif text-base font-bold text-[#1D4ED8] dark:text-slate-100 tracking-tight">
                Simple Senbet
              </span>
              <span className="block text-[9px] font-medium text-[#1D4ED8] dark:text-[#60A5FA] uppercase tracking-[0.14em]">
                የሰንበት ት/ቤት መድረክ
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            type="button"
            className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-md"
            aria-label={t("dashboard.closeSidebar")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items (Separately Scrollable on its own, Flat List of All Permitted Options) */}
        <nav className="flex-1 min-h-0 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navigationItems.map((item) => {
            const active = isItemActive(item.href);
            return (
              <SidebarItem
                key={item.href}
                label={t(item.translationKey)}
                amharicLabel=""
                href={item.href}
                icon={item.icon}
                isActive={active}
                onClick={() => handleNavClick(item.href)}
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
            <Home className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" />
            <span>{t("dashboard.publicWebsite")}</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            <span>{isLoggingOut ? t("dashboard.signingOut") : t("dashboard.signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column: 100vh, flex-col, overflow-hidden */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-[#0a0e1a]">
        {/* Pinned Top Navbar */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#141a29] border-b border-slate-200 dark:border-slate-800/80 shadow-2xs flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 transition-colors">
          <div className="flex items-center gap-3">
            <button
              ref={sidebarToggleRef}
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="dashboard-sidebar"
              className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
              aria-label={t("dashboard.openSidebar")}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {t(currentItem.translationKey)}
              </span>
              <span className="text-slate-400 dark:text-slate-600 text-xs hidden sm:inline">•</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />

            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  aria-label="User profile options"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className={`relative grid h-9 w-9 sm:h-9.5 sm:w-9.5 place-items-center rounded-full transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0858a8] ${
                    profileMenuOpen
                      ? "ring-2 ring-[#0858a8] ring-offset-2 dark:ring-offset-[#0e1424] shadow-sm"
                      : "ring-2 ring-transparent hover:ring-[#0858a8]/40 ring-offset-1 dark:ring-offset-[#0e1424]"
                  }`}
                >
                  <span className="grid h-full w-full place-items-center rounded-full bg-linear-to-tr from-[#0858a8] to-[#1e7fdc] text-white font-bold text-xs shadow-2xs">
                    {userInitials}
                  </span>
                </button>
                {profileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2.5 w-64 origin-top-right rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#141a29] p-1.5 shadow-xl transition-all duration-150"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 px-3 py-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-tr from-[#0858a8] to-[#1e7fdc] text-white font-bold text-sm shadow-2xs">
                        {userInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {user.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-blue-50 dark:bg-blue-950/60 text-[#0858a8] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                          {user.role ? user.role.replace(/_/g, " ") : "Member"}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        role="menuitem"
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-[#0858a8] dark:hover:text-blue-400 transition cursor-pointer"
                      >
                        <UserRound aria-hidden="true" className="h-4 w-4 text-[#0858a8] dark:text-blue-400" />
                        {t("profile.menuProfile", { defaultValue: "Profile" })}
                      </Link>
                      <Link
                        role="menuitem"
                        href="/change-password"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-[#0858a8] dark:hover:text-blue-400 transition cursor-pointer"
                      >
                        <KeyRound aria-hidden="true" className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        {t("profile.menuPassword", { defaultValue: "Change password" })}
                      </Link>
                    </div>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                    <button
                      role="menuitem"
                      type="button"
                      disabled={isLoggingOut}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        void handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-[4px] px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
                    >
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                      {t("profile.signOut", { defaultValue: "Sign out" })}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Separately Scrollable Middle Page Content with Immediate Shimmer on Tab Selection */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-[#0a0e1a] transition-colors">
          <div className="dashboard-content w-full">
            {optimisticPath && optimisticPath !== pathname ? (
              <OptimisticPageSkeleton path={optimisticPath} />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
