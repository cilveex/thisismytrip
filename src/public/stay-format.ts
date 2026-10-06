import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { PublicTrip } from "@/lib/public-trip";
import { eur } from "@/lib/budget";
import { NIGHTS, type Who } from "@/lib/trip-data";
import { useI18n } from "./i18n";
import type { StayPin } from "./StaysMap";

export type Stay = PublicTrip["stays"][number];

export const listJoin = (xs: string[], and: string) => (xs.length < 2 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} ${and} ${xs.at(-1)}`);

export const mapsUrl = (s: Stay) =>
  s.lat != null && s.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`
    : s.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`
      : null;

/** "€1 400", or "≈ €1 400" for an area estimate; the name when there's no price */
export const pinLabel = (s: Stay) => (s.price ? `${s.price.estimate ? "≈ " : ""}${eur(s.price.total)}` : s.name);

export const hasSpot = (s: Stay): s is Stay & { lat: number; lng: number } => s.lat != null && s.lng != null;

/** Booked first, then family places before couple places; otherwise the planner's order */
export const sortStays = (stays: Stay[]) =>
  [...stays].sort((a, b) => Number(b.booked) - Number(a.booked) || Number(a.who === "couple") - Number(b.who === "couple"));

/** Who a place is for, short: "Family" / "Alvis and Lera"; plus the names in full */
export function useGroups(trip: PublicTrip) {
  const { t } = useI18n();
  const names = (who: string) => listJoin(trip.travellers.filter((x) => x.apt === who).map((x) => x.name), t("and"));
  const group = (who: Who) => (who === "family" ? t("group.family") : names("couple") || t("group.couple"));
  return { names, group };
}

/** Map pins for the places that have a spot */
export function usePins(stays: Stay[], group: (who: Who) => string) {
  const { t, tn } = useI18n();
  const pins: StayPin[] = stays.filter(hasSpot).map((s) => {
    const p = s.price;
    return {
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      label: pinLabel(s),
      group: s.who,
      booked: s.booked,
      title: [
        s.name,
        group(s.who),
        p && (p.estimate ? t("stay.approx", { amount: eur(p.total) }) : eur(p.total)),
        s.booked ? t("stay.booked") : t("stay.maybe"),
      ]
        .filter(Boolean)
        .join(", "),
      preview: {
        img: s.photos?.[0],
        name: s.name,
        total: p ? tn("stay.totalFor", NIGHTS, { amount: pinLabel(s) }) : s.area,
        perPerson: p && p.people > 0 ? t("stay.perPerson", { amount: eur(p.perPerson) }) : undefined,
      },
    };
  });
  // A string, so the map redraws only when the pins really change (realtime sends new objects)
  return JSON.stringify(pins);
}

/** Live media query */
export function useMedia(q: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(q);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    [q],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(q).matches, () => false);
}

const isCompare = () => (window.history.state as { compare?: boolean } | null)?.compare === true;

/** Open state kept in history, so the phone's back button closes the table */
export function useCompare() {
  const [isOpen, setOpen] = useState(isCompare);
  useEffect(() => {
    const onPop = () => setOpen(isCompare());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return {
    isOpen,
    open: () => {
      window.history.pushState({ compare: true }, "", window.location.pathname + window.location.search);
      setOpen(true);
    },
    close: () => {
      if (isCompare()) window.history.back(); // popstate closes it
      else setOpen(false);
    },
  };
}
