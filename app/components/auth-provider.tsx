"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { createAuthStateController, type AuthState } from "../lib/auth-state";
import { getSupabaseBrowserClient } from "../lib/supabase";

type AuthContextValue = Pick<AuthState, "user" | "loading" | "configured"> & {
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, rerender] = useState(0);
  const controller = useMemo(
    () => createAuthStateController(getSupabaseBrowserClient(), () => rerender((count) => count + 1)),
    [],
  );
  const state = controller.getState();

  useEffect(() => {
    void controller.start();
    return () => controller.stop();
  }, [controller]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signOut: async () => {
      await controller.signOut();
    },
  }), [controller, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): { user: User | null; loading: boolean; configured: boolean; signOut(): Promise<void> } {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within an AuthProvider.");
  return value;
}
