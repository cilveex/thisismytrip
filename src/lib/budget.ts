import { NIGHTS, areaById, type Item, type TripState, type Who } from "./trip-data";

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

/** "€1 234" — whole euros, space as thousands separator, sign dropped (use leftLabel for direction). */
export const eur = (n: number) => "€" + Math.round(Math.abs(n)).toLocaleString("en-US").replace(/,/g, " ");

export const leftLabel = (left: number) => (left >= 0 ? `${eur(left)} left` : `${eur(left)} over`);
