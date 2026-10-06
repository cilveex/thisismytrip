import { lazy, Suspense, useEffect, useId, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { BedDouble, Building2, Car, ChevronLeft, ChevronRight, CircleCheck, CircleDashed, ExternalLink, Footprints, ImageOff, MapPin, Users, Waves, X } from "lucide-react";
import { eur } from "@/lib/budget";
import { NIGHTS } from "@/lib/trip-data";
import { cn } from "@/lib/cn";
import { useI18n } from "./i18n";
import { mapsUrl, pinLabel, type Stay } from "./stay-format";

const StaysMap = lazy(() => import("./StaysMap"));

/** Cover photo, or a neat placeholder with the area name. `small`: just an icon, for thumbnails. */
export function PlaceCover({ stay, small, className }: { stay: Stay; small?: boolean; className?: string }) {
  const { t } = useI18n();
  const src = stay.photos?.[0];
  if (src)
    return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className={cn("object-cover", className)} />;
  return <Placeholder area={stay.area} label={t("stay.noPhotos")} small={small} className={className} />;
}

function Placeholder({ area, label, small, className }: { area: string; label: string; small?: boolean; className?: string }) {
  const bg = "bg-[linear-gradient(160deg,var(--soft),color-mix(in_oklab,var(--primary)_22%,var(--soft)))]";
  if (small)
    return (
      <span className={cn("flex items-center justify-center", bg, className)} title={label}>
        <ImageOff className="h-7 w-7 text-primary/70" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 p-4 text-center", bg, className)}>
      <MapPin className="h-8 w-8 text-primary" aria-hidden />
      <span className="font-display text-2xl font-extrabold">{area}</span>
      <span className="flex items-center gap-1.5 text-base text-muted">
        <ImageOff className="h-4 w-4" aria-hidden /> {label}
      </span>
    </div>
  );
}

/** 7-night total, per night, per person; and the whole-trip cost with this option when the budget is shared */
export function PriceInfo({ stay, compact }: { stay: Stay; compact?: boolean }) {
  const { t, tn } = useI18n();
  const p = stay.price;
  if (!p) return null;
  const rows: [string, number][] = [
    [tn("price.total", NIGHTS), p.total],
    [t("price.perNight"), p.perNight],
    ...(p.people > 0 ? [[tn("price.perPerson", p.people), p.perPerson] as [string, number]] : []),
  ];
  return (
    <div className={cn("rounded-2xl bg-soft", compact ? "p-4" : "p-5")}>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-1.5">
            <dt>{k}</dt>
            <dd className="text-xl font-extrabold tabular-nums">{eur(v)}</dd>
          </div>
        ))}
      </dl>
      {p.estimate && <p className="mt-2 text-base text-muted">{t("price.estimate")}</p>}
      {p.tripPerPerson != null && (
        <p className="mt-3 rounded-xl bg-card p-3 font-bold">{t("price.trip", { amount: eur(p.tripPerPerson) })}</p>
      )}
    </div>
  );
}

/**
 * Full-screen place details on phones, a large centred dialog on wider screens.
 * Native <dialog>: focus stays inside, Esc closes. Swipe sideways between places, down to close.
 */
export function PlaceDialog({
  stays,
  index,
  names,
  onIndex,
  onClose,
}: {
  stays: Stay[];
  /** 0-based; null when closed */
  index: number | null;
  names: (who: string) => string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const open = index != null && !!stays[index];
  const stay = open ? stays[index] : null;
  const count = stays.length;
  const hasPrev = open && index > 0;
  const hasNext = open && index < count - 1;
  const prev = () => hasPrev && onIndex(index - 1);
  const next = () => hasNext && onIndex(index + 1);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Lock the page behind
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevOverflow;
    };
  }, [open]);

  // New place: back to the top
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [index]);

  const touch = useRef<{ x: number; y: number; atTop: boolean; sideways: boolean } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const p = e.touches[0];
    if (!p || e.touches.length > 1) return void (touch.current = null);
    const target = e.target as Element;
    touch.current = {
      x: p.clientX,
      y: p.clientY,
      atTop: (scroller.current?.scrollTop ?? 0) <= 0,
      // The photo strip and the map handle their own sideways moves
      sideways: !target.closest("[data-noswipe]"),
    };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current;
    const p = e.changedTouches[0];
    touch.current = null;
    if (!s || !p) return;
    const dx = p.clientX - s.x;
    const dy = p.clientY - s.y;
    if (s.sideways && Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) return void (dx < 0 ? next() : prev());
    if (s.atTop && dy > 90 && dy > 1.5 * Math.abs(dx)) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="place-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
    >
      {stay && (
        <div
          className="flex h-full items-center justify-center md:gap-4 md:p-6"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <SideBtn dir="prev" disabled={!hasPrev} onClick={prev} label={t("place.prev")} />

          <div className="flex h-full w-full flex-col bg-card md:h-auto md:max-h-[90dvh] md:max-w-3xl md:overflow-hidden md:rounded-[1.75rem] md:shadow-2xl">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b px-3 pt-[env(safe-area-inset-top)] md:px-4">
              <p className="px-2 text-lg font-bold tabular-nums" aria-live="polite">
                {t("place.counter", { i: index! + 1, n: count })}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("place.close")}
                className="grid h-12 w-12 place-items-center rounded-full hover:bg-soft"
              >
                <X className="h-7 w-7" aria-hidden />
              </button>
            </header>

            <div
              ref={scroller}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <Gallery key={stay.id} stay={stay} />
              <Details stay={stay} titleId={titleId} names={names} />
            </div>

            {/* Phones: previous / next within thumb reach */}
            <nav
              aria-label={t("stay.title")}
              className="flex shrink-0 items-center justify-between gap-2 border-t px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden"
            >
              <BarBtn onClick={prev} disabled={!hasPrev} label={t("place.prev")}>
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </BarBtn>
              <span className="text-base text-muted tabular-nums" aria-hidden>
                {index! + 1} / {count}
              </span>
              <BarBtn onClick={next} disabled={!hasNext} label={t("place.next")}>
                <ChevronRight className="h-6 w-6" aria-hidden />
              </BarBtn>
            </nav>
          </div>

          <SideBtn dir="next" disabled={!hasNext} onClick={next} label={t("place.next")} />
        </div>
      )}
    </dialog>
  );
}

function SideBtn({ dir, disabled, onClick, label }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "hidden h-14 w-14 shrink-0 place-items-center rounded-full bg-card shadow-lg transition hover:scale-105 disabled:invisible md:grid",
        dir === "prev" ? "order-first" : "order-last",
      )}
    >
      {dir === "prev" ? <ChevronLeft className="h-8 w-8" aria-hidden /> : <ChevronRight className="h-8 w-8" aria-hidden />}
    </button>
  );
}

function BarBtn({ onClick, disabled, label, children }: { onClick: () => void; disabled: boolean; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-12 w-16 place-items-center rounded-full bg-soft disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/* ---------- Photos: swipe on phones, arrows on wider screens ---------- */

function Gallery({ stay }: { stay: Stay }) {
  const { t } = useI18n();
  const strip = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const photos = stay.photos ?? [];
  const n = photos.length;
  const box = "aspect-[4/3] w-full md:aspect-[16/9]";
  if (!n) return <Placeholder area={stay.area} label={t("stay.noPhotos")} className={box} />;

  const go = (to: number) => {
    const el = strip.current;
    if (el) el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative bg-ink" data-noswipe>
      <div
        ref={strip}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {photos.map((src, j) => (
          <img
            key={src}
            src={src}
            alt={t("place.photo", { name: stay.name, i: j + 1, n })}
            loading={j === 0 ? "eager" : "lazy"}
            referrerPolicy="no-referrer"
            draggable={false}
            className={cn(box, "shrink-0 snap-center object-cover")}
          />
        ))}
      </div>
      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(i - 1)}
            disabled={i === 0}
            aria-label={t("place.photoPrev")}
            className="absolute top-1/2 left-3 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow disabled:invisible md:grid"
          >
            <ChevronLeft className="h-7 w-7" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            disabled={i === n - 1}
            aria-label={t("place.photoNext")}
            className="absolute top-1/2 right-3 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow disabled:invisible md:grid"
          >
            <ChevronRight className="h-7 w-7" aria-hidden />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-2" aria-hidden>
            {photos.map((src, j) => (
              <span key={src} className={cn("h-2.5 w-2.5 rounded-full shadow", j === i ? "bg-white" : "bg-white/50")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Text, price, links, map ---------- */

function Details({ stay: s, titleId, names }: { stay: Stay; titleId: string; names: (who: string) => string }) {
  const { t, tn, lang } = useI18n();
  const who = names(s.who);
  const maps = mapsUrl(s);
  const note = s.note ? (lang === "lv" ? s.note.lv : s.note.en) || s.note.en || s.note.lv : "";
  const host = s.url ? hostOf(s.url) : "";
  const listing = /booking\.com$/.test(host) ? t("place.openBooking") : /airbnb\./.test(host) ? t("place.openAirbnb") : t("stay.listing");
  const pin =
    s.lat != null && s.lng != null
      ? JSON.stringify([{ id: s.id, lat: s.lat, lng: s.lng, label: pinLabel(s), group: s.who, booked: s.booked, title: s.name }])
      : null;
  const facts: [ReactNode, string][] = [];
  if (s.seaMin != null && s.seaMin > 0) facts.push([<Waves key="s" className="h-6 w-6" />, tn("stay.sea", s.seaMin)]);
  if (s.walkMin != null && s.walkMin > 0) facts.push([<Footprints key="w" className="h-6 w-6" />, tn("stay.walk", s.walkMin)]);
  if (s.driveMin != null && s.driveMin > 0) facts.push([<Car key="d" className="h-6 w-6" />, tn("stay.drive", s.driveMin)]);
  if (s.bedrooms != null && s.bedrooms > 0) facts.push([<BedDouble key="b" className="h-6 w-6" />, tn("stay.bedrooms", s.bedrooms)]);
  if (s.sleeps != null && s.sleeps > 0) facts.push([<Users key="p" className="h-6 w-6" />, tn("stay.sleeps", s.sleeps)]);
  if (s.floor?.trim()) facts.push([<Building2 key="f" className="h-6 w-6" />, t("stay.floor", { v: s.floor.trim() })]);

  return (
    <div className="space-y-6 p-5 md:p-8">
      <div>
        <h2 id={titleId} className="text-3xl font-extrabold break-words md:text-4xl">
          {s.name}
        </h2>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg">
          <span className="font-bold">{s.area}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-base font-bold",
              s.booked ? "bg-good text-on-good" : "bg-soft",
            )}
          >
            {s.booked ? <CircleCheck className="h-4 w-4" aria-hidden /> : <CircleDashed className="h-4 w-4" aria-hidden />}
            {s.booked ? t("stay.booked") : t("stay.maybe")}
          </span>
        </p>
      </div>

      <PriceInfo stay={s} />

      {s.url && (
        <a
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-primary px-6 text-lg font-extrabold text-on-primary md:inline-flex md:w-auto"
        >
          {listing} <ExternalLink className="h-5 w-5" aria-hidden />
          <span className="sr-only">{t("place.newTab")}</span>
        </a>
      )}

      <dl className="space-y-4">
        {who && (
          <div>
            <dt className="text-base font-bold text-muted">{t("stay.who")}</dt>
            <dd>{who}</dd>
          </div>
        )}
        {s.address && (
          <div>
            <dt className="text-base font-bold text-muted">{t("stay.address")}</dt>
            <dd className="break-words">{s.address}</dd>
          </div>
        )}
        {note && (
          <div>
            <dt className="text-base font-bold text-muted">{t("place.note")}</dt>
            <dd className="whitespace-pre-line">{note}</dd>
          </div>
        )}
      </dl>

      {facts.length > 0 && (
        <ul className="space-y-2">
          {facts.map(([icon, text]) => (
            <li key={text} className="flex items-center gap-3">
              <span className="shrink-0 text-muted" aria-hidden>
                {icon}
              </span>
              {text}
            </li>
          ))}
        </ul>
      )}

      {pin && (
        <div data-noswipe>
          <h3 className="mb-2 text-xl font-extrabold">{t("place.where")}</h3>
          <Suspense fallback={<div className="h-56 animate-pulse rounded-[var(--radius-card)] bg-soft md:h-72" />}>
            <StaysMap
              pinsJson={pin}
              label={t("place.mapLabel", { name: s.name })}
              airportLabel={t("map.airport")}
              className="h-56 rounded-[var(--radius-card)] border md:h-72"
            />
          </Suspense>
        </div>
      )}
      {maps && (
        <a
          href={maps}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-soft px-5 font-bold text-primary"
        >
          {t("stay.maps")} <ExternalLink className="h-5 w-5" aria-hidden />
          <span className="sr-only">{t("place.newTab")}</span>
        </a>
      )}
    </div>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}
