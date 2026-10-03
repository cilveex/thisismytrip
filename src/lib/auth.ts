import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export interface AuthState {
  /** "local" when running without Supabase (dev): the planner is open, nothing is shared */
  session: Session | "local" | null;
  loading: boolean;
  logIn: (password: string) => Promise<string | null>;
  logOut: () => Promise<void>;
}

export const AuthCtx = createContext<AuthState | null>(null);

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
