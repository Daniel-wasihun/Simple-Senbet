"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "senbet_cached_user";

function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(USER_STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronously initialize with cached user if available for INSTANT dashboard display
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If cached user exists, do not block initial render with a loading spinner
    return typeof window === "undefined" ? true : !getCachedUser();
  });
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (typeof window !== "undefined" && data.user) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
    } catch {
      // Retain cached user in transient offline/network hiccups
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          message: data?.message || "Invalid email or password",
        };
      }

      const authenticatedUser = data.user;
      setUser(authenticatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser));
      }
      return { success: true, user: authenticatedUser };
    } catch {
      return {
        success: false,
        message: "Failed to connect to authentication service.",
      };
    }
  };

  const logout = async () => {
    // 1. Immediately clear local session and storage for instant UI response
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    // 2. Instant client navigation to login without delay
    router.replace("/login");

    // 3. Dispatch backend logout and cookie clearing in the background
    try {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
