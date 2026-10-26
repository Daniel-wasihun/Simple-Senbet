"use client";

import { create } from "zustand";

interface NavigationState {
    optimisticPath: string | null;
    setOptimisticPath: (path: string | null) => void;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    toggleMobileOpen: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    optimisticPath: null,
    setOptimisticPath: (path) => set({ optimisticPath: path }),
    mobileOpen: false,
    setMobileOpen: (open) => set({ mobileOpen: open }),
    toggleMobileOpen: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
}));
