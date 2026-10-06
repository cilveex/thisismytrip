import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CircleCheck, CircleDashed, Star, X } from "lucide-react";
import { eur } from "@/lib/budget";
import { NIGHTS, type Who } from "@/lib/trip-data";
import { cn } from "@/lib/cn";
import { PlaceCover } from "./PlaceDialog";
import { useI18n, type Key } from "./i18n";
import type { Stay } from "./stay-format";

interface Row {
  key: string;
  label: string;
  /** Cell content; null shows "–" */
  show: (s: Stay) => ReactNode;
  /** For picking the best value in the row */
  num?: (s: Stay) => number | null | undefined;
  best?: "min" | "max";
  bestLabel?: Key;
}

/** Places side by side, one tab per group. On phones the row names stay put and the places scroll sideways. */
export function CompareDialog({
  open,
  onClose,
  stays,
  groups,
  group,
  onOpen,
}: {
  open: boolean;
  onClose: () => void;
  stays: Stay[];
  groups: Who[];
  group: (who: Who) => string;
  /** Open a place's details */
  onOpen: (id: string) => void;
}) {
  const { t, tn } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const tabsId = useId();
  const [picked, setPicked] = useState<Who | null>(null);
  const tab = picked && groups.includes(picked) ? picked : (groups[0] ?? "family");
  const places = stays.filter((s) => s.who === tab);

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
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [open]);

  const min = (n: number | null | undefined) => (n == null ? null : t("compare.min", { n }));
  const rows: Row[] = [
    { key: "who", label: t("compare.who"), show: (s) => group(s.who) },
    {
      key: "total",
      label: tn("price.total", NIGHTS),
      show: (s) => s.price && `${s.price.estimate ? "≈ " : ""}${eur(s.price.total)}`,
      num: (s) => s.price?.total,
      best: "min",
      bestLabel: "compare.cheapest",
    },
    {
      key: "person",
      label: t("compare.perPerson"),
      show: (s) => (s.price && s.price.people > 0 ? eur(s.price.perPerson) : null),
      num: (s) => (s.price && s.price.people > 0 ? s.price.perPerson : null),
      best: "min",
      bestLabel: "compare.cheapest",
    },
    {
      key: "night",
      label: t("price.perNight"),
      show: (s) => s.price && eur(s.price.perNight),
      num: (s) => s.price?.perNight,
      best: "min",
      bestLabel: "compare.cheapest",
    },
    { key: "bedrooms", label: t("compare.bedrooms"), show: (s) => s.bedrooms, num: (s) => s.bedrooms, best: "max", bestLabel: "compare.most" },
    {
      key: "sleeps",
      label: t("compare.sleeps"),
      show: (s) => (s.sleeps == null ? null : tn("compare.people", s.sleeps)),
      num: (s) => s.sleeps,
      best: "max",
      bestLabel: "compare.most",
    },
    { key: "floor", label: t("compare.floor"), show: (s) => s.floor?.trim() || null },
    { key: "sea", label: t("compare.sea"), show: (s) => min(s.seaMin), num: (s) => s.seaMin, best: "min", bestLabel: "compare.shortest" },
    { key: "other", label: t("compare.other"), show: (s) => min(s.walkMin), num: (s) => s.walkMin, best: "min", bestLabel: "compare.shortest" },
    { key: "drive", label: t("compare.drive"), show: (s) => min(s.driveMin), num: (s) => s.driveMin, best: "min", bestLabel: "compare.shortest" },
    {
      key: "status",
      label: t("compare.status"),
      show: (s) => (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 font-bold", s.booked ? "bg-good text-on-good" : "bg-soft")}>
          {s.booked ? <CircleCheck className="h-4 w-4" aria-hidden /> : <CircleDashed className="h-4 w-4" aria-hidden />}
          {s.booked ? t("stay.booked") : t("stay.maybe")}
        </span>
      ),
    },
  ];

  /** Indexes of the best places in a row; none when fewer than two have a value or all are equal */
  const bestOf = (r: Row) => {
    if (!r.num || !r.best) return new Set<number>();
    const vals = places.map((s) => r.num!(s)).map((v) => (v == null ? null : v));
    const nums = vals.filter((v): v is number => v != null);
    if (nums.length < 2 || nums.every((v) => v === nums[0])) return new Set<number>();
    const target = r.best === "min" ? Math.min(...nums) : Math.max(...nums);
    return new Set(vals.flatMap((v, i) => (v === target ? [i] : [])));
  };

  const onTabKey = (e: KeyboardEvent) => {
    const i = groups.indexOf(tab);
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? groups.length - 1 : null;
    if (to == null) return;
    e.preventDefault();
    const next = groups[(to + groups.length) % groups.length]!;
    setPicked(next);
    document.getElementById(`${tabsId}-${next}`)?.focus();
  };

  const anyEstimate = places.some((s) => s.price?.estimate);

  return (
    <dialog
      ref={ref}
      className="compare-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
    >
      {open && (
        <div className="flex h-full flex-col">
          <header className="shrink-0 border-b bg-card pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 md:px-6">
              <h2 id={titleId} className="text-xl font-extrabold md:text-3xl">
                {t("compare.title")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("compare.close")}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full hover:bg-soft"
              >
                <X className="h-7 w-7" aria-hidden />
              </button>
            </div>
            {groups.length > 1 && (
              <div role="tablist" aria-label={t("compare.tabs")} className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:px-6" onKeyDown={onTabKey}>
                {groups.map((w) => (
                  <button
                    key={w}
                    id={`${tabsId}-${w}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === w}
                    aria-controls={`${tabsId}-panel`}
                    tabIndex={tab === w ? 0 : -1}
                    onClick={() => setPicked(w)}
                    className={cn(
                      "inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-extrabold whitespace-nowrap md:px-5",
                      tab === w ? "bg-ink text-bg" : "bg-soft",
                    )}
                  >
                    <span className={cn("h-3 w-3 rounded-full border border-white", `sw-${w}`)} aria-hidden />
                    {group(w)}
                    <span className="hidden tabular-nums opacity-75 md:inline">({stays.filter((s) => s.who === w).length})</span>
                  </button>
                ))}
              </div>
            )}
            {places.length > 1 && <p className="px-4 pb-2 text-base text-muted md:hidden">{t("compare.swipe")}</p>}
          </header>

          <div
            id={`${tabsId}-panel`}
            role={groups.length > 1 ? "tabpanel" : undefined}
            aria-labelledby={groups.length > 1 ? `${tabsId}-${tab}` : undefined}
            className="min-h-0 flex-1 overflow-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
          >
            <div className="mx-auto w-fit min-w-full md:min-w-0 md:p-6">
              <table className="border-separate border-spacing-0 text-left text-base md:text-lg">
                <caption className="sr-only">
                  {t("compare.title")}: {group(tab)}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="sticky top-0 left-0 z-30 border-b bg-bg p-3 align-bottom font-bold text-muted">
                      {t("compare.place")}
                    </th>
                    {places.map((s) => (
                      <th key={s.id} scope="col" className="sticky top-0 z-20 border-b bg-bg p-2 align-top font-normal">
                        <button
                          type="button"
                          onClick={() => onOpen(s.id)}
                          className="group flex w-full flex-col gap-2 rounded-xl text-left"
                        >
                          <PlaceCover stay={s} small className="h-20 w-full rounded-xl md:h-32" />
                          <span className="line-clamp-2 font-display text-lg leading-tight font-extrabold underline-offset-4 group-hover:underline">
                            {s.name}
                          </span>
                          <span className="sr-only">{t("compare.open1", { name: s.name })}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const best = bestOf(r);
                    return (
                      <tr key={r.key}>
                        <th
                          scope="row"
                          className="sticky left-0 z-10 w-[8.5rem] min-w-[8.5rem] border-b bg-bg p-3 align-top text-base leading-snug font-bold md:w-56 md:min-w-56"
                        >
                          {r.label}
                        </th>
                        {places.map((s, i) => {
                          const v = r.show(s);
                          const isBest = best.has(i);
                          return (
                            <td
                              key={s.id}
                              className={cn(
                                "w-[11rem] min-w-[11rem] border-b p-3 align-top tabular-nums md:w-60 md:min-w-60",
                                isBest ? "bg-good/15 font-extrabold" : "bg-card",
                              )}
                            >
                              {v == null || v === "" ? (
                                <span className="text-muted">
                                  <span aria-hidden>–</span>
                                  <span className="sr-only">{t("compare.empty")}</span>
                                </span>
                              ) : (
                                v
                              )}
                              {isBest && r.bestLabel && (
                                <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-good px-2 py-0.5 text-sm font-bold text-on-good">
                                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden /> {t(r.bestLabel)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {anyEstimate && <p className="p-4 text-base text-muted md:px-0">{t("compare.estimate")}</p>}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
