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
  "nav.why": "Why here",
  "fav.label": "Our favourite",
  "filter.label": "Show only favourites and booked",
  "filter.count": "{n} of {total}",
  "filter.none": "No favourite or booked places yet. Switch the filter off to see all of them.",
  "legend.booked": "Booked",
  "why.title": "Why here",
  "area.photos": "Photos of the area",
  "area.cover": "Los Gigantes and Puerto de Santiago, photo {i} of {n}: {alt}",
  "area.thumbs": "Photo thumbnails",
  "area.open": "Open photo {i} of {n}: {alt}",
  "area.counter": "{i} / {n}",
  "area.close": "Close photos",
  "area.prev": "Previous photo",
  "area.next": "Next photo",
  "pass.flight": "Flight",
  "pass.date": "Date",
  "pass.route": "{from} to {to}",
  "lug.title": "Luggage",
  "lug.perPerson": "For each person",
  "lug.personal": "1 personal item",
  "lug.cabin": "1 cabin bag",
  "lug.size": "{size} cm",
  "lug.weight": "Total combined weight: {kg} kg",
  "lug.tip": "Weigh your bags at home before you leave",
  "flights.tzNote": "Tenerife is 2 hours behind Riga: when it's 12:00 in Riga, it's 10:00 in Tenerife.",
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
  "calMeet.TFS": "Meet at Tenerife airport",
  "calMeet.TFN": "Meet at Tenerife airport",
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
  "stay.drive_one": "About {n} minute drive from the airport",
  "stay.drive_other": "About {n} minute drive from the airport",
  "stay.details": "Photos and details",
  "stay.noPhotos": "No photos yet",
  "stay.sea_one": "{n} minute walk to the sea",
  "stay.sea_other": "{n} minute walk to the sea",
  "stay.bedrooms_one": "{n} bedroom",
  "stay.bedrooms_other": "{n} bedrooms",
  "stay.sleeps_one": "Sleeps {n} person",
  "stay.sleeps_other": "Sleeps {n} people",
  "stay.floor": "Floor / lift: {v}",
  "stay.totalFor_one": "{amount} for {n} night",
  "stay.totalFor_other": "{amount} for {n} nights",
  "stay.perPerson": "{amount} per person",
  "stay.nights_one": "for {n} night",
  "stay.nights_other": "for {n} nights",
  "stay.approx": "about {amount}",
  "stay.cards": "Places. Swipe sideways to see the others.",
  "stay.list": "Places",
  "stay.cardsHint": "Swipe the cards sideways. Use two fingers to move the map.",
  "stay.legend": "Pin colours",
  "group.family": "Family",
  "group.couple": "Couple",
  "group.people_one": "{n} person",
  "group.people_other": "{n} people",

  "compare.open": "Compare options",
  "compare.title": "Compare options",
  "compare.close": "Close",
  "compare.tabs": "Who it's for",
  "compare.place": "Place",
  "compare.who": "Who it's for",
  "compare.perPerson": "Per person",
  "compare.bedrooms": "Bedrooms",
  "compare.sleeps": "Sleeps",
  "compare.floor": "Floor / lift",
  "compare.sea": "Walk to the sea",
  "compare.other": "Walk to the other place",
  "compare.drive": "Drive from the airport",
  "compare.status": "Status",
  "compare.min": "{n} min",
  "compare.people_one": "{n} person",
  "compare.people_other": "{n} people",
  "compare.cheapest": "Cheapest",
  "compare.shortest": "Shortest",
  "compare.most": "Most",
  "compare.estimate": "≈ estimated price — the exact price isn't known yet.",
  "compare.swipe": "Swipe the table sideways to see all places.",
  "compare.open1": "Photos and details: {name}",
  "compare.empty": "Not filled in yet",

  "price.title": "Price",
  "price.total_one": "Total for {n} night",
  "price.total_other": "Total for {n} nights",
  "price.perNight": "Per night",
  "price.perPerson_one": "Per person ({n} person)",
  "price.perPerson_other": "Per person ({n} people)",
  "price.estimate": "Estimated price — the exact price isn't known yet.",
  "price.trip": "With this option the trip costs {amount} per person.",

  "map.airport": "Tenerife South airport",
  "map.showAirport": "Show airport",
  "map.placesOnly": "Back to the places",
  "map.toAirport": "Airport {n} min",
  "map.toAirportShort": "Airport",
  "map.zoomHint": "Hold {key} and scroll to zoom",

  "place.counter": "{i} of {n}",
  "place.prev": "Previous place",
  "place.next": "Next place",
  "place.close": "Close",
  "place.photoPrev": "Previous photo",
  "place.photoNext": "Next photo",
  "place.photo": "{name}, photo {i} of {n}",
  "place.openBooking": "Open on Booking",
  "place.openAirbnb": "Open on Airbnb",
  "place.newTab": "(opens in a new tab)",
  "place.note": "Notes",
  "place.where": "Where it is",
  "place.mapLabel": "Map of {name} and the airport",

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
  "nav.why": "Kāpēc šeit",
  "fav.label": "Mūsu favorīts",
  "filter.label": "Rādīt tikai favorītus un rezervētos",
  "filter.count": "{n} no {total}",
  "filter.none": "Vēl nav favorītu vai rezervētu vietu. Izslēdziet filtru, lai redzētu visas.",
  "legend.booked": "Rezervēts",
  "why.title": "Kāpēc tieši šeit",
  "area.photos": "Apkārtnes fotogrāfijas",
  "area.cover": "Los Gigantes un Puerto de Santiago, {i}. fotogrāfija no {n}: {alt}",
  "area.thumbs": "Fotogrāfiju miniatūras",
  "area.open": "Atvērt {i}. fotogrāfiju no {n}: {alt}",
  "area.counter": "{i} / {n}",
  "area.close": "Aizvērt fotogrāfijas",
  "area.prev": "Iepriekšējā fotogrāfija",
  "area.next": "Nākamā fotogrāfija",
  "pass.flight": "Reiss",
  "pass.date": "Datums",
  "pass.route": "{from} – {to}",
  "lug.title": "Bagāža",
  "lug.perPerson": "Katram cilvēkam",
  "lug.personal": "1 personīgā manta",
  "lug.cabin": "1 rokas bagāža",
  "lug.size": "{size} cm",
  "lug.weight": "Kopējais svars kopā: {kg} kg",
  "lug.tip": "Nosveriet somas mājās pirms izbraukšanas",
  "flights.tzNote": "Tenerifē ir 2 stundas mazāk nekā Rīgā: kad Rīgā ir 12:00, Tenerifē ir 10:00.",
  "flights.there": "Turp",
  "flights.back": "Atpakaļ",
  "flights.meetAt": "Tikšanās lidostā {airport}",
  "meet.RIX": "Tikšanās Rīgas lidostā",
  "meet.TFS": "Tikšanās lidostā",
  "meet.TFN": "Tikšanās lidostā",
  "flights.leave": "Izbraucam no dzīvokļa",
  "flights.departs": "Izlidošana",
  "flights.lands": "Nolaišanās",
  "flights.landsIn": "Nolaišanās: {airport}",
  "landsIn.RIX": "Nolaišanās Rīgā",
  "landsIn.TFS": "Nolaišanās Tenerifē",
  "landsIn.TFN": "Nolaišanās Tenerifē",
  "flights.otherFlights": "Ar citu reisu",
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
  "calMeet.TFS": "Tikšanās Tenerifes lidostā",
  "calMeet.TFN": "Tikšanās Tenerifes lidostā",
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
  "stay.drive_one": "Apmēram {n} minūtes brauciens no lidostas",
  "stay.drive_other": "Apmēram {n} minūšu brauciens no lidostas",
  "stay.details": "Foto un informācija",
  "stay.noPhotos": "Fotogrāfiju vēl nav",
  "stay.sea_one": "{n} minūtes gājiens līdz jūrai",
  "stay.sea_other": "{n} minūšu gājiens līdz jūrai",
  "stay.bedrooms_one": "{n} guļamistaba",
  "stay.bedrooms_other": "{n} guļamistabas",
  "stay.sleeps_one": "Vieta {n} cilvēkam",
  "stay.sleeps_other": "Vietas {n} cilvēkiem",
  "stay.floor": "Stāvs / lifts: {v}",
  "stay.totalFor_one": "{amount} par {n} nakti",
  "stay.totalFor_other": "{amount} par {n} naktīm",
  "stay.perPerson": "{amount} katram",
  "stay.nights_one": "par {n} nakti",
  "stay.nights_other": "par {n} naktīm",
  "stay.approx": "apmēram {amount}",
  "stay.cards": "Vietas. Pavelciet uz sāniem, lai redzētu pārējās.",
  "stay.list": "Vietas",
  "stay.cardsHint": "Pavelciet kartītes uz sāniem. Karti var pārvietot ar diviem pirkstiem.",
  "stay.legend": "Ko nozīmē krāsas",
  "group.family": "Ģimene",
  "group.couple": "Pāris",
  "group.people_one": "{n} cilvēks",
  "group.people_other": "{n} cilvēki",

  "compare.open": "Salīdzināt variantus",
  "compare.title": "Variantu salīdzinājums",
  "compare.close": "Aizvērt",
  "compare.tabs": "Kam paredzēts",
  "compare.place": "Vieta",
  "compare.who": "Kam paredzēts",
  "compare.perPerson": "Katram",
  "compare.bedrooms": "Guļamistabas",
  "compare.sleeps": "Cik cilvēkiem",
  "compare.floor": "Stāvs / lifts",
  "compare.sea": "Līdz jūrai kājām",
  "compare.other": "Līdz otram dzīvoklim kājām",
  "compare.drive": "No lidostas ar mašīnu",
  "compare.status": "Statuss",
  "compare.min": "{n} min",
  "compare.people_one": "{n} cilvēkam",
  "compare.people_other": "{n} cilvēkiem",
  "compare.cheapest": "Lētākais",
  "compare.shortest": "Tuvākais",
  "compare.most": "Visvairāk",
  "compare.estimate": "≈ aptuvena cena — precīza cena vēl nav zināma.",
  "compare.swipe": "Pavelciet tabulu uz sāniem, lai redzētu visas vietas.",
  "compare.open1": "Foto un informācija: {name}",
  "compare.empty": "Vēl nav norādīts",

  "price.title": "Cena",
  "price.total_one": "Kopā par {n} nakti",
  "price.total_other": "Kopā par {n} naktīm",
  "price.perNight": "Par nakti",
  "price.perPerson_one": "Katram ({n} cilvēks)",
  "price.perPerson_other": "Katram ({n} cilvēki)",
  "price.estimate": "Aptuvena cena — precīza cena vēl nav zināma.",
  "price.trip": "Ar šo variantu ceļojums katram izmaksā {amount}.",

  "map.airport": "Tenerifes Dienvidu lidosta",
  "map.showAirport": "Rādīt lidostu",
  "map.placesOnly": "Atpakaļ pie vietām",
  "map.toAirport": "Lidosta {n} min",
  "map.toAirportShort": "Lidosta",
  "map.zoomHint": "Lai tuvinātu, turiet {key} un ritiniet",

  "place.counter": "{i} no {n}",
  "place.prev": "Iepriekšējā vieta",
  "place.next": "Nākamā vieta",
  "place.close": "Aizvērt",
  "place.photoPrev": "Iepriekšējā fotogrāfija",
  "place.photoNext": "Nākamā fotogrāfija",
  "place.photo": "{name}, {i}. fotogrāfija no {n}",
  "place.openBooking": "Atvērt Booking.com",
  "place.openAirbnb": "Atvērt Airbnb",
  "place.newTab": "(atveras jaunā cilnē)",
  "place.note": "Piezīmes",
  "place.where": "Kur tas atrodas",
  "place.mapLabel": "Karte: {name} un lidosta",

  "days.title": "Pa dienām",
  "days.travel": "Lidojuma diena",

  "budget.title": "Izmaksas",
  "budget.perPerson": "katram",
  "budget.totalFor_one": "Kopā {n} cilvēkam: {amount}",
  "budget.totalFor_other": "Kopā {n} cilvēkiem: {amount}",
  "budget.pool": "Katrs iemaksā {amount}.",
  "budget.confirmed": "Zināma cena",
  "budget.estimate": "Aptuvena cena",
  "budget.note": "Aptuvenās summas vēl var mainīties.",
  "budget.breakdown": "Kam paredzēta nauda",
  "cat.flights": "Lidojumi",
  "cat.family": "Ģimenes dzīvoklis",
  "cat.couple": "Alvja un Leras dzīvoklis", // hardcoded: the names won't change
  "cat.car": "Mašīnas noma un degviela",
  "cat.transfers": "Taksometri uz lidostu un atpakaļ",
  "cat.food": "Ēdiens",
  "cat.activities": "Ekskursijas un biļetes",
  "cat.mobility": "Ratiņkrēsla vai skūtera noma",
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
