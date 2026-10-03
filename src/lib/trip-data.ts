export type Walk = "little" | "some" | "lots";
export type Who = "family" | "couple";
export type Status = "idea" | "shortlisted" | "booked" | "no";

export interface Area {
  id: string;
  name: string;
  driveMin: number;
  km: number;
  score: number;
  description: string;
  pros: string;
  cons: string;
  family: number;
  couple: number;
  minivan: number;
  lat: number;
  lng: number;
}

export interface Apartment {
  id: string;
  name: string;
  url: string;
  who: Who;
  area: string;
  total: number | null;
  walkMin: number | null;
  floor: string;
  notes: string;
  status: Status;
  /** Exact spot, set in the planner by tapping the map or pasting a Google Maps link */
  lat: number | null;
  lng: number | null;
  address: string;
  /** Included on the public family page */
  showToFamily: boolean;
}

export interface Item {
  id: string;
  text: string;
  walk: Walk;
  cost: number;
  people: number;
  /** Needs a car; becomes an organised tour when there is no car */
  carTour?: boolean;
}

export interface Day {
  date: string;
  label: string;
  title: string;
  items: Item[];
  /** Short public description for the family page */
  lv: string;
  en: string;
}

export interface Flight {
  number: string;
  airline: string;
  from: string;
  to: string;
  /** Local wall-clock time at that airport, "YYYY-MM-DDTHH:mm" ("" if not set). No time-zone conversion. */
  depart: string;
  arrive: string;
  /** Meet at the airport this many minutes before departure */
  meetBeforeMin: number;
}

export interface Flights {
  outbound: Flight;
  /** transferMin: apartment → airport, so we can say when to leave */
  return: Flight & { transferMin: number };
}

export interface GoodToKnow {
  id: string;
  lv: string;
  en: string;
}

export interface Traveller {
  id: string;
  name: string;
  apt: Who;
  note: string;
}

export interface Budget {
  poolPerPerson: number;
  flights: number;
  carRate: number;
  fuelRate: number;
  carDays: number;
  useCar: boolean;
  foodPerDay: number;
  mobility: number;
  bufferPct: number;
  tourPrice: number;
  /** Budget line key → confirmed (true) or estimate (missing/false) */
  confirmed: Record<string, boolean>;
}

export interface TripState {
  travellers: Traveller[];
  areas: Area[];
  planningArea: string;
  apartments: Apartment[];
  familyAptId: string | null;
  coupleAptId: string | null;
  budget: Budget;
  days: Day[];
  ideas: Item[];
  notes: string;
  flights: Flights;
  goodToKnow: GoodToKnow[];
}

export const NIGHTS = 7;
export const DEPARTURE = "2026-12-08";
export const TRIP_ID = "tenerife-2026";
/** Family-facing copy of the trip; readable by anyone, written only by the planner */
export const PUBLIC_TRIP_ID = "tenerife-2026-public";

export const DEFAULT_DAY_LV = "Pastaigājam, ēdam un atpūšamies pie okeāna.";
export const DEFAULT_DAY_EN = "Walk a bit, eat and rest by the ocean.";

export const uid = () => Math.random().toString(36).slice(2, 10);

const it = (text: string, walk: Walk, cost = 0, people = 7, carTour = false): Item => ({
  id: uid(),
  text,
  walk,
  cost,
  people,
  ...(carTour ? { carTour } : {}),
});

export const SIGHTS = [
  { name: "TFS airport", lat: 28.0445, lng: -16.5725, kind: "airport" },
  { name: "Mount Teide", lat: 28.2724, lng: -16.6425, kind: "peak" },
  { name: "Siam Park", lat: 28.0723, lng: -16.7262, kind: "sight" },
  { name: "Loro Parque", lat: 28.4084, lng: -16.5642, kind: "sight" },
  { name: "Masca viewpoint", lat: 28.306, lng: -16.841, kind: "sight" },
  { name: "La Laguna", lat: 28.4874, lng: -16.3159, kind: "sight" },
  { name: "Santa Cruz", lat: 28.4636, lng: -16.2518, kind: "sight" },
  { name: "Garachico", lat: 28.373, lng: -16.764, kind: "sight" },
] as const;

const blankFlight = (from: string, to: string): Flight => ({
  number: "",
  airline: "",
  from,
  to,
  depart: "",
  arrive: "",
  meetBeforeMin: 90,
});

export const defaultFlights = (): Flights => ({
  outbound: blankFlight("RIX", "TFS"),
  return: { ...blankFlight("TFS", "RIX"), transferMin: 30 },
});

const dayDefaults = (days: Omit<Day, "lv" | "en">[]): Day[] =>
  days.map((d) => ({ ...d, lv: DEFAULT_DAY_LV, en: DEFAULT_DAY_EN }));

export function seedState(): TripState {
  return {
    travellers: [
      { id: uid(), name: "Mom", apt: "family", note: "" },
      { id: uid(), name: "Mom's sister", apt: "family", note: "" },
      { id: uid(), name: "Grandma", apt: "family", note: "85, can't walk much" },
      { id: uid(), name: "Grandma's sister", apt: "family", note: "" },
      { id: uid(), name: "Kid", apt: "family", note: "10 years old" },
      { id: uid(), name: "Alvis", apt: "couple", note: "" },
      { id: uid(), name: "Lera", apt: "couple", note: "Arrives 9 Dec" },
    ],
    areas: [
      { id: "los-cristianos", name: "Los Cristianos", driveMin: 20, km: 20, score: 5, description: "Flat promenade, calm beach, harbour for boat trips, many older visitors.", pros: "Flat promenade · calm beach · boat harbour", cons: "Busy; some apartments uphill", family: 170, couple: 90, minivan: 55, lat: 28.051, lng: -16.7166 },
      { id: "costa-adeje", name: "Costa Adeje", driveMin: 25, km: 28, score: 4, description: "Smooth seafront path Fañabé – Playa del Duque, near Siam Park.", pros: "Smooth seafront path · near Siam Park", cons: "Pricier; hotels on slopes", family: 210, couple: 110, minivan: 65, lat: 28.088, lng: -16.738 },
      { id: "las-americas", name: "Playa de las Américas", driveMin: 22, km: 22, score: 3, description: "Flat and central, between Los Cristianos and Costa Adeje.", pros: "Flat · central", cons: "Loud at night", family: 180, couple: 95, minivan: 60, lat: 28.062, lng: -16.73 },
      { id: "golf-del-sur", name: "Golf del Sur & Amarilla", driveMin: 10, km: 9, score: 3, description: "Quiet resort, the closest area to the airport.", pros: "Quiet · closest to airport", cons: "Little within walking distance", family: 150, couple: 80, minivan: 35, lat: 28.028, lng: -16.612 },
      { id: "el-medano", name: "El Médano", driveMin: 10, km: 9, score: 3, description: "Authentic surf town with a long sandy beach.", pros: "Authentic town · sandy beach", cons: "Very windy", family: 150, couple: 85, minivan: 35, lat: 28.045, lng: -16.537 },
      { id: "los-gigantes", name: "Los Gigantes / Puerto de Santiago", driveMin: 45, km: 55, score: 2, description: "Huge sea cliffs on the west coast.", pros: "Spectacular cliffs · sunsets", cons: "Steep streets everywhere", family: 140, couple: 75, minivan: 110, lat: 28.244, lng: -16.84 },
      { id: "puerto-de-la-cruz", name: "Puerto de la Cruz", driveMin: 75, km: 95, score: 3, description: "Green north, old town, next to Loro Parque.", pros: "Old town · Loro Parque · lush", cons: "Cloudier in December; long transfer", family: 130, couple: 70, minivan: 170, lat: 28.414, lng: -16.549 },
    ],
    planningArea: "los-cristianos",
    apartments: [],
    familyAptId: null,
    coupleAptId: null,
    budget: {
      poolPerPerson: 1000,
      flights: 3000,
      carRate: 65,
      fuelRate: 10,
      carDays: 5,
      useCar: true,
      foodPerDay: 30,
      mobility: 70,
      bufferPct: 5,
      tourPrice: 55,
      confirmed: {},
    },
    days: dayDefaults([
      { date: "2026-12-08", label: "Tue 8", title: "Arrive and settle in", items: [it("Flight Riga → TFS", "some", 0, 6), it("Minivan taxi to apartments", "little", 0, 6), it("Supermarket run", "some", 0, 2)] },
      { date: "2026-12-09", label: "Wed 9", title: "Slow beach day, Lera arrives", items: [it("Promenade and beach", "little"), it("Collect Lera at TFS and pick up the rental car", "little", 0, 1)] },
      { date: "2026-12-10", label: "Thu 10", title: "Teide National Park by car", items: [it("Drive to crater viewpoints", "little", 0, 7, true), it("Roques de García short flat path", "some"), it("Warm jackets — 5–10 °C up there", "little", 0, 7)] },
      { date: "2026-12-11", label: "Fri 11", title: "Whale and dolphin boat", items: [it("2–3 h catamaran", "little", 35, 7)] },
      { date: "2026-12-12", label: "Sat 12", title: "Kid's day", items: [it("Siam Park", "lots", 45, 3), it("Grandmas rest at café / pool", "little", 0, 4)] },
      { date: "2026-12-13", label: "Sun 13", title: "North side and Christmas lights", items: [it("La Laguna old town", "some", 0, 7, true), it("Santa Cruz Christmas lights", "some")] },
      { date: "2026-12-14", label: "Mon 14", title: "Masca and farewell dinner", items: [it("Masca viewpoint drive", "little", 0, 7, true), it("Return the car", "little", 0, 1), it("Farewell dinner", "little", 40, 7)] },
      { date: "2026-12-15", label: "Tue 15", title: "Fly home", items: [it("Fly TFS → Riga", "some", 0, 7)] },
    ]),
    ideas: [
      it("Loro Parque (ask about wheelchair hire)", "lots", 45, 7),
      it("Teide cable car (not for grandma — altitude)", "some", 45, 3),
      it("Garachico & Icod dragon tree", "some", 5, 7),
      it("Candelaria basilica", "little", 0, 7),
      it("Los Gigantes cliffs boat", "little", 30, 7),
      it("Playa del Duque promenade lunch", "little", 0, 7),
      it("Pirámides de Güímar", "some", 20, 7),
    ],
    notes: [
      "• Family apartment: ground floor or a lift.",
      "• Walk between the two apartments under 10 minutes on flat ground.",
      "• Ask grandma's doctor about Teide altitude (~2,300 m on the park road).",
      "• Travel insurance and EHIC cards for everyone.",
    ].join("\n"),
    flights: defaultFlights(),
    goodToKnow: [],
  };
}

/** "Tue 8" + "2026-12-08" → "Tue 8 Dec" */
export const dayName = (label: string, date: string) =>
  `${label} ${new Date(date + "T12:00:00").toLocaleString("en-GB", { month: "short" })}`;

export function areaById(s: TripState, id: string): Area {
  return s.areas.find((a) => a.id === id) ?? s.areas[0] ?? seedState().areas[0]!;
}

export function guessArea(text: string, areas: Area[]): string | null {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const keys: Record<string, string[]> = {
    "los-cristianos": ["cristianos"],
    "costa-adeje": ["adeje", "fanabe", "duque", "torviscas"],
    "las-americas": ["americas"],
    "golf-del-sur": ["golf del sur", "golf-del-sur", "amarilla", "san miguel"],
    "el-medano": ["medano"],
    "los-gigantes": ["gigantes", "santiago", "arena"],
    "puerto-de-la-cruz": ["puerto de la cruz", "puerto-de-la-cruz", "puertodelacruz"],
  };
  for (const a of areas) if ((keys[a.id] ?? []).some((k) => t.includes(k))) return a.id;
  return null;
}

const ROMAN = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)$/i;

/** "harbour-club-ii" → "Harbour Club II" */
function titleFromSlug(slug: string) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => (ROMAN.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Best-effort listing name from a Booking.com or Airbnb URL ("" if unknown). */
export function nameFromLink(url: string): string {
  const b = url.match(/booking\.com\/hotel\/[a-z]{2}\/([^.?/#]+)/i);
  if (b?.[1]) return titleFromSlug(decodeURIComponent(b[1]));
  const a = url.match(/airbnb\.[a-z.]+\/rooms\/(?:plus\/)?(\d+)/i);
  if (a?.[1]) return `Airbnb ${a[1]}`;
  return "";
}

/** Fill gaps in a stored state with seed defaults so older rows keep working after the model grows. */
export function normalizeState(raw: Partial<TripState> | null | undefined): TripState {
  const seed = seedState();
  if (!raw) return seed;
  const fl = (raw.flights ?? {}) as Partial<Flights>;
  return {
    ...seed,
    ...raw,
    budget: { ...seed.budget, ...(raw.budget ?? {}), confirmed: { ...(raw.budget?.confirmed ?? {}) } },
    areas: raw.areas?.length ? raw.areas : seed.areas,
    days: raw.days?.length
      ? raw.days.map((d: Partial<Day>) => ({ lv: DEFAULT_DAY_LV, en: DEFAULT_DAY_EN, ...d, items: d.items ?? [] }) as Day)
      : seed.days,
    // Saved rows may predate newer fields, so treat each one as partial and fill the gaps
    apartments: (raw.apartments ?? []).map((a: Partial<Apartment>) => ({
      url: "",
      walkMin: null,
      floor: "",
      notes: "",
      status: "idea" as Status,
      lat: null,
      lng: null,
      address: "",
      showToFamily: false,
      ...a,
    }) as Apartment),
    ideas: raw.ideas ?? seed.ideas,
    travellers: raw.travellers ?? seed.travellers,
    flights: {
      outbound: { ...seed.flights.outbound, ...(fl.outbound ?? {}) },
      return: { ...seed.flights.return, ...(fl.return ?? {}) },
    },
    goodToKnow: raw.goodToKnow ?? [],
  };
}
