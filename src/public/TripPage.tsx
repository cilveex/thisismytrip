import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { Briefcase, CalendarPlus, CircleCheck, CircleDashed, Compass, Footprints, Info, Luggage, MapPin, Plane, PlaneLanding, PlaneTakeoff, Scale, ShoppingBag, Users } from "lucide-react";
import { usePublicTrip } from "@/lib/public-store";
import type { PublicTrip } from "@/lib/public-trip";
import { eur } from "@/lib/budget";
import { hasTime, leaveAt, meetAt } from "@/lib/flights";
import { daysUntilDeparture, tripPhase } from "@/lib/dates";
import { downloadIcs, type CalEvent } from "@/lib/ics";
import { DEPARTURE, NIGHTS, type Flight } from "@/lib/trip-data";
import { cn } from "@/lib/cn";
import { I18nProvider } from "./I18nProvider";
import { Stays } from "./Stays";
import { AreaGallery } from "./AreaGallery";
import { AREA_PHOTOS } from "@/lib/area-photos";
import { listJoin } from "./stay-format";
import { isKey, useI18n, type Lang } from "./i18n";

const SECTIONS = [
  { id: "flights", key: "nav.flights" },
  { id: "stay", key: "nav.stay" },
  { id: "why", key: "nav.why" },
  { id: "days", key: "nav.days" },
  { id: "budget", key: "nav.budget" },
  { id: "info", key: "nav.info" },
] as const;

export default function TripPage() {
  return (
    <I18nProvider>
      <Page />
    </I18nProvider>
  );
}

function Page() {
  const { trip, status } = usePublicTrip();
  // Bigger base size for this page: every rem-based size scales up (secondary text ≥ 18px, body ≈ 20px).
  useEffect(() => {
    document.documentElement.classList.add("public-page");
    return () => document.documentElement.classList.remove("public-page");
  }, []);
  const { t } = useI18n();
  const sections = SECTIONS.filter(
    (s) => (s.id !== "info" || !!trip?.goodToKnow.length) &&
      (s.id !== "why" || hasWhy(trip)) && (s.id !== "budget" || !!trip?.budget),
  );

  return (
    <div className="min-h-dvh text-[1.125rem] leading-relaxed">
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[2000] focus:rounded focus:bg-card focus:p-3"
      >
        {t("skip")}
      </a>
      <TopBar sections={trip ? sections : []} />

      <main id="top" className="mx-auto max-w-3xl px-4 pt-5 pb-10 md:px-6">
        <Hero trip={trip} />
        {!trip ? (
          <p className="py-16 text-center text-xl" role="status">
            {status === "loading" ? t("status.loading") : status === "error" ? t("status.error") : t("status.empty")}
          </p>
        ) : (
          <div className="mt-14 space-y-16 md:mt-16 md:space-y-20">
            <Flights trip={trip} />
            <StaySection trip={trip} />
            {hasWhy(trip) && <Why trip={trip} />}
            <Days trip={trip} />
            {trip.budget && <Budget trip={trip} />}
            {trip.goodToKnow.length > 0 && <GoodToKnow trip={trip} />}
          </div>
        )}
      </main>

      <footer className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 border-t px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-base text-muted md:px-6">
        <Updated trip={trip} />
        <Link to="/plan" className="inline-flex min-h-11 items-center px-1 text-sm underline">
          {t("footer.planner")}
        </Link>
      </footer>
    </div>
  );
}

/* ---------------- Top bar: section links + language ---------------- */

function TopBar({ sections }: { sections: readonly { id: string; key: (typeof SECTIONS)[number]["key"] }[] }) {
  const { t, lang, setLang } = useI18n();
  return (
    <header className="sticky top-0 z-[1100] border-b bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 md:px-4">
        {/* Scrolls sideways on narrow phones; the fade on the right hints there's more */}
        <nav
          aria-label={t("nav.label")}
          className="min-w-0 flex-1 overflow-x-auto [mask-image:linear-gradient(to_right,black_80%,transparent)] [scrollbar-width:none] md:[mask-image:none]"
        >
          <ul className="flex gap-1 py-1.5">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-base font-bold whitespace-nowrap hover:bg-soft"
                >
                  {t(s.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div role="group" aria-label={t("lang.label")} className="flex shrink-0 rounded-full bg-soft p-1">
          {(["lv", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={cn(
                "min-h-11 min-w-11 rounded-full px-2 text-base font-extrabold uppercase",
                lang === l ? "bg-card shadow" : "text-muted",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ trip }: { trip: PublicTrip | null }) {
  const { t, tn, locale } = useI18n();
  const start = new Date(DEPARTURE + "T12:00:00");
  const end = new Date(start.getTime() + NIGHTS * 86_400_000);
  const range = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).formatRange(start, end);
  const phase = tripPhase();
  const days = daysUntilDeparture();
  const people = trip?.travellers.length ?? 0;
  return (
    <section className="bg-hero relative isolate overflow-hidden rounded-[2rem] px-6 py-10 md:px-12 md:py-16" aria-labelledby="hero-h">
      {/* Decorative photo: eager and high priority, it's the first thing people see */}
      <img
        src="/hero/los-gigantes-1000.webp"
        srcSet="/hero/los-gigantes-640.webp 640w, /hero/los-gigantes-1000.webp 1000w"
        sizes="(min-width: 768px) 768px, 100vw"
        width={1000}
        height={369}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="hero-photo absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="hero-shade absolute inset-0 -z-10" aria-hidden />
      <p className="text-lg font-bold opacity-90">{t("hero.kicker")}</p>
      <h1 id="hero-h" className="mt-1 text-6xl font-extrabold md:text-8xl">
        {t("hero.title")}
      </h1>
      <p className="mt-3 text-2xl font-bold md:text-3xl">{range}</p>
      <p className="mt-8 inline-block rounded-full bg-accent px-5 py-2 font-display text-2xl font-extrabold text-on-accent md:text-3xl">
        {phase === "before" ? tn("hero.days", days) : t(`hero.${phase}`)}
      </p>
      {people > 0 && (
        <p className="mt-4 text-xl opacity-95">
          {tn("hero.people", people)}, {tn("hero.nights", NIGHTS)}
        </p>
      )}
    </section>
  );
}

/* ---------------- Shared bits ---------------- */

function Section({ id, title, icon, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
      <h2 id={`${id}-h`} className="mb-6 flex items-center gap-3 text-4xl font-extrabold md:text-5xl">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-soft text-primary" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const hhmm = (dt: string) => dt.slice(11, 16);

/** "otrdiena, 8. decembris" → "Otrdiena, 8. decembris" (first letter only) */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function useFmt() {
  const { t, locale } = useI18n();
  /** Whole phrase per airport (so Latvian can use the right case), else the generic one */
  const phrase = (prefix: "meet" | "landsIn", code: string, generic: "flights.meetAt" | "flights.landsIn") => {
    const k = `${prefix}.${code.toUpperCase()}`;
    return isKey(k) ? t(k) : t(generic, { airport: code });
  };
  return {
    meet: (code: string) => phrase("meet", code, "flights.meetAt"),
    /** Calendar title for the return meet-up: names the airport, unlike the shorter page label */
    calMeet: (code: string) => {
      const k = `calMeet.${code.toUpperCase()}`;
      return isKey(k) ? t(k) : phrase("meet", code, "flights.meetAt");
    },
    landsIn: (code: string) => phrase("landsIn", code, "flights.landsIn"),
    /** "Tuesday 8 December" in the page language */
    date: (dt: string) =>
      cap(
        new Date(dt.slice(0, 10) + "T12:00:00Z").toLocaleDateString(locale, {
          timeZone: "UTC",
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      ),
    /** "Tue 8 Dec" */
    short: (dt: string) =>
      cap(
        new Date(dt.slice(0, 10) + "T12:00:00Z").toLocaleDateString(locale, {
          timeZone: "UTC",
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      ),
    tz: (code: string) => {
      const k = `tz.${code.toUpperCase()}`;
      return isKey(k) ? t(k) : t("tz.other");
    },
    airport: (code: string) => {
      const k = `airport.${code.toUpperCase()}`;
      return isKey(k) ? t(k) : code;
    },
  };
}

/* ---------------- Flights ---------------- */

function TimeRow({ icon, label, dt, airport }: { icon: ReactNode; label: string; dt: string; airport: string }) {
  const f = useFmt();
  if (!hasTime(dt)) return null;
  return (
    <li className="flex items-start gap-3 py-3">
      <span className="mt-1 text-muted" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{label}</p>
        <p className="text-base text-muted">{f.short(dt)}</p>
      </div>
      <p className="text-right">
        <span className="block font-display text-3xl font-extrabold tabular-nums">{hhmm(dt)}</span>
        <span className="block text-base text-muted">{f.tz(airport)}</span>
      </p>
    </li>
  );
}

function BigTime({ label, dt, airport }: { label: string; dt: string; airport: string }) {
  const f = useFmt();
  return (
    <div className="rounded-2xl bg-accent/25 p-5">
      <p className="text-lg font-bold">{label}</p>
      <p className="font-display text-6xl leading-none font-extrabold tabular-nums md:text-7xl">{hhmm(dt)}</p>
      <p className="mt-2 text-lg">
        {f.date(dt)} · <strong>{f.tz(airport)}</strong>
      </p>
    </div>
  );
}

/**
 * A boarding pass: route and flight on top, a perforated tear line, then the times on the stub.
 * The tear line's notches are semicircles in the page colour on both edges.
 */
function BoardingPass({ title, f: flight, children }: { title: string; f: Flight; children: ReactNode }) {
  const { t } = useI18n();
  const f = useFmt();
  const from = flight.from.toUpperCase();
  const to = flight.to.toUpperCase();
  const name = [flight.airline, flight.number].filter(Boolean).join(" ");
  return (
    <article
      className="surface relative overflow-hidden"
      aria-label={`${title}: ${t("pass.route", { from: f.airport(from), to: f.airport(to) })}`}
    >
      <div className="bg-primary px-5 py-2 text-on-primary">
        <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-wide uppercase">
          <Plane className="h-5 w-5" aria-hidden /> {title}
        </h3>
      </div>
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-3" aria-hidden>
          <Code code={from} city={f.airport(from)} />
          <div className="relative flex min-w-8 flex-1 items-center text-primary">
            <span className="h-0.5 flex-1 bg-current opacity-40" />
            <Plane className="mx-1 h-7 w-7 shrink-0 rotate-90 md:h-8 md:w-8" />
            <span className="h-0.5 flex-1 bg-current opacity-40" />
          </div>
          <Code code={to} city={f.airport(to)} align="right" />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-bold tracking-wide text-muted uppercase">{t("pass.flight")}</dt>
            <dd className="text-xl font-extrabold">{name || "–"}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold tracking-wide text-muted uppercase">{t("pass.date")}</dt>
            <dd className="text-xl font-extrabold">{hasTime(flight.depart) ? f.short(flight.depart) : "–"}</dd>
          </div>
        </dl>
      </div>
      {/* Tear line: dashed rule with a notch cut out of each edge */}
      <div className="relative h-0" aria-hidden>
        <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-line" />
        <span className="absolute top-0 -left-3.5 h-7 w-7 -translate-y-1/2 rounded-full border bg-bg" />
        <span className="absolute top-0 -right-3.5 h-7 w-7 -translate-y-1/2 rounded-full border bg-bg" />
      </div>
      <div className="space-y-4 bg-soft/50 p-5 pt-6 md:p-6 md:pt-7">{children}</div>
    </article>
  );
}

function Code({ code, city, align }: { code: string; city: string; align?: "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="font-display text-5xl leading-none font-extrabold tracking-wide md:text-6xl">{code}</p>
      <p className="mt-1 text-base text-muted">{city}</p>
    </div>
  );
}

function Flights({ trip }: { trip: PublicTrip }) {
  const { t } = useI18n();
  const f = useFmt();
  const out = trip.flights.outbound;
  const back = trip.flights.return;
  const outMeet = meetAt(out);
  const backMeet = meetAt(back);
  const leave = leaveAt(back);

  const events: CalEvent[] = [
    { id: "meet-out", title: f.meet(out.from), start: outMeet, end: out.depart, airport: out.from, location: f.airport(out.from) },
    { id: "flight-out", title: `${t("cal.flight", { from: f.airport(out.from), to: f.airport(out.to) })} ${out.number}`.trim(), start: out.depart, end: shiftZone(out.depart, out.from, out.arrive, out.to), airport: out.from },
    { id: "leave", title: t("cal.leave"), start: leave, end: backMeet, airport: back.from },
    { id: "meet-back", title: f.calMeet(back.from), start: backMeet, end: back.depart, airport: back.from, location: f.airport(back.from) },
    { id: "flight-back", title: `${t("cal.flight", { from: f.airport(back.from), to: f.airport(back.to) })} ${back.number}`.trim(), start: back.depart, end: shiftZone(back.depart, back.from, back.arrive, back.to), airport: back.from },
  ];
  const anyTime = hasTime(out.depart) || hasTime(back.depart);

  return (
    <Section id="flights" title={t("flights.title")} icon={<Plane className="h-6 w-6" />}>
      <p className="mb-6 flex gap-3 rounded-2xl bg-soft p-4 text-lg">
        <Info className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
        <span>{t("flights.tzNote")}</span>
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <BoardingPass title={t("flights.there")} f={out}>
          {hasTime(out.depart) ? (
            <>
              <BigTime label={f.meet(out.from)} dt={outMeet} airport={out.from} />
              <ul className="divide-y">
                <TimeRow icon={<PlaneTakeoff className="h-6 w-6" />} label={t("flights.departs")} dt={out.depart} airport={out.from} />
                <TimeRow icon={<PlaneLanding className="h-6 w-6" />} label={t("flights.lands")} dt={out.arrive} airport={out.to} />
              </ul>
            </>
          ) : (
            <p className="text-muted">{t("flights.notYet")}</p>
          )}
          <FlightNotes trip={trip} />
        </BoardingPass>
        <BoardingPass title={t("flights.back")} f={back}>
          {hasTime(back.depart) ? (
            <>
              <BigTime label={t("flights.leave")} dt={leave} airport={back.from} />
              <ul className="divide-y">
                <TimeRow icon={<Users className="h-6 w-6" />} label={f.meet(back.from)} dt={backMeet} airport={back.from} />
                <TimeRow icon={<PlaneTakeoff className="h-6 w-6" />} label={t("flights.departs")} dt={back.depart} airport={back.from} />
                <TimeRow icon={<PlaneLanding className="h-6 w-6" />} label={f.landsIn(back.to)} dt={back.arrive} airport={back.to} />
              </ul>
            </>
          ) : (
            <p className="text-muted">{t("flights.notYet")}</p>
          )}
        </BoardingPass>
      </div>
      {trip.flights.luggage && <LuggageBlock lug={trip.flights.luggage} />}
      {anyTime && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => downloadIcs(events, t("cal.file"))}
            className="inline-flex min-h-14 items-center gap-3 rounded-full bg-primary px-6 text-lg font-extrabold text-on-primary"
          >
            <CalendarPlus className="h-6 w-6" aria-hidden /> {t("flights.addCal")}
          </button>
          <p className="mt-2 text-base text-muted">{t("flights.calHint")}</p>
        </div>
      )}
    </Section>
  );
}

/** Per person: two bags and one weight limit, easy to scan */
function LuggageBlock({ lug }: { lug: NonNullable<PublicTrip["flights"]["luggage"]> }) {
  const { t } = useI18n();
  const rows: { icon: ReactNode; label: string; detail?: string }[] = [
    { icon: <ShoppingBag className="h-7 w-7" />, label: t("lug.personal"), detail: lug.personalSize.trim() ? t("lug.size", { size: lug.personalSize.trim() }) : undefined },
    { icon: <Briefcase className="h-7 w-7" />, label: t("lug.cabin"), detail: lug.cabinSize.trim() ? t("lug.size", { size: lug.cabinSize.trim() }) : undefined },
    ...(lug.totalKg > 0 ? [{ icon: <Scale className="h-7 w-7" />, label: t("lug.weight", { kg: lug.totalKg }) }] : []),
  ];
  return (
    <section className="mt-6" aria-labelledby="lug-h">
      <div className="surface p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h3 id="lug-h" className="flex items-center gap-2 text-2xl font-extrabold">
            <Luggage className="h-6 w-6 text-primary" aria-hidden /> {t("lug.title")}
          </h3>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-0.5 text-base font-extrabold text-[#1d2428]">
            <Users className="h-4 w-4" aria-hidden /> {t("lug.perPerson")}
          </p>
        </div>
        <ul className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-4 rounded-2xl bg-soft p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-primary" aria-hidden>
                {r.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-lg leading-snug font-extrabold">{r.label}</span>
                {r.detail && <span className="block text-lg whitespace-nowrap tabular-nums">{r.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-2 text-base text-muted">
          <Info className="h-5 w-5 shrink-0 text-primary" aria-hidden /> {t("lug.tip")}
        </p>
      </div>
    </section>
  );
}

function FlightNotes({ trip }: { trip: PublicTrip }) {
  const { t, lang } = useI18n();
  const notes = (trip.flightNotes ?? []).map((n) => ({ ...n, text: (lang === "lv" ? n.lv : n.en) || n.en || n.lv })).filter((n) => n.text.trim());
  if (!notes.length) return null;
  return (
    <div className="rounded-2xl border-2 border-dashed p-4">
      <p className="mb-2 flex items-center gap-2 font-extrabold">
        <Info className="h-5 w-5 shrink-0 text-primary" aria-hidden /> {t("flights.otherFlights")}
      </p>
      <ul className="space-y-2">
        {notes.map((n, i) => (
          <li key={i}>
            {n.name && <strong>{n.name}: </strong>}
            {n.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Calendar events need one time zone per event. Express the landing time in the departure
 * airport's local time (Riga is UTC+2, Tenerife UTC+0 in December).
 */
function shiftZone(depart: string, fromCode: string, arrive: string, toCode: string) {
  if (!hasTime(arrive)) return depart;
  const off: Record<string, number> = { RIX: 120, TFS: 0, TFN: 0 };
  const a = off[fromCode.toUpperCase()];
  const b = off[toCode.toUpperCase()];
  if (a === undefined || b === undefined) return arrive;
  const d = new Date(arrive.slice(0, 16) + ":00Z");
  d.setUTCMinutes(d.getUTCMinutes() + (a - b));
  return d.toISOString().slice(0, 16);
}

/* ---------------- Stays ---------------- */

function StaySection({ trip }: { trip: PublicTrip }) {
  const { t } = useI18n();
  const anyBooked = trip.stays.some((s) => s.booked);
  return (
    <Section id="stay" title={anyBooked || !trip.stays.length ? t("stay.title") : t("stay.considering")} icon={<MapPin className="h-6 w-6" />}>
      {trip.stays.length ? <Stays trip={trip} /> : <p className="text-xl">{t("stay.none")}</p>}
    </Section>
  );
}

/* ---------------- Why here ---------------- */

const hasWhy = (trip: PublicTrip | null) => !!trip && (!!trip.why?.lv.trim() || !!trip.why?.en.trim());

function Why({ trip }: { trip: PublicTrip }) {
  const { t, lang } = useI18n();
  const w = trip.why!;
  const text = (lang === "lv" ? w.lv : w.en) || w.en || w.lv;
  return (
    <Section id="why" title={t("why.title")} icon={<Compass className="h-6 w-6" />}>
      <p className="text-xl leading-relaxed whitespace-pre-line">{text}</p>
      {AREA_PHOTOS.length > 0 && <AreaGallery />}
    </Section>
  );
}

/* ---------------- Days ---------------- */

function Days({ trip }: { trip: PublicTrip }) {
  const { t, lang, locale } = useI18n();
  const last = trip.days.length - 1;
  return (
    <Section id="days" title={t("days.title")} icon={<Footprints className="h-6 w-6" />}>
      <ol className="space-y-3">
        {trip.days.map((d, i) => {
          const date = new Date(d.date + "T12:00:00Z");
          const travel = i === 0 || i === last;
          const text = (lang === "lv" ? d.lv : d.en) || d.en || d.lv;
          return (
            <li
              key={d.date}
              className={cn("flex gap-4 rounded-2xl p-4 md:gap-6 md:p-5", travel ? "bg-accent/25" : "surface")}
            >
              <div className="w-16 shrink-0 text-center md:w-20">
                <p className="text-base font-bold text-muted capitalize">
                  {date.toLocaleDateString(locale, { timeZone: "UTC", weekday: "short" })}
                </p>
                <p className="font-display text-4xl leading-none font-extrabold tabular-nums">{date.getUTCDate()}</p>
                <p className="text-base text-muted">{date.toLocaleDateString(locale, { timeZone: "UTC", month: "short" })}</p>
              </div>
              <div className="min-w-0 flex-1 self-center">
                {travel && (
                  <p className="mb-1 inline-flex items-center gap-2 font-extrabold">
                    <Plane className="h-5 w-5" aria-hidden /> {t("days.travel")}
                  </p>
                )}
                <p className="text-lg">{text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/* ---------------- Budget ---------------- */

function Budget({ trip }: { trip: PublicTrip }) {
  const { t, tn } = useI18n();
  const b = trip.budget!;
  const couple = listJoin(trip.travellers.filter((x) => x.apt === "couple").map((x) => x.name), t("and"));
  const label = (key: string) => {
    if (key === "couple") return t("cat.couple", { names: couple || "?" });
    const k = `cat.${key}`;
    return isKey(k) ? t(k) : key;
  };
  return (
    <Section id="budget" title={t("budget.title")} icon={<CircleCheck className="h-6 w-6" />}>
      <div className="surface p-6 md:p-8">
        <p className="font-display text-6xl font-extrabold tabular-nums md:text-7xl">{eur(b.perPerson)}</p>
        <p className="text-2xl font-bold">{t("budget.perPerson")}</p>
        <p className="mt-4 text-xl">{tn("budget.totalFor", b.people, { amount: eur(b.total) })}</p>
        <p className="text-xl">{t("budget.pool", { amount: eur(b.poolPerPerson) })}</p>
      </div>
      <h3 className="mt-8 mb-3 text-2xl font-extrabold">{t("budget.breakdown")}</h3>
      <ul className="divide-y rounded-[var(--radius-card)] border bg-card px-5">
        {b.lines.map((l) => (
          <li key={l.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-4">
            <span className="font-bold">{label(l.key)}</span>
            <span className="row-span-2 text-right text-xl font-extrabold tabular-nums">{eur(l.amount)}</span>
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-0.5 text-base font-bold",
                l.confirmed ? "bg-good text-on-good" : "bg-soft",
              )}
            >
              {l.confirmed ? <CircleCheck className="h-4 w-4" aria-hidden /> : <CircleDashed className="h-4 w-4" aria-hidden />}
              {l.confirmed ? t("budget.confirmed") : t("budget.estimate")}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-base text-muted">{t("budget.note")}</p>
    </Section>
  );
}

/* ---------------- Good to know ---------------- */

function GoodToKnow({ trip }: { trip: PublicTrip }) {
  const { t, lang } = useI18n();
  return (
    <Section id="info" title={t("info.title")} icon={<Info className="h-6 w-6" />}>
      <ul className="space-y-3">
        {trip.goodToKnow.map((g) => (
          <li key={g.id} className="surface flex gap-3 p-5 text-lg">
            <CircleCheck className="mt-1 h-6 w-6 shrink-0 text-good" aria-hidden />
            <span>{(lang === "lv" ? g.lv : g.en) || g.en || g.lv}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Updated({ trip }: { trip: PublicTrip | null }) {
  const { t, locale } = useI18n();
  if (!trip) return <span />;
  const d = new Date(trip.updatedAt).toLocaleDateString(locale, { day: "numeric", month: "long" });
  return <span>{t("footer.updated", { date: d })}</span>;
}
