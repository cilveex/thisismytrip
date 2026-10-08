import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AREA_PHOTOS, areaFull, areaThumb, type AreaPhoto } from "@/lib/area-photos";
import { cn } from "@/lib/cn";
import { useI18n } from "./i18n";

const openIndex = () => {
  const i = (window.history.state as { area?: number } | null)?.area;
  return typeof i === "number" && i >= 0 && i < AREA_PHOTOS.length ? i : null;
};

/** Big cover photo, a grid of thumbnails, and a full-screen viewer. The back button closes the viewer. */
export function AreaGallery() {
  const { t, lang } = useI18n();
  const [index, setIndex] = useState<number | null>(openIndex);
  const n = AREA_PHOTOS.length;
  const alt = (p: AreaPhoto) => p.alt[lang] || p.alt.en || p.alt.lv;

  useEffect(() => {
    const onPop = () => setIndex(openIndex());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!n) return null;
  const url = window.location.pathname + window.location.search + window.location.hash;
  const open = (i: number) => {
    if (index == null) window.history.pushState({ area: i }, "", url);
    else window.history.replaceState({ area: i }, "", url);
    setIndex(i);
  };
  const close = () => {
    if (openIndex() != null) window.history.back(); // popstate closes it
    else setIndex(null);
  };
  const cover = AREA_PHOTOS[0]!;

  return (
    <div className="mt-8" role="group" aria-label={t("area.photos")}>
      <button
        type="button"
        onClick={() => open(0)}
        aria-label={t("area.open", { i: 1, n, alt: alt(cover) })}
        className="block w-full overflow-hidden rounded-[var(--radius-card)] bg-soft"
      >
        <img
          src={areaFull(cover)}
          alt={alt(cover)}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover md:aspect-[16/9]"
        />
      </button>
      {n > 1 && (
        <ul aria-label={t("area.thumbs")} className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {AREA_PHOTOS.slice(1).map((p, j) => (
            <li key={p.file}>
              <button
                type="button"
                onClick={() => open(j + 1)}
                aria-label={t("area.open", { i: j + 2, n, alt: alt(p) })}
                className="block w-full overflow-hidden rounded-2xl bg-soft"
              >
                <img
                  src={areaThumb(p)}
                  alt={alt(p)}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Lightbox index={index} alt={alt} onIndex={open} onClose={close} />
    </div>
  );
}

function Lightbox({
  index,
  alt,
  onIndex,
  onClose,
}: {
  index: number | null;
  alt: (p: AreaPhoto) => string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const n = AREA_PHOTOS.length;
  const isOpen = index != null;
  const prev = () => isOpen && index > 0 && onIndex(index - 1);
  const next = () => isOpen && index < n - 1 && onIndex(index + 1);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  // Lock the page behind
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = was;
    };
  }, [isOpen]);

  // Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Neighbours load ahead so swiping feels instant
  useEffect(() => {
    if (index == null) return;
    for (const j of [index - 1, index + 1]) {
      const p = AREA_PHOTOS[j];
      if (p) new Image().src = areaFull(p);
    }
  }, [index]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const p = e.touches[0];
    touch.current = p && e.touches.length === 1 ? { x: p.clientX, y: p.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current;
    const p = e.changedTouches[0];
    touch.current = null;
    if (!s || !p) return;
    const dx = p.clientX - s.x;
    const dy = p.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) return void (dx < 0 ? next() : prev());
    if (dy > 90 && dy > 1.5 * Math.abs(dx)) onClose();
  };

  const photo = index != null ? AREA_PHOTOS[index] : undefined;

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={t("area.photos")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => isOpen && onClose()}
    >
      {photo && (
        <div className="flex h-full flex-col text-white" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <header className="flex shrink-0 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
            <p className="px-2 text-lg font-bold tabular-nums" aria-live="polite">
              {t("area.counter", { i: index! + 1, n })}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("area.close")}
              className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/15"
            >
              <X className="h-7 w-7" aria-hidden />
            </button>
          </header>
          <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <img
              key={photo.file}
              src={areaFull(photo)}
              alt={alt(photo)}
              draggable={false}
              className="max-h-full max-w-full object-contain select-none"
            />
            <Arrow dir="prev" disabled={index === 0} onClick={prev} label={t("area.prev")} />
            <Arrow dir="next" disabled={index === n - 1} onClick={next} label={t("area.next")} />
          </div>
          <p className="shrink-0 px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-center text-base opacity-90">{alt(photo)}</p>
        </div>
      )}
    </dialog>
  );
}

function Arrow({ dir, disabled, onClick, label }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "absolute top-1/2 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/30 disabled:invisible md:grid",
        dir === "prev" ? "left-4" : "right-4",
      )}
    >
      {dir === "prev" ? <ChevronLeft className="h-8 w-8" aria-hidden /> : <ChevronRight className="h-8 w-8" aria-hidden />}
    </button>
  );
}
