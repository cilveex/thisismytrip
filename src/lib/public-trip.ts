import { areaById, type Flights, type GoodToKnow, type TripState, type Who } from "./trip-data";
import { computeBudget } from "./budget";

/** Dev without Supabase: the public page reads the family copy from here */
export const LOCAL_PUBLIC_KEY = "tenerife-trip-public-local";

/**
 * What the family page can see. Built from the private trip by the planner and saved to
 * the public row. A budget summary of the saved plan (never the sandbox) is included only when
 * "Show budget to family" is on. Never notes, place prices, estimate settings, unpublished places
 * or traveller notes.
 */
export interface PublicTrip {
  v: 1;
  updatedAt: string;
  flights: Omit<Flights, "notes">;
  /** Travellers on a different flight */
  flightNotes?: { name: string; lv: string; en: string }[];
  travellers: { name: string; apt: Who }[];
  stays: {
    id: string;
    name: string;
    who: Who;
    area: string;
    address: string;
    lat: number | null;
    lng: number | null;
    url: string;
    booked: boolean;
    /** Walk to the other group's place, minutes */
    walkMin: number | null;
  }[];
  days: { date: string; label: string; lv: string; en: string }[];
  goodToKnow: GoodToKnow[];
  /** Optional: rows published before it existed won't have it */
  budget?: PublicBudget;
}

export interface PublicBudget {
  people: number;
  poolPerPerson: number;
  perPerson: number;
  total: number;
  /** Line keys: flights, family, couple, car, transfers, food, activities, mobility, buffer */
  lines: { key: string; amount: number; confirmed: boolean }[];
}

function publicBudget(t: TripState): PublicBudget {
  const b = computeBudget(t);
  const r = (n: number) => Math.round(n);
  return {
    people: b.people,
    poolPerPerson: r(t.budget.poolPerPerson),
    perPerson: r(b.perPerson),
    total: r(b.total),
    lines: b.lines
      .filter((l) => l.amount > 0)
      .map((l) => ({ key: l.key, amount: r(l.amount), confirmed: !!t.budget.confirmed[l.key] })),
  };
}

export function toPublic(t: TripState): PublicTrip {
  return {
    v: 1,
    updatedAt: new Date().toISOString(),
    flights: { outbound: t.flights.outbound, return: t.flights.return },
    flightNotes: t.flights.notes
      .filter((n) => n.lv.trim() || n.en.trim())
      .map((n) => ({ name: t.travellers.find((x) => x.id === n.travellerId)?.name ?? "", lv: n.lv, en: n.en })),
    travellers: t.travellers.map(({ name, apt }) => ({ name, apt })),
    stays: t.apartments
      .filter((a) => a.showToFamily && a.status !== "no")
      .map((a) => ({
        id: a.id,
        name: a.name,
        who: a.who,
        area: areaById(t, a.area).name,
        address: a.address,
        lat: a.lat,
        lng: a.lng,
        url: a.url,
        booked: a.status === "booked",
        walkMin: a.walkMin,
      })),
    days: t.days.map(({ date, label, lv, en }) => ({ date, label, lv, en })),
    goodToKnow: t.goodToKnow.filter((g) => g.lv.trim() || g.en.trim()),
    ...(t.showBudgetToFamily ? { budget: publicBudget(t) } : {}),
  };
}

/** Compare ignoring the timestamp, to skip needless writes */
export const samePublic = (a: PublicTrip | null, b: PublicTrip) =>
  !!a && JSON.stringify({ ...a, updatedAt: "" }) === JSON.stringify({ ...b, updatedAt: "" });
