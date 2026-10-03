import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { PUBLIC_TRIP_ID, TRIP_ID, normalizeState, type TripState } from "./trip-data";
import { LOCAL_PUBLIC_KEY, samePublic, toPublic, type PublicTrip } from "./public-trip";

type Updater = (draft: TripState) => TripState | void;
export type SyncStatus = "loading" | "live" | "saving" | "error" | "local";

interface Ctx {
  trip: TripState | null;
  /** Mutate a draft copy (or return a new state). Saved after a short debounce. */
  update: (fn: Updater) => void;
  status: SyncStatus;
}

const TripCtx = createContext<Ctx | null>(null);
const CLIENT = Math.random().toString(36).slice(2);
const LOCAL_KEY = "tenerife-trip-local";

const DEBOUNCE_MS = 400;
const RETRY_MS = 5000;

type Stored = TripState & { _by?: string };

function strip(d: Stored): TripState {
  const { _by, ...rest } = d;
  void _by;
  return normalizeState(rest);
}

function loadLocal(): TripState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch {
    /* storage unavailable or corrupt — start from the seed */
  }
  return normalizeState(null);
}

/**
 * The planner's store: the full private trip. Only mounted for the logged-in admin, and it
 * refuses to write without `canWrite`. Every save also refreshes the family-facing public row.
 */
export function TripProvider({ children, canWrite }: { children: ReactNode; canWrite: boolean }) {
  const [trip, setTrip] = useState<TripState | null>(() => (supabase ? null : loadLocal()));
  const [status, setStatus] = useState<SyncStatus>(supabase ? "loading" : "local");
  const tripRef = useRef<TripState | null>(trip);
  /** True while there are local edits not yet confirmed by the server. */
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const canWriteRef = useRef(canWrite);
  useEffect(() => {
    canWriteRef.current = canWrite;
  }, [canWrite]);
  /** Last public snapshot known to be on the server, to skip needless writes */
  const published = useRef<PublicTrip | null>(null);

  /** Write the family copy if it changed. Returns an error or null. */
  const publish = useCallback(async (t: TripState) => {
    const pub = toPublic(t);
    if (samePublic(published.current, pub)) return null;
    if (!supabase) {
      try {
        localStorage.setItem(LOCAL_PUBLIC_KEY, JSON.stringify(pub));
      } catch {
        /* ignore */
      }
      published.current = pub;
      return null;
    }
    const { error } = await supabase
      .from("trips")
      .upsert({ id: PUBLIC_TRIP_ID, data: pub, updated_at: new Date().toISOString() });
    if (!error) published.current = pub;
    return error;
  }, []);

  const apply = useCallback((next: TripState) => {
    tripRef.current = next;
    setTrip(next);
  }, []);

  const save = useCallback(async function run(): Promise<void> {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const snapshot = tripRef.current;
    if (!snapshot || !dirty.current) return;
    if (!canWriteRef.current) return setStatus("error"); // logged out: never write
    if (!supabase) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot));
      } catch {
        /* storage unavailable — keep in memory */
      }
      await publish(snapshot);
      dirty.current = false;
      return;
    }
    if (saving.current) return; // the running save re-checks when it finishes
    saving.current = true;
    const [priv, pubError] = await Promise.all([
      supabase
        .from("trips")
        .upsert({ id: TRIP_ID, data: { ...snapshot, _by: CLIENT }, updated_at: new Date().toISOString() }),
      publish(snapshot),
    ]);
    const error = priv.error ?? pubError;
    saving.current = false;
    if (error) {
      setStatus("error");
      timer.current = setTimeout(run, RETRY_MS);
      return;
    }
    if (tripRef.current === snapshot) {
      dirty.current = false;
      setStatus("live");
    } else {
      void run(); // edits arrived mid-flight
    }
  }, [publish]);

  // Initial load + realtime subscription
  useEffect(() => {
    const client = supabase;
    if (!client) return; // local mode: state was loaded in useState

    let alive = true;
    const fetchRow = async () => {
      const { data, error } = await client.from("trips").select("data").eq("id", TRIP_ID).maybeSingle();
      if (!alive) return;
      if (error) {
        console.error("[trip] load failed", error);
        setStatus("error");
        return;
      }
      if (dirty.current) return; // never clobber unsaved local edits
      const stored = data?.data as Stored | undefined;
      if (stored && Object.keys(stored).length) {
        apply(strip(stored));
      } else {
        // First run: seed, but don't overwrite if another device seeded at the same moment.
        const seed = normalizeState(null);
        if (!canWriteRef.current) return apply(seed);
        await client.from("trips").upsert({ id: TRIP_ID, data: seed }, { onConflict: "id", ignoreDuplicates: true });
        const again = await client.from("trips").select("data").eq("id", TRIP_ID).maybeSingle();
        if (!alive) return;
        const d = again.data?.data as Stored | undefined;
        apply(d && Object.keys(d).length ? strip(d) : seed);
      }
      setStatus("live");
      // Bring the family copy up to date (e.g. after an app update changed what it contains).
      const pubRow = await client.from("trips").select("data").eq("id", PUBLIC_TRIP_ID).maybeSingle();
      if (!alive) return;
      published.current = (pubRow.data?.data as PublicTrip | undefined) ?? null;
      if (tripRef.current && canWriteRef.current) {
        const err = await publish(tripRef.current);
        if (err) console.error("[trip] publish failed", err);
      }
    };

    const ch = client
      .channel(`trip-${TRIP_ID}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trips", filter: `id=eq.${TRIP_ID}` }, (p) => {
        const d = (p.new as { data?: Stored } | null)?.data;
        if (!d || d._by === CLIENT || dirty.current) return;
        apply(strip(d));
      })
      .subscribe((s) => {
        // Fires on first connect and on every reconnect — refetch to catch anything missed.
        if (s === "SUBSCRIBED") void fetchRow();
        if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") console.warn("[trip] realtime", s);
      });

    return () => {
      alive = false;
      void client.removeChannel(ch);
    };
  }, [apply, publish]);

  // Local mode: make sure the family copy exists for the public page
  useEffect(() => {
    if (!supabase && tripRef.current) void publish(tripRef.current);
  }, [publish]);

  // Don't lose the last edit when the tab closes or the phone locks.
  useEffect(() => {
    const flush = () => {
      if (dirty.current) void save();
    };
    const onVis = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [save]);

  const update = useCallback(
    (fn: Updater) => {
      const prev = tripRef.current;
      if (!prev) return;
      const draft = structuredClone(prev);
      const next = fn(draft) ?? draft;
      apply(next);
      dirty.current = true;
      if (supabase) setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, DEBOUNCE_MS);
    },
    [apply, save],
  );

  return <TripCtx.Provider value={{ trip, update, status }}>{children}</TripCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTrip() {
  const c = useContext(TripCtx);
  if (!c) throw new Error("useTrip outside TripProvider");
  return c;
}
