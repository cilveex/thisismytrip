import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { ADMIN_EMAIL, supabase } from "@/lib/supabase";
import { AuthCtx } from "@/lib/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | "local" | null>(supabase ? null : "local");
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    // Restores the saved session (stays logged in on this device) and follows refreshes/logouts.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const logIn = async (password: string): Promise<string | null> => {
    if (!supabase) return null;
    if (!ADMIN_EMAIL) return "The planner isn't set up yet (VITE_ADMIN_EMAIL is missing).";
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    if (!error) return null;
    if (error.code === "invalid_credentials" || /invalid login/i.test(error.message)) return "Wrong password.";
    if (error.status === 429) return "Too many tries. Wait a minute and try again.";
    return "Couldn't log in. Check your connection and try again.";
  };

  const logOut = async () => {
    await supabase?.auth.signOut();
  };

  return <AuthCtx.Provider value={{ session, loading, logIn, logOut }}>{children}</AuthCtx.Provider>;
}
