import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Car, CircleCheck, CircleDashed, Columns3, ExternalLink, Footprints, Hand, Images, MapPin, Star, Waves } from "lucide-react";
import type { PublicTrip } from "@/lib/public-trip";
import { eur } from "@/lib/budget";
import { NIGHTS, type Who } from "@/lib/trip-data";
import { cn } from "@/lib/cn";
import { PlaceCover, PlaceDialog } from "./PlaceDialog";
import { FavBadge } from "./FavBadge";
import { CompareDialog } from "./Compare";
import { useI18n } from "./i18n";
import { hasSpot, mapsUrl, pinLabel, sortStays, useCompare, useGroups, useMedia, usePins, type Stay } from "./stay-format";

const StaysMap = lazy(() => import("./StaysMap"));

/**
 * Where we stay. Phones: a big map with a swipeable card carousel over its bottom edge; swiping
 * pans the map, tapping a pin brings up its card, tapping a card opens the details.
 * Wider screens: cards on the left, a sticky map on the right; hover or focus links the two.
 */
export function Stays({ trip }: { trip: PublicTrip }) {
  const { t } = useI18n();
  const all = sortStays(trip.stays);
  const [only, setOnly] = useOnlyPicked();
  const picked = all.filter((s) => s.booked || s.favourite);
  const stays = only ? picked : all;
  const anyBooked = all.some((s) => s.booked);
  const { names, group } = useGroups(trip);
  const pinKey = usePins(stays, group);
  const hasPins = stays.some(hasSpot);
  const place = usePlaceHash(stays.length);
  const compare = useCompare();
  const wide = useMedia("(min-width: 768px)");
  const groups = (["family", "couple"] as Who[]).filter((w) => stays.some((s) => s.who === w));

  // Phones: the card in view. Wider screens: the card or pin under the pointer / focus.
  const [active, setActive] = useState(0);
  const [hot, setHot] = useState<string | null>(null);
  const [panKey, setPanKey] = useState(0);
  const [scrollReq, setScrollReq] = useState<{ i: number; smooth: boolean; n: number } | null>(null);
  const toggleOnly = (v: boolean) => {
    setOnly(v);
    // A different set of cards: start at the first one
    setActive(0);
    setScrollReq((r) => ({ i: 0, smooth: false, n: (r?.n ?? 0) + 1 }));
    setPanKey((k) => k + 1);
  };
  const indexOf = (id: string) => stays.findIndex((s) => s.id === id);
  const showCard = (i: number, smooth: boolean) => setScrollReq((r) => ({ i, smooth, n: (r?.n ?? 0) + 1 }));
  // The details dialog moved to another place: follow it underneath
  const onDialogIndex = (i: number) => {
    place.go(i);
    if (wide) return;
    setActive(i);
    showCard(i, false);
    setPanKey((k) => k + 1);
  };

  const mapFallback = (cls: string) => <div className={cn("animate-pulse bg-soft", cls)} />;

  return (
    <>
      {!anyBooked && <p className="mb-6 text-xl">{t("stay.notBooked")}</p>}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {all.length > 1 ? (
          <button
            type="button"
            role="switch"
            aria-checked={only}
            onClick={() => toggleOnly(!only)}
            className="flex min-h-12 items-center gap-3 text-left font-bold"
          >
            <span aria-hidden className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", only ? "bg-primary" : "bg-line")}>
              <span className={cn("absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform", only && "translate-x-5")} />
            </span>
            <span>
              {t("filter.label")} <span className="font-normal text-muted tabular-nums">({t("filter.count", { n: picked.length, total: all.length })})</span>
            </span>
          </button>
        ) : (
          <span />
        )}
        {stays.length > 1 && (
          <button
            type="button"
            onClick={compare.open}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-primary bg-card px-5 font-extrabold text-primary hover:bg-soft"
          >
            <Columns3 className="h-5 w-5" aria-hidden /> {t("compare.open")}
          </button>
        )}
      </div>

      {hasPins && stays.length > 0 && <MapLegend groups={(['family', 'couple'] as Who[]).filter((w) => all.some((s) => s.who === w))} group={group} />}

      {stays.length === 0 && <p className="rounded-2xl bg-soft p-5 text-lg">{t("filter.none")}</p>}

      {stays.length === 0 ? null : wide ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start gap-6 lg:mx-[calc(50%-min(36rem,50vw-1.5rem))]">
          <ol aria-label={t("stay.list")} className="space-y-5">
            {stays.map((s, i) => (
              <li key={s.id}>
                <DeskCard
                  stay={s}
                  who={group(s.who)}
                  hot={hot === s.id}
                  onHot={(on) => setHot(on ? s.id : null)}
                  onOpen={() => place.open(i)}
                />
              </li>
            ))}
          </ol>
          {hasPins && (
            <div className="sticky top-24">
              <Suspense fallback={mapFallback("h-[calc(100dvh-8rem)] max-h-[50rem] rounded-[var(--radius-card)]")}>
                <StaysMap
                  pinsJson={pinKey}
                  label={t("stay.mapLabel")}
                  airportLabel={t("map.airport")}
                  activeId={hot}
                  onPinClick={(id) => place.open(indexOf(id))}
                  onPinHover={setHot}
                  previews
                  className="h-[calc(100dvh-8rem)] max-h-[50rem] min-h-[24rem] rounded-[var(--radius-card)] border"
                />
              </Suspense>
            </div>
          )}
        </div>
      ) : (
        <MobileStays
          stays={stays}
          group={group}
          pinKey={hasPins ? pinKey : null}
          active={active}
          panKey={panKey}
          scrollReq={scrollReq}
          onSettle={(i) => {
            if (i === active) return;
            setActive(i);
            setPanKey((k) => k + 1);
          }}
          onPin={(id) => {
            const i = indexOf(id);
            setActive(i);
            showCard(i, true);
          }}
          onOpen={(i) => place.open(i)}
          mapFallback={mapFallback}
        />
      )}

      <PlaceDialog stays={stays} index={place.index} names={names} onIndex={onDialogIndex} onClose={place.close} />
      <CompareDialog
        open={compare.isOpen}
        onClose={compare.close}
        stays={stays}
        groups={groups}
        group={group}
        onOpen={(id) => place.open(indexOf(id))}
      />
    </>
  );
}

/** Above the map: what the pin colours and the star mean. Compact chips that wrap on phones. */
function MapLegend({ groups, group }: { groups: Who[]; group: (who: Who) => string }) {
  const { t } = useI18n();
  const chip = "inline-flex items-center gap-2 rounded-full bg-soft px-3 py-1 text-base leading-snug font-bold";
  return (
    <ul aria-label={t("stay.legend")} className="mb-3 flex flex-wrap gap-2">
      {groups.map((w) => (
        <li key={w} className={chip}>
          <span className={cn("h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow", `sw-${w}`)} aria-hidden />
          {group(w)}
        </li>
      ))}
      <li className={chip}>
        <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow sw-booked" aria-hidden />
        {t("legend.booked")}
      </li>
      <li className={chip}>
        <Star className="h-4 w-4 shrink-0 fill-fav text-fav" aria-hidden />
        {t("fav.label")}
      </li>
    </ul>
  );
}

const ONLY_KEY = "tenerife-only-picked";

/** "Only favourites and booked", remembered on this device */
function useOnlyPicked() {
  const [only, setOnly] = useState(() => {
    try {
      return localStorage.getItem(ONLY_KEY) === "1";
    } catch {
      return false;
    }
  });
  return [
    only,
    (v: boolean) => {
      setOnly(v);
      try {
        localStorage.setItem(ONLY_KEY, v ? "1" : "0");
      } catch {
        /* private mode: just this visit */
      }
    },
  ] as const;
}

/* ---------------- Phones: map + carousel ---------------- */

function MobileStays({
  stays,
  group,
  pinKey,
  active,
  panKey,
  scrollReq,
  onSettle,
  onPin,
  onOpen,
  mapFallback,
}: {
  stays: Stay[];
  group: (who: Who) => string;
  pinKey: string | null;
  active: number;
  panKey: number;
  scrollReq: { i: number; smooth: boolean; n: number } | null;
  onSettle: (i: number) => void;
  onPin: (id: string) => void;
  onOpen: (i: number) => void;
  mapFallback: (cls: string) => ReactNode;
}) {
  const { t } = useI18n();
  const scroller = useRef<HTMLUListElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [overlayH, setOverlayH] = useState(200);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = stays.length;
  const current = Math.min(active, n - 1);

  // How much of the map the cards cover, so pins stay in the part you can see
  useLayoutEffect(() => {
    const el = overlay.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOverlayH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  // Scroll a card into view (a pin was tapped, or the details dialog moved on)
  useEffect(() => {
    const ul = scroller.current;
    const li = ul?.children[scrollReq?.i ?? -1] as HTMLElement | undefined;
    if (!ul || !li || !scrollReq) return;
    const max = ul.scrollWidth - ul.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.scrollTo({ left: Math.min(li.offsetLeft - 16, max), behavior: scrollReq.smooth && !reduce ? "smooth" : "auto" });
  }, [scrollReq]);

  /** The card lined up at the left edge (or the last one, once scrolled to the end) */
  const nearest = () => {
    const ul = scroller.current;
    if (!ul) return 0;
    if (ul.scrollLeft >= ul.scrollWidth - ul.clientWidth - 2) return n - 1;
    let best = 0;
    let dist = Infinity;
    Array.from(ul.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - 16 - ul.scrollLeft);
      if (d < dist) [best, dist] = [i, d];
    });
    return best;
  };
  // Act once the swipe has settled, so a fast swipe across several cards pans only once
  const onScroll = () => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => onSettle(nearest()), 120);
  };

  const cards = (
    <div className={cn(pinKey && "pointer-events-none absolute inset-x-0 bottom-0 z-[500]")} ref={overlay}>
      {n > 1 && (
        <p
          className="pointer-events-auto mb-2 ml-4 inline-flex items-center gap-2 rounded-full bg-card/95 px-3 py-1 text-base font-bold tabular-nums shadow"
          aria-hidden
        >
          <span className="flex gap-1.5">
            {stays.map((s, i) => (
              <span key={s.id} className={cn("h-2.5 w-2.5 rounded-full", i === current ? "bg-ink" : "bg-ink/25")} />
            ))}
          </span>
          {current + 1} / {n}
        </p>
      )}
      <ul
        ref={scroller}
        onScroll={onScroll}
        aria-label={t("stay.cards")}
        className="pointer-events-auto relative flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stays.map((s, i) => (
          <li
            key={s.id}
            className="flex w-[86%] max-w-[24rem] shrink-0 snap-start"
            aria-roledescription="slide"
            aria-label={t("place.counter", { i: i + 1, n })}
          >
            <PhoneCard stay={s} who={group(s.who)} active={i === current} onOpen={() => onOpen(i)} />
          </li>
        ))}
      </ul>
    </div>
  );

  if (!pinKey) return cards;

  return (
    <>
      <div className="relative -mx-4 h-[76svh] max-h-[46rem] min-h-[30rem] overflow-hidden">
        <Suspense fallback={mapFallback("h-full")}>
          <StaysMap
            pinsJson={pinKey}
            label={t("stay.mapLabel")}
            airportLabel={t("map.airport")}
            activeId={stays[current]?.id ?? null}
            onPinClick={onPin}
            panKey={panKey}
            padBottom={overlayH}
            coveredTop={stickyBottom}
            attributionTop
            className="h-full border-y"
          />
        </Suspense>
        {cards}
      </div>
      <p className="mt-2 flex items-center gap-2 text-base text-muted">
        <Hand className="h-5 w-5 shrink-0" aria-hidden /> {t("stay.cardsHint")}
      </p>
    </>
  );
}

/** Bottom of the page's sticky top bar, so the map can centre pins below it */
const stickyBottom = () => document.querySelector("header.sticky")?.getBoundingClientRect().bottom ?? 0;

function PhoneCard({ stay: s, who, active, onOpen }: { stay: Stay; who: string; active: boolean; onOpen: () => void }) {
  const { t, tn } = useI18n();
  const p = s.price;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "surface flex h-full min-h-36 w-full overflow-hidden text-left transition-shadow",
       
        active && "ring-3 ring-ink",
      )}
    >
      <span className="relative block w-28 shrink-0">
        <PlaceCover stay={s} small className="h-full w-full" />
        {s.booked && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-good px-2 py-0.5 text-sm font-bold text-on-good">
            <CircleCheck className="h-4 w-4" aria-hidden /> {t("stay.booked")}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
        {s.favourite && <FavBadge className="mb-0.5 !px-2 !text-sm" />}
        <span className="line-clamp-2 font-display text-lg leading-tight font-extrabold">{s.name}</span>
        <span className="flex items-center gap-1.5 text-base text-muted">
          <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", `sw-${s.who}`)} aria-hidden />
          <span className="truncate">{who}</span>
        </span>
        {p && (
          <>
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-display text-xl leading-tight font-extrabold tabular-nums">{pinLabel(s)}</span>
              <span className="text-base whitespace-nowrap text-muted">{tn("stay.nights", NIGHTS)}</span>
            </span>
            {p.people > 0 && <span className="text-base tabular-nums">{t("stay.perPerson", { amount: eur(p.perPerson) })}</span>}
          </>
        )}
      </span>
    </button>
  );
}

/* ---------------- Wider screens: list cards ---------------- */

function DeskCard({
  stay: s,
  who,
  hot,
  onHot,
  onOpen,
}: {
  stay: Stay;
  who: string;
  hot: boolean;
  onHot: (on: boolean) => void;
  onOpen: () => void;
}) {
  const { t, tn } = useI18n();
  const p = s.price;
  const maps = mapsUrl(s);
  const facts: [ReactNode, string][] = [];
  if (s.seaMin != null && s.seaMin > 0) facts.push([<Waves key="s" className="h-5 w-5" />, tn("stay.sea", s.seaMin)]);
  if (s.walkMin != null && s.walkMin > 0) facts.push([<Footprints key="w" className="h-5 w-5" />, tn("stay.walk", s.walkMin)]);
  if (s.driveMin != null && s.driveMin > 0) facts.push([<Car key="d" className="h-5 w-5" />, tn("stay.drive", s.driveMin)]);
  return (
    <article
      onMouseEnter={() => onHot(true)}
      onMouseLeave={() => onHot(false)}
      onFocus={() => onHot(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && onHot(false)}
      className={cn("surface relative flex flex-col overflow-hidden transition-shadow lg:flex-row", hot && "ring-3 ring-ink")}
    >
      <div className="relative shrink-0 lg:w-48">
        <PlaceCover stay={s} className="aspect-[16/9] h-full w-full lg:aspect-auto" />
        {(s.photos?.length ?? 0) > 1 && (
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-ink/75 px-3 py-0.5 text-base font-bold text-white" aria-hidden>
            <Images className="h-4 w-4" /> {s.photos!.length}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div>
          {s.favourite && <FavBadge className="mb-2" />}
          <h3 className="text-2xl font-extrabold break-words">{s.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
            <span className="flex items-center gap-1.5 font-bold">
              <span className={cn("h-3 w-3 shrink-0 rounded-full", `sw-${s.who}`)} aria-hidden /> {who}
            </span>
            <span className="flex items-center gap-1 text-muted">
              <MapPin className="h-4 w-4" aria-hidden /> {s.area}
            </span>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 font-bold", s.booked ? "bg-good text-on-good" : "bg-soft")}>
              {s.booked ? <CircleCheck className="h-4 w-4" aria-hidden /> : <CircleDashed className="h-4 w-4" aria-hidden />}
              {s.booked ? t("stay.booked") : t("stay.maybe")}
            </span>
          </p>
        </div>
        {p && (
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-3xl font-extrabold tabular-nums">{pinLabel(s)}</span>
            <span className="text-muted">{tn("stay.nights", NIGHTS)}</span>
            {p.people > 0 && <span className="w-full font-bold tabular-nums">{t("stay.perPerson", { amount: eur(p.perPerson) })}</span>}
          </p>
        )}
        {facts.length > 0 && (
          <ul className="space-y-1 text-base">
            {facts.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-2">
                <span className="shrink-0 text-muted" aria-hidden>
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {/* Covers the whole card, so clicking anywhere opens the details; the links sit above it */}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-bold text-on-primary after:absolute after:inset-0 after:rounded-[var(--radius-card)] after:content-[''] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
          >
            <Images className="h-5 w-5" aria-hidden /> {t("stay.details")}
            <span className="sr-only">: {s.name}</span>
          </button>
          {maps && <ExtLink href={maps}>{t("stay.maps")}</ExtLink>}
          {s.url && <ExtLink href={s.url}>{t("stay.listing")}</ExtLink>}
        </div>
      </div>
    </article>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="relative z-10 inline-flex min-h-12 items-center gap-2 rounded-full bg-soft px-5 font-bold text-primary"
    >
      {children} <ExternalLink className="h-5 w-5" aria-hidden />
      <span className="sr-only">{t("place.newTab")}</span>
    </a>
  );
}

/**
 * Which place's details are open, kept in the URL as #place-2 so a link can be shared.
 * Opening adds a history entry, so the back button closes the dialog; moving between places replaces it.
 */
function usePlaceHash(count: number) {
  const read = () => {
    const m = /^#place-(\d+)$/.exec(window.location.hash);
    return m ? Number(m[1]) - 1 : null;
  };
  const [index, setIndex] = useState<number | null>(read);
  /** True when we added the history entry (false when the page was opened from a shared link) */
  const pushed = useRef(false);

  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      setIndex(read());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const url = (i: number | null) => window.location.pathname + window.location.search + (i == null ? "" : `#place-${i + 1}`);
  const valid = index != null && index >= 0 && index < count ? index : null;

  return {
    index: valid,
    open: (i: number) => {
      if (i < 0) return;
      if (valid == null) {
        window.history.pushState(null, "", url(i));
        pushed.current = true;
      } else window.history.replaceState(null, "", url(i));
      setIndex(i);
    },
    go: (i: number) => {
      window.history.replaceState(null, "", url(i));
      setIndex(i);
    },
    close: () => {
      if (valid == null) return;
      if (pushed.current) return window.history.back(); // popstate closes it
      window.history.replaceState(null, "", url(null));
      setIndex(null);
    },
  };
}
