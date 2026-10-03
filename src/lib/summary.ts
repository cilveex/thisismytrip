import { aptTotal, computeBudget, coupleNames, eur, itemCost, leftLabel, noCarImpact, splitStayWarning } from "./budget";
import { NIGHTS, areaById, dayName, type Flight, type TripState, type Who } from "./trip-data";
import { formatLocal, leaveAt, meetAt } from "./flights";

/** WhatsApp treats * _ ~ ` as formatting, and some clients render # and > — strip them from user text. */
const clean = (t: string) =>
  t
    .replace(/~\s*(?=\d)/g, "about ") // "~2,300 m" keeps its meaning
    .replace(/[*_~`]/g, "")
    .replace(/^[#>]+\s*/gm, "")
    .trim();

const walkText = { little: "", some: "some walking", lots: "lots of walking" } as const;

/** Plain-text trip summary for pasting into WhatsApp. No markdown symbols. */
export function tripSummary(s: TripState): string {
  const b = computeBudget(s);
  const people = s.travellers.length;
  const lines: string[] = [];
  const add = (...l: string[]) => lines.push(...l);

  add("Tenerife, 8–15 December 2026", `${people} travellers, ${NIGHTS} nights`, "");

  add(
    `Budget: ${leftLabel(b.left)}`,
    `${eur(b.total)} planned, pool ${eur(b.pool)} (${eur(s.budget.poolPerPerson)} each)`,
    `Per person: ${eur(b.perPerson)}`,
    "",
  );

  const flight = (label: string, f: Flight) => {
    if (!f.depart && !f.number) return;
    const name = [f.airline, f.number].filter(Boolean).join(" ");
    add(`${label}: ${[name, `${f.from} → ${f.to}`].filter(Boolean).join(", ")}`);
    if (f.depart) add(`Departs ${formatLocal(f.depart)}${f.arrive ? `, arrives ${formatLocal(f.arrive)}` : ""} (local times)`);
    if (meetAt(f)) add(`Meet at the airport ${formatLocal(meetAt(f))}`);
  };
  if (s.flights.outbound.depart || s.flights.return.depart || s.flights.outbound.number) {
    add("FLIGHTS");
    flight("There", s.flights.outbound);
    flight("Home", s.flights.return);
    if (leaveAt(s.flights.return)) add(`Leave the apartment ${formatLocal(leaveAt(s.flights.return))}`);
    for (const n of s.flights.notes) {
      const who = s.travellers.find((x) => x.id === n.travellerId)?.name;
      const text = clean(n.en || n.lv);
      if (text) add(`${who ? `${clean(who)}: ` : ""}${text}`);
    }
    add("");
  }

  add("STAY", `Planning around ${areaById(s, s.planningArea).name}`);
  const place = (who: Who, label: string) => {
    const id = who === "family" ? s.familyAptId : s.coupleAptId;
    const apt = id ? s.apartments.find((a) => a.id === id) : undefined;
    const total = eur(aptTotal(s, id, who, s.planningArea));
    if (!apt) return add(`${label}: not chosen yet (estimate ${total})`);
    add(`${label}: ${clean(apt.name)}, ${areaById(s, apt.area).name}, ${total} for ${NIGHTS} nights`);
    if (apt.url) add(apt.url);
  };
  place("family", "Family");
  place("couple", coupleNames(s));
  const split = splitStayWarning(s);
  if (split) add(`Note: ${split}`);
  add("");

  if (s.budget.useCar) {
    add(`Car: ${s.budget.carDays} days, ${eur(s.budget.carDays * (s.budget.carRate + s.budget.fuelRate))} with fuel`);
  } else {
    const n = noCarImpact(s);
    add(`No car: ${n.places} as organised tours, airport taxi for ${n.lateNames}`);
  }
  add("");

  add("DAYS");
  for (const d of s.days) {
    add(`${dayName(d.label, d.date)}: ${clean(d.title)}`);
    for (const it of d.items) {
      if (!clean(it.text)) continue;
      const bits: string[] = [];
      if (it.carTour && !s.budget.useCar) bits.push("tour");
      if (walkText[it.walk]) bits.push(walkText[it.walk]);
      const cost = itemCost(it, s);
      if (cost > 0) bits.push(it.people === people ? `${eur(cost)} total` : `${eur(cost)} for ${it.people}`);
      add(`• ${clean(it.text)}${bits.length ? ` (${bits.join(", ")})` : ""}`);
    }
    add("");
  }

  add("TRAVELLERS");
  for (const t of s.travellers) add(`• ${clean(t.name)}${clean(t.note) ? `, ${clean(t.note)}` : ""}`);

  const notes = clean(s.notes);
  if (notes) add("", "NOTES", notes);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
