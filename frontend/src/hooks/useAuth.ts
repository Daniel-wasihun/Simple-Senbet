"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";

interface User {
  id: number;
  uuid: string;
  name: string | { en: string };
  email: string;
  roles: string[];
  permissions: string[];
  authorized: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  navigations: any[];
}

const PROTECTED_ROUTES = ["/user", "/admin"];

function isProtectedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("auth_token");
      const userStr = localStorage.getItem("user");

      if (!token || token.length < 10) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);

        Cookies.remove("auth_token");
        Cookies.remove("user_role");

        if (isProtectedRoute(pathname)) {
          router.replace("/login");
        }
        return;
      }

      try {
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user data:", e);

        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");

        Cookies.remove("auth_token");
        Cookies.remove("user_role");

        setUser(null);
        setIsAuthenticated(false);

        if (isProtectedRoute(pathname)) {
          router.replace("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token" && !e.newValue) {
        setIsAuthenticated(false);
        setUser(null);

        Cookies.remove("auth_token");
        Cookies.remove("user_role");

        if (isProtectedRoute(pathname)) {
          router.replace("/login");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router, pathname]);

  const hasRole = (role: string | string[]): boolean => {
    if (!user?.roles) return false;
    if (user.roles.includes("Super Admin")) return true;

    return Array.isArray(role)
      ? role.some((r) => user.roles.includes(r))
      : user.roles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    if (user.roles.includes("Super Admin")) return true;
    return user.permissions.includes(permission);
  };

  const can = (action: "view" | "create" | "update" | "delete"): boolean => {
    if (!user?.authorized) return false;
    if (user.roles.includes("Super Admin")) return true;
    return user.authorized[action] === true;
  };

  const isAdmin =
    user?.roles?.some((role) =>
      ["Super Admin", "Admin", "Editor"].includes(role)
    ) || false;

  const isCustomer = user?.roles?.includes("Customer") || false;

  const isSuperAdmin =
    user?.roles?.some(
      (role) => role.toLowerCase() === "super admin"
    ) || false;

  const isEditor = user?.roles?.some((role)=>role.toLowerCase() === "editor") || false;
  return {
    isAuthenticated,
    user,
    isAdmin,
    isCustomer,
    isSuperAdmin,
    isEditor,
    isLoading,
    hasRole,
    hasPermission,
    can,
  };
};