"use client";
import { create } from "zustand";

// This store is just for UI-level state that supplements NextAuth session
// Real auth state comes from useSession() hook
interface AuthUIState {
  redirectAfterLogin: string;
  setRedirectAfterLogin: (path: string) => void;
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  redirectAfterLogin: "/feed",
  setRedirectAfterLogin: (path) => set({ redirectAfterLogin: path }),
}));
