import { useEffect, useState } from "react";
import type { TripState } from "./trip-data";

/** "Try it out" fields. Private to this device until applied to the shared trip. */
export interface Sandbox {
  planningArea: string;
  familyAptId: string | null;
  coupleAptId: string | null;
  useCar: boolean;
  carDays: number;
}

const KEY = "tenerife-sandbox";

export const sandboxFrom = (t: TripState): Sandbox => ({
  planningArea: t.planningArea,
  familyAptId: t.familyAptId,
  coupleAptId: t.coupleAptId,
  useCar: t.budget.useCar,
  carDays: t.budget.carDays,
});

/** The trip as it would be with the sandbox applied. Drops references to deleted places/areas. */
export function withSandbox(t: TripState, sb: Sandbox | null): TripState {
  if (!sb) return t;
  const has = (id: string | null) => (id && t.apartments.some((a) => a.id === id) ? id : null);
  return {
    ...t,
    planningArea: t.areas.some((a) => a.id === sb.planningArea) ? sb.planningArea : t.planningArea,
    familyAptId: has(sb.familyAptId),
    coupleAptId: has(sb.coupleAptId),
    budget: { ...t.budget, useCar: sb.useCar, carDays: sb.carDays },
  };
}

export function sandboxDiffers(t: TripState, sb: Sandbox | null) {
  if (!sb) return false;
  const a = sandboxFrom(withSandbox(t, sb));
  const b = sandboxFrom(t);
  return (Object.keys(a) as (keyof Sandbox)[]).some((k) => a[k] !== b[k]);
}

function load(): Sandbox | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sandbox) : null;
  } catch {
    return null;
  }
}

/** Sandbox state persisted in this browser so unapplied changes survive a refresh. */
export function useSandbox() {
  const [sb, setSb] = useState<Sandbox | null>(load);
  useEffect(() => {
    try {
      if (sb) localStorage.setItem(KEY, JSON.stringify(sb));
      else localStorage.removeItem(KEY);
    } catch {
      /* private mode: sandbox lasts this session only */
    }
  }, [sb]);
  return [sb, setSb] as const;
}
