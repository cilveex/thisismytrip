import { DEPARTURE, NIGHTS } from "./trip-data";

const startOfToday = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

const parseDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};

/** Whole days from today until departure (0 on the day itself or after). */
export function daysUntilDeparture() {
  return Math.max(0, Math.round((parseDay(DEPARTURE).getTime() - startOfToday().getTime()) / 86_400_000));
}

/** Where we are relative to the trip, for the countdown wording. */
export function tripPhase(): "before" | "today" | "during" | "after" {
  const diff = Math.round((parseDay(DEPARTURE).getTime() - startOfToday().getTime()) / 86_400_000);
  if (diff > 0) return "before";
  if (diff === 0) return "today";
  return -diff <= NIGHTS ? "during" : "after";
}
