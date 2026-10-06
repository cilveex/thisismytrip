import { NIGHTS, areaById, type Apartment, type Item, type TripState, type Who } from "./trip-data";

export interface Scenario {
  areaId?: string;
  familyAptId?: string | null;
  coupleAptId?: string | null;
}

export interface Line {
  key: string;
  label: string;
  amount: number;
  color: string;
}

/** Cost of an item for its whole group. Without a car, car trips become organised tours. */
export function itemCost(it: Item, s: TripState) {
  if (it.carTour && !s.budget.useCar) return s.budget.tourPrice * it.people;
  return it.cost * it.people;
}

/** 7-night total for an apartment, or the area estimate if none is chosen / priced yet. */
export function aptTotal(s: TripState, id: string | null | undefined, who: Who, areaId: string) {
  const apt = id ? s.apartments.find((a) => a.id === id) : undefined;
  if (apt && apt.total != null) return apt.total;
  const area = areaById(s, apt?.area ?? areaId);
  return (who === "family" ? area.family : area.couple) * NIGHTS;
}

export function groupLabel(s: TripState, who: Who) {
  if (who === "family") return "Family apartment";
  const names = s.travellers.filter((t) => t.apt === "couple").map((t) => t.name);
  return names.length ? `${names.join(" & ")} apartment` : "Couple apartment";
}

export function computeBudget(s: TripState, sc: Scenario = {}) {
  const b = s.budget;
  const areaId = sc.areaId ?? s.planningArea;
  const area = areaById(s, areaId);
  const famId = sc.familyAptId !== undefined ? sc.familyAptId : s.familyAptId;
  const coupId = sc.coupleAptId !== undefined ? sc.coupleAptId : s.coupleAptId;
  const people = s.travellers.length;
  const pool = b.poolPerPerson * people;

  const activities = s.days.reduce((sum, d) => sum + d.items.reduce((x, i) => x + itemCost(i, s), 0), 0);
  const car = b.useCar ? b.carDays * (b.carRate + b.fuelRate) : 0;
  // Without a car, the late arrival needs an extra one-way airport trip (~60% of a minivan transfer).
  const transfers = 2 * area.minivan + (b.useCar ? 0 : area.minivan * 0.6);

  const lines: Line[] = [
    { key: "flights", label: "Flights", amount: b.flights, color: "var(--cat-1)" },
    { key: "family", label: groupLabel(s, "family"), amount: aptTotal(s, famId, "family", areaId), color: "var(--cat-2)" },
    { key: "couple", label: groupLabel(s, "couple"), amount: aptTotal(s, coupId, "couple", areaId), color: "var(--cat-3)" },
    { key: "car", label: "Car rental + fuel", amount: car, color: "var(--cat-4)" },
    { key: "transfers", label: b.useCar ? "Airport transfers" : "Airport transfers + extra pickup", amount: transfers, color: "var(--cat-5)" },
    { key: "food", label: "Food", amount: b.foodPerDay * people * NIGHTS, color: "var(--cat-6)" },
    { key: "activities", label: b.useCar ? "Activities" : "Activities (incl. tours)", amount: activities, color: "var(--cat-7)" },
    { key: "mobility", label: "Wheelchair / scooter", amount: b.mobility, color: "var(--cat-8)" },
  ];
  const subtotal = lines.reduce((x, l) => x + l.amount, 0);
  lines.push({ key: "buffer", label: `Buffer ${b.bufferPct}%`, amount: (subtotal * b.bufferPct) / 100, color: "var(--cat-9)" });
  const total = lines.reduce((x, l) => x + l.amount, 0);
  return { lines, total, pool, left: pool - total, people, perPerson: people ? total / people : 0 };
}

/** The budget if this place were the one used for its group. Transfers follow the family's area. */
export function budgetWithPlace(s: TripState, apt: Pick<Apartment, "id" | "who" | "area">) {
  return apt.who === "family"
    ? computeBudget(s, { areaId: apt.area, familyAptId: apt.id })
    : computeBudget(s, { coupleAptId: apt.id });
}

/** "€1 234" — whole euros, no-break space as thousands separator, sign dropped (use leftLabel for direction). */
export const eur = (n: number) => "€" + Math.round(Math.abs(n)).toLocaleString("en-US").replace(/,/g, "\u00a0");

export const leftLabel = (left: number) => (left >= 0 ? `${eur(left)} left` : `${eur(left)} over`);

/** "Alvis and Lera" — the couple's names, for sentences. */
export function coupleNames(s: TripState) {
  const names = s.travellers.filter((t) => t.apt === "couple").map((t) => t.name);
  if (!names.length) return "The couple";
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** Warning when the couple's place in use is in a different area from the family's. */
export function splitStayWarning(s: TripState, famId = s.familyAptId, coupId = s.coupleAptId): string | null {
  const fam = famId ? s.apartments.find((a) => a.id === famId) : undefined;
  const cou = coupId ? s.apartments.find((a) => a.id === coupId) : undefined;
  if (!fam || !cou || fam.area === cou.area) return null;
  return `${coupleNames(s)}'s place is in ${areaById(s, cou.area).name}, the family is in ${areaById(s, fam.area).name}.`;
}

const TOUR_NAMES: [RegExp, string][] = [
  [/teide|crater|roques/i, "Teide"],
  [/laguna|santa cruz|north/i, "the north"],
  [/masca/i, "Masca"],
  [/garachico|icod/i, "Garachico"],
  [/loro/i, "Loro Parque"],
];

const listJoin = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/** What changes without a car: car trips become tours, the late arrival needs a taxi. */
export function noCarImpact(s: TripState, areaId = s.planningArea) {
  const b = s.budget;
  const tours = s.days.flatMap((d) => d.items.filter((i) => i.carTour).map((i) => ({ i, d })));
  const places = [
    ...new Set(
      tours.map(({ i, d }) => TOUR_NAMES.find(([re]) => re.test(i.text) || re.test(d.title))?.[1] ?? i.text),
    ),
  ];
  const tourExtra = tours.reduce((x, { i }) => x + (b.tourPrice - i.cost) * i.people, 0);
  const taxiExtra = areaById(s, areaId).minivan * 0.6;
  const late = s.travellers.filter((t) => /arriv/i.test(t.note)).map((t) => t.name);
  return {
    places: listJoin(places),
    tourExtra,
    taxiExtra,
    lateNames: late.length ? listJoin(late) : "the late arrival",
    carSaved: b.carDays * (b.carRate + b.fuelRate),
  };
}

/**
 * Change the planning area. Transfers follow where the family stays, so a family place
 * in use elsewhere is switched off. Pure: returns the new fields and a message for the user.
 */
export function choosePlanningArea(
  s: Pick<TripState, "apartments" | "areas">,
  cur: { familyAptId: string | null },
  areaId: string,
): { planningArea: string; familyAptId: string | null; message: string | null } {
  const fam = cur.familyAptId ? s.apartments.find((a) => a.id === cur.familyAptId) : undefined;
  if (fam && fam.area !== areaId) {
    const area = s.areas.find((a) => a.id === areaId)?.name ?? areaId;
    return {
      planningArea: areaId,
      familyAptId: null,
      message: `${fam.name} is no longer in the budget because you're planning around ${area}.`,
    };
  }
  return { planningArea: areaId, familyAptId: cur.familyAptId, message: null };
}
