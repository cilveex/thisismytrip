import type { Flight, Flights } from "./trip-data";

/** "2026-12-08T10:30" has both a date and a time */
export const hasTime = (dt: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dt);

/**
 * Shift a wall-clock time by minutes. Treated as UTC internally so no device time zone
 * or DST can creep in — the times are always local to the airport.
 */
export function shiftLocal(dt: string, minutes: number): string {
  if (!hasTime(dt)) return "";
  const d = new Date(dt.slice(0, 16) + ":00Z");
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 16);
}

/** "Tue 8 Dec, 10:30" (en) / "otrd., 8. dec., 10:30" (lv) */
export function formatLocal(dt: string, locale = "en-GB"): string {
  if (!hasTime(dt)) return "";
  const d = new Date(dt.slice(0, 16) + ":00Z");
  return d.toLocaleString(locale, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const meetAt = (f: Flight) => shiftLocal(f.depart, -f.meetBeforeMin);

/** When to leave the apartment for the return flight */
export const leaveAt = (f: Flights["return"]) => shiftLocal(f.depart, -(f.meetBeforeMin + f.transferMin));
