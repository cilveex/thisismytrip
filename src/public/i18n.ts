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
  "flights.leave": "Leave the apartment",
  "flights.departs": "Departs",
  "flights.lands": "Lands",
  "flights.landsIn": "Lands in {airport}",
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
  "cal.meet": "Meet at {airport} airport",
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
  "budget.total": "Total for {people}: {amount}",
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

/** Latvian: add strings here. Missing keys show the English text. */
const lv: Partial<Record<Key, string>> = {};

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
