import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { PUBLIC_TRIP_ID } from "./trip-data";
import { LOCAL_PUBLIC_KEY, type PublicTrip } from "./public-trip";

interface Ctx {
  trip: PublicTrip | null;
  status: "loading" | "live" | "empty" | "error";
}

const PublicCtx = createContext<Ctx>({ trip: null, status: "loading" });

const valid = (d: unknown): d is PublicTrip => !!d && typeof d === "object" && (d as PublicTrip).v === 1;

function loadLocal(): PublicTrip | null {
  try {
    const d = JSON.parse(localStorage.getItem(LOCAL_PUBLIC_KEY) || "null");
    return valid(d) ? d : null;
  } catch {
    return null;
  }
}

/** Read-only family copy of the trip, live via realtime. Never writes. */
export function PublicTripProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>(() => {
    if (supabase) return { trip: null, status: "loading" };
    const t = loadLocal();
    return { trip: t, status: t ? "live" : "empty" };
  });

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let alive = true;
    const fetchRow = async () => {
      const { data, error } = await client.from("trips").select("data").eq("id", PUBLIC_TRIP_ID).maybeSingle();
      if (!alive) return;
      if (error) return setState((s) => ({ ...s, status: "error" }));
      const d = data?.data;
      setState(valid(d) ? { trip: d, status: "live" } : { trip: null, status: "empty" });
    };
    const ch = client
      .channel(`trip-${PUBLIC_TRIP_ID}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trips", filter: `id=eq.${PUBLIC_TRIP_ID}` }, (p) => {
        const d = (p.new as { data?: unknown } | null)?.data;
        if (valid(d)) setState({ trip: d, status: "live" });
      })
      .subscribe((s) => {
        if (s === "SUBSCRIBED") void fetchRow();
      });
    return () => {
      alive = false;
      void client.removeChannel(ch);
    };
  }, []);

  return <PublicCtx.Provider value={state}>{children}</PublicCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePublicTrip = () => useContext(PublicCtx);
