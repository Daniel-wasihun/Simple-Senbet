"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/types/auth";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { apiCache } from "@/services/apiCache";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: (silent?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await authService.session();
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshUser(false);
  }, [refreshUser]);

  useEffect(() => {
    let lastRefresh = 0;
    const refreshOnFocus = () => {
      const now = Date.now();
      // Debounce focus checks to at most once every 30 seconds, and always silent
      if (document.visibilityState === "visible" && now - lastRefresh > 30_000) {
        lastRefresh = now;
        void refreshUser(true);
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await authService.login(email, password);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          message: data?.message || "Invalid email or password",
        };
      }

      const authenticatedUser = data.user;
      setUser(authenticatedUser);
      return { success: true, user: authenticatedUser };
    } catch {
      return {
        success: false,
        message: "Failed to connect to authentication service.",
      };
    }
  };

  const logout = async () => {
    // Clear local state immediately, then wait for the server to revoke the token
    // and expire the httpOnly cookie before completing sign-out.
    setUser(null);
    apiCache.clear();
    try {
      await authService.logout();
    } catch {
      // The server may be unavailable; the client still leaves the protected UI.
    } finally {
      router.replace("/login");
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
