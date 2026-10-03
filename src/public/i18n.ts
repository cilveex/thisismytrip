import { createContext, useContext } from "react";

export type Lang = "lv" | "en";

/**
 * All interface text for the public page. English is complete; Latvian falls back to English
 * key by key until it's filled in. Plurals: `key_one` / `key_other` (+ `key_zero` for Latvian).
 * Placeholders: {name}.
 */
const en = {
  "skip": "Skip to content",
  "nav.label": "Sections",
  "nav.flights": "Flights",
  "nav.stay": "Stay",
  "nav.days": "Days",
  "nav.budget": "Budget",
  "nav.info": "Good to know",
  "lang.label": "Language",

  "status.loading": "Loading…",
  "status.error": "Couldn't load the trip. Check your internet connection and try again.",
  "status.empty": "The trip details will appear here soon.",

  "hero.kicker": "Our family trip",
  "hero.title": "Tenerife",
  "hero.days_one": "{n} day to go",
  "hero.days_other": "{n} days to go",
  "hero.today": "We fly today!",
  "hero.during": "We're in Tenerife!",
  "hero.after": "Welcome home!",
  "hero.people_one": "{n} person",
  "hero.people_other": "{n} people",
  "hero.nights_one": "{n} night",
  "hero.nights_other": "{n} nights",

  "flights.title": "Flights",
  "flights.tzNote": "Tenerife is 2 hours behind Riga. Every time below is the local time at that place.",
  "flights.there": "There",
  "flights.back": "Back",
  "flights.meetAt": "Meet at {airport} airport",
  "meet.RIX": "Meet at Riga airport",
  "meet.TFS": "Meet at Tenerife South airport",
  "meet.TFN": "Meet at Tenerife North airport",
  "flights.leave": "Leave the apartment",
  "flights.departs": "Departs",
  "flights.lands": "Lands",
  "flights.landsIn": "Lands in {airport}",
  "landsIn.RIX": "Lands in Riga",
  "landsIn.TFS": "Lands in Tenerife",
  "landsIn.TFN": "Lands in Tenerife",
  "flights.otherFlights": "On a different flight",
  "flights.notYet": "The times will appear here once the flights are booked.",
  "flights.addCal": "Add to calendar",
  "flights.calHint": "Downloads a calendar file with both flights and the meeting times.",
  "tz.RIX": "Riga time",
  "tz.TFS": "Tenerife time",
  "tz.TFN": "Tenerife time",
  "tz.other": "local time",
  "airport.RIX": "Riga",
  "airport.TFS": "Tenerife South",
  "airport.TFN": "Tenerife North",
  "cal.flight": "Flight {from} → {to}",
  "cal.leave": "Leave the apartment for the airport",
  "cal.file": "tenerife-flights.ics",

  "stay.title": "Where we stay",
  "stay.considering": "Places we're considering",
  "stay.notBooked": "Nothing is booked yet. These are the places we're looking at.",
  "stay.none": "We'll add the places here soon.",
  "stay.booked": "Booked",
  "stay.maybe": "Considering",
  "stay.who": "Staying here",
  "stay.address": "Address",
  "stay.maps": "Open in Google Maps",
  "stay.listing": "See the listing",
  "stay.walk_one": "{n} minute walk to the other apartment",
  "stay.walk_other": "{n} minute walk to the other apartment",
  "stay.mapLabel": "Map of the places where we stay",
  "stay.mapHint": "Use two fingers to move the map.",

  "days.title": "Day by day",
  "days.travel": "Travel day",

  "budget.title": "Budget",
  "budget.perPerson": "per person",
  "budget.totalFor_one": "Total for {n} person: {amount}",
  "budget.totalFor_other": "Total for {n} people: {amount}",
  "budget.pool": "Each of us puts in {amount}.",
  "budget.confirmed": "Confirmed",
  "budget.estimate": "Estimate",
  "budget.note": "Estimates may still change.",
  "budget.breakdown": "What the money is for",
  "cat.flights": "Flights",
  "cat.family": "Family apartment",
  "cat.couple": "{names}'s apartment",
  "cat.car": "Rental car and fuel",
  "cat.transfers": "Airport taxis",
  "cat.food": "Food",
  "cat.activities": "Trips and tickets",
  "cat.mobility": "Wheelchair or scooter",
  "cat.buffer": "Safety margin",

  "info.title": "Good to know",

  "footer.planner": "Planner",
  "footer.updated": "Updated {date}",
  "and": "and",
} as const;

export type Key = keyof typeof en;

/**
 * Latvian. Written for older readers: plain words, polite plural "jūs" forms where we address
 * the reader, and Latvian grammar handled by whole phrases rather than gluing words together.
 * Missing keys would show the English text.
 *
 * Plurals: Latvian uses the "_one" form for numbers ending in 1 except 11 (1, 21, 31 diena)
 * and "_other" for everything else (2, 10, 11, 66 dienas).
 */
const lv: Partial<Record<Key, string>> = {
  "skip": "Pāriet uz saturu",
  "nav.label": "Sadaļas",
  "nav.flights": "Lidojumi",
  "nav.stay": "Kur dzīvosim",
  "nav.days": "Dienas",
  "nav.budget": "Izmaksas",
  "nav.info": "Der zināt",
  "lang.label": "Valoda",

  "status.loading": "Ielādē…",
  "status.error": "Neizdevās ielādēt ceļojuma informāciju. Pārbaudiet interneta savienojumu un mēģiniet vēlreiz.",
  "status.empty": "Ceļojuma informācija šeit parādīsies pavisam drīz.",

  "hero.kicker": "Mūsu ģimenes ceļojums",
  "hero.title": "Tenerife",
  "hero.days_one": "Vēl {n} diena",
  "hero.days_other": "Vēl {n} dienas",
  "hero.today": "Šodien lidojam!",
  "hero.during": "Esam Tenerifē!",
  "hero.after": "Esam atpakaļ mājās!",
  "hero.people_one": "{n} cilvēks",
  "hero.people_other": "{n} cilvēki",
  "hero.nights_one": "{n} nakts",
  "hero.nights_other": "{n} naktis",

  "flights.title": "Lidojumi",
  "flights.tzNote": "Tenerifē pulkstenis rāda par 2 stundām mazāk nekā Rīgā. Visi laiki zemāk ir norādīti pēc vietējā pulksteņa.",
  "flights.there": "Turp",
  "flights.back": "Atpakaļ",
  "flights.meetAt": "Tikšanās lidostā {airport}",
  "meet.RIX": "Tikšanās Rīgas lidostā",
  "meet.TFS": "Tikšanās Tenerifes dienvidu lidostā",
  "meet.TFN": "Tikšanās Tenerifes ziemeļu lidostā",
  "flights.leave": "Izbraucam no dzīvokļa",
  "flights.departs": "Izlidošana",
  "flights.lands": "Nolaišanās",
  "flights.landsIn": "Nolaišanās: {airport}",
  "landsIn.RIX": "Nolaišanās Rīgā",
  "landsIn.TFS": "Nolaišanās Tenerifē",
  "landsIn.TFN": "Nolaišanās Tenerifē",
  "flights.otherFlights": "Lido ar citu reisu",
  "flights.notYet": "Laiki šeit parādīsies, kad biļetes būs nopirktas.",
  "flights.addCal": "Pievienot kalendāram",
  "flights.calHint": "Lejupielādē kalendāra failu ar abiem lidojumiem un tikšanās laikiem.",
  "tz.RIX": "Rīgas laiks",
  "tz.TFS": "Tenerifes laiks",
  "tz.TFN": "Tenerifes laiks",
  "tz.other": "vietējais laiks",
  "airport.RIX": "Rīga",
  "airport.TFS": "Tenerife (dienvidi)",
  "airport.TFN": "Tenerife (ziemeļi)",
  "cal.flight": "Lidojums {from} → {to}",
  "cal.leave": "Izbraucam no dzīvokļa uz lidostu",
  "cal.file": "tenerife-lidojumi.ics",

  "stay.title": "Kur dzīvosim",
  "stay.considering": "Vietas, ko apsveram",
  "stay.notBooked": "Vēl nekas nav rezervēts. Šīs ir vietas, ko pašlaik apskatām.",
  "stay.none": "Naktsmītnes šeit pievienosim drīzumā.",
  "stay.booked": "Rezervēts",
  "stay.maybe": "Apsveram",
  "stay.who": "Šeit dzīvos",
  "stay.address": "Adrese",
  "stay.maps": "Atvērt Google Maps",
  "stay.listing": "Skatīt sludinājumu",
  "stay.walk_one": "{n} minūtes gājiens līdz otram dzīvoklim",
  "stay.walk_other": "{n} minūšu gājiens līdz otram dzīvoklim",
  "stay.mapLabel": "Karte ar vietām, kur dzīvosim",
  "stay.mapHint": "Lai pārvietotu karti, izmantojiet divus pirkstus.",

  "days.title": "Pa dienām",
  "days.travel": "Lidojuma diena",

  "budget.title": "Izmaksas",
  "budget.perPerson": "katram",
  "budget.totalFor_one": "Kopā {n} cilvēkam: {amount}",
  "budget.totalFor_other": "Kopā {n} cilvēkiem: {amount}",
  "budget.pool": "Katrs iemaksā {amount}.",
  "budget.confirmed": "Precīzi",
  "budget.estimate": "Aptuveni",
  "budget.note": "Aptuvenās summas vēl var mainīties.",
  "budget.breakdown": "Kam paredzēta nauda",
  "cat.flights": "Lidojumi",
  "cat.family": "Ģimenes dzīvoklis",
  "cat.couple": "Dzīvoklis: {names}",
  "cat.car": "Mašīnas noma un degviela",
  "cat.transfers": "Taksometri uz lidostu un atpakaļ",
  "cat.food": "Ēdiens",
  "cat.activities": "Ekskursijas un biļetes",
  "cat.mobility": "Ratiņkrēsls vai elektriskais skūteris",
  "cat.buffer": "Rezerve neparedzētiem tēriņiem",

  "info.title": "Der zināt",

  "footer.planner": "Plānotājs",
  "footer.updated": "Atjaunināts: {date}",
  "and": "un",
};

const dict: Record<Lang, Partial<Record<Key, string>>> = { en, lv };

export const LOCALE: Record<Lang, string> = { lv: "lv-LV", en: "en-GB" };

function plural(lang: Lang, n: number): "zero" | "one" | "other" {
  if (lang === "lv") {
    if (n === 0) return "zero";
    return n % 10 === 1 && n % 100 !== 11 ? "one" : "other";
  }
  return n === 1 ? "one" : "other";
}

function fill(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>) {
  return fill(dict[lang][key] ?? en[key], vars);
}

/** Plural-aware: pass the base key without the suffix, e.g. tn("hero.days", 5). */
export function translatePlural(lang: Lang, base: string, n: number, vars?: Record<string, string | number>) {
  const form = plural(lang, n);
  const keys = [`${base}_${form}`, `${base}_other`] as Key[];
  const k = keys.find((x) => dict[lang][x] ?? en[x as Key]) ?? keys[1]!;
  return translate(lang, k, { n, ...vars });
}

export interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  tn: (base: string, n: number, vars?: Record<string, string | number>) => string;
  locale: string;
}

export const I18nCtx = createContext<I18n | null>(null);

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside I18nProvider");
  return c;
}

/** For keys built at runtime, e.g. `tz.${airport}` */
export const isKey = (k: string): k is Key => k in en;
