import { areaById, type Flights, type GoodToKnow, type TripState, type Who } from "./trip-data";

/** Dev without Supabase: the public page reads the family copy from here */
export const LOCAL_PUBLIC_KEY = "tenerife-trip-public-local";

/**
 * What the family page can see. Built from the private trip by the planner and saved to
 * the public row — never include budget, notes, unpublished places or traveller notes.
 */
export interface PublicTrip {
  v: 1;
  updatedAt: string;
  flights: Flights;
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
  }[];
  days: { date: string; label: string; lv: string; en: string }[];
  goodToKnow: GoodToKnow[];
}

export function toPublic(t: TripState): PublicTrip {
  return {
    v: 1,
    updatedAt: new Date().toISOString(),
    flights: t.flights,
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
      })),
    days: t.days.map(({ date, label, lv, en }) => ({ date, label, lv, en })),
    goodToKnow: t.goodToKnow.filter((g) => g.lv.trim() || g.en.trim()),
  };
}

/** Compare ignoring the timestamp, to skip needless writes */
export const samePublic = (a: PublicTrip | null, b: PublicTrip) =>
  !!a && JSON.stringify({ ...a, updatedAt: "" }) === JSON.stringify({ ...b, updatedAt: "" });
