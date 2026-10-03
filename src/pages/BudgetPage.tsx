import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useTrip } from "@/lib/trip-store";
import { computeBudget, eur, groupLabel, noCarImpact, splitStayWarning, type Line } from "@/lib/budget";
import { NIGHTS, areaById, type TripState, type Who } from "@/lib/trip-data";
import { LeftPill, NumField, PageHead, SelectField, Sheet, Switch, Warning } from "@/components/ui";
import { cn } from "@/lib/cn";

type Update = ReturnType<typeof useTrip>["update"];

export default function BudgetPage() {
  const { trip, update } = useTrip();
  // Car days while dragging: kept local so the slider stays smooth, committed after a pause.
  const [carDraft, setCarDraft] = useState<number | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => () => void (commitTimer.current && clearTimeout(commitTimer.current)), []);
  if (!trip) return null;

  const view: TripState = carDraft == null ? trip : { ...trip, budget: { ...trip.budget, carDays: carDraft } };
  const b = computeBudget(view);

  const onCarDays = (v: number) => {
    setCarDraft(v);
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      update((s) => {
        s.budget.carDays = v;
      });
      setCarDraft(null);
    }, 300);
  };

  const panel = <TryPanel view={view} update={update} onCarDays={onCarDays} />;

  return (
    <div className="pb-20 md:pb-0">
      <PageHead title="Budget" sub={`Shared pool for ${b.people} travellers, ${NIGHTS} nights.`} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Result view={view} />
          <Breakdown view={view} lines={b.lines} total={b.total} />
          <Settings trip={trip} update={update} />
        </div>

        {/* Desktop: sticky side panel */}
        <aside className="surface hidden p-5 lg:sticky lg:top-24 lg:block" aria-labelledby="try-h">
          <h2 id="try-h" className="mb-4 text-xl font-extrabold">
            Try it out
          </h2>
          {panel}
        </aside>
      </div>

      {/* Mobile/tablet: sticky bar above the tab bar, opens the drawer */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-[900] border-t bg-card/95 px-4 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <LeftPill left={b.left} className="text-lg" />
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-on-primary"
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden /> Try it out
          </button>
        </div>
      </div>

      <Sheet open={drawer} onClose={() => setDrawer(false)} title="Try it out">
        <div className="sticky -top-3 z-10 -mx-5 mb-4 border-b bg-card px-5 py-3" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <LeftPill left={b.left} className="text-lg" />
            <span className="text-sm text-muted tabular-nums">
              {eur(b.total)} of {eur(b.pool)}
            </span>
          </div>
        </div>
        {panel}
      </Sheet>
    </div>
  );
}

/* ---------------- Result ---------------- */

function Result({ view }: { view: TripState }) {
  const b = computeBudget(view);
  const ok = b.left >= 0;
  const max = Math.max(b.total, b.pool) || 1;
  const split = splitStayWarning(view);
  const fam = view.familyAptId ? view.apartments.find((a) => a.id === view.familyAptId) : undefined;
  const noCar = !view.budget.useCar ? noCarImpact(view) : null;

  return (
    <section className="surface space-y-4 p-5" aria-labelledby="result-h">
      <h2 id="result-h" className="sr-only">
        Result
      </h2>
      <div>
        <p
          className={cn(
            "font-display text-5xl font-extrabold tabular-nums md:text-6xl",
            ok ? "text-good" : "text-bad",
          )}
        >
          {eur(b.left)} {ok ? "left" : "over"}
        </p>
        <p className="mt-1 text-muted tabular-nums">
          Total {eur(b.total)} · pool {eur(b.pool)} ({eur(view.budget.poolPerPerson)} × {b.people})
        </p>
      </div>

      {/* Stacked bar scaled to the larger of total and pool; the marker shows where the pool ends */}
      <div>
        <div
          className="relative h-8 w-full overflow-hidden rounded-full bg-soft"
          role="img"
          aria-label={`Spending ${eur(b.total)} against a pool of ${eur(b.pool)}`}
        >
          <div className="flex h-full" style={{ width: `${(b.total / max) * 100}%` }}>
            {b.lines
              .filter((l) => l.amount > 0)
              .map((l) => (
                <div key={l.key} style={{ width: `${(l.amount / b.total) * 100}%`, background: l.color }} />
              ))}
          </div>
          <div
            className="absolute inset-y-0 w-1 -translate-x-1/2 bg-ink"
            style={{ left: `${(b.pool / max) * 100}%` }}
            aria-hidden
          />
        </div>
        <div className="relative mt-1 h-5 text-sm text-muted">
          <span className="absolute left-0">€0</span>
          {/* Label sits under the pool marker, kept clear of the edges */}
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${Math.min(80, Math.max(20, (b.pool / max) * 100))}%` }}
          >
            ▲ pool {eur(b.pool)}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-soft p-3">
          <dt className="text-sm font-bold text-muted">Per person</dt>
          <dd className="text-2xl font-extrabold tabular-nums">{eur(b.perPerson)}</dd>
        </div>
        <div className="rounded-xl bg-soft p-3">
          <dt className="text-sm font-bold text-muted">Pool per person</dt>
          <dd className="text-2xl font-extrabold tabular-nums">{eur(view.budget.poolPerPerson)}</dd>
        </div>
      </dl>

      {split && <Warning>{split}</Warning>}
      {fam && fam.area !== view.planningArea && (
        <Warning>
          The family place is in {areaById(view, fam.area).name}, but transfers are planned from{" "}
          {areaById(view, view.planningArea).name}.
        </Warning>
      )}
      {noCar && (
        <p className="rounded-xl bg-accent/20 p-3">
          <strong>No car:</strong> {noCar.places} become organised tours{" "}
          <span className="whitespace-nowrap">(+{eur(noCar.tourExtra)})</span> and {noCar.lateNames} needs an airport
          taxi <span className="whitespace-nowrap">(+{eur(noCar.taxiExtra)})</span>.
        </p>
      )}
    </section>
  );
}

/* ---------------- Breakdown ---------------- */

const lineLinks: Record<string, { to: string; hint: string }> = {
  family: { to: "/stay", hint: "from Stay" },
  couple: { to: "/stay", hint: "from Stay" },
  activities: { to: "/days", hint: "from Days" },
};

function Breakdown({ view, lines, total }: { view: TripState; lines: Line[]; total: number }) {
  const people = view.travellers.length;
  const sub: Record<string, string> = {
    car: view.budget.useCar
      ? `${view.budget.carDays} days × ${eur(view.budget.carRate + view.budget.fuelRate)}`
      : "No car",
    transfers: `${areaById(view, view.planningArea).name}, both ways`,
    food: `${eur(view.budget.foodPerDay)} × ${people} people × ${NIGHTS} days`,
  };
  return (
    <section className="surface p-5" aria-labelledby="breakdown-h">
      <h2 id="breakdown-h" className="mb-3 text-2xl font-extrabold">
        Breakdown
      </h2>
      <ul className="divide-y">
        {lines.map((l) => {
          const link = lineLinks[l.key];
          const content = (
            <>
              <span className="h-4 w-4 shrink-0 rounded" style={{ background: l.color }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn("block font-bold", link && "text-primary underline underline-offset-2")}>
                  {l.label}
                </span>
                {(sub[l.key] || link) && (
                  <span className="block text-sm text-muted">{sub[l.key] ?? link?.hint}</span>
                )}
              </span>
              <span className="text-right tabular-nums">
                <span className="block font-extrabold">{eur(l.amount)}</span>
                <span className="block text-sm text-muted">{total ? Math.round((l.amount / total) * 100) : 0}%</span>
              </span>
              {link && <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />}
            </>
          );
          return (
            <li key={l.key}>
              {link ? (
                <Link to={link.to} className="flex min-h-14 items-center gap-3 py-2 hover:bg-soft/60">
                  {content}
                </Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 py-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex justify-between border-t pt-3 text-lg font-extrabold tabular-nums">
        <span>Total</span>
        <span>{eur(total)}</span>
      </p>
    </section>
  );
}

/* ---------------- Editable lines ---------------- */

function Settings({ trip, update }: { trip: TripState; update: Update }) {
  const b = trip.budget;
  const set = (k: keyof TripState["budget"]) => (v: number | null) =>
    update((s) => {
      (s.budget[k] as number) = v ?? 0;
    });
  return (
    <section className="surface p-5" aria-labelledby="settings-h">
      <h2 id="settings-h" className="mb-1 text-2xl font-extrabold">
        Budget lines
      </h2>
      <p className="mb-4 text-muted">Apartments come from Stay, activities from Days.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <NumField label="Pool per person" prefix="€" value={b.poolPerPerson} onChange={set("poolPerPerson")} />
        <NumField label="Flights, total" prefix="€" value={b.flights} onChange={set("flights")} />
        <NumField label="Food per person/day" prefix="€" value={b.foodPerDay} onChange={set("foodPerDay")} />
        <NumField label="Car rental per day" prefix="€" value={b.carRate} onChange={set("carRate")} />
        <NumField label="Fuel per day" prefix="€" value={b.fuelRate} onChange={set("fuelRate")} />
        <NumField label="Wheelchair / scooter" prefix="€" value={b.mobility} onChange={set("mobility")} />
        <NumField label="Tour per person" prefix="€" value={b.tourPrice} onChange={set("tourPrice")} />
        <NumField label="Buffer" suffix="%" max={50} value={b.bufferPct} onChange={set("bufferPct")} />
      </div>
    </section>
  );
}

/* ---------------- Try it out ---------------- */

function TryPanel({
  view,
  update,
  onCarDays,
}: {
  view: TripState;
  update: Update;
  onCarDays: (v: number) => void;
}) {
  const b = view.budget;
  const carCost = b.carDays * (b.carRate + b.fuelRate);
  const aptOptions = (who: Who) => [
    { value: "", label: "Area estimate" },
    ...view.apartments
      .filter((a) => a.who === who && (a.status !== "no" || a.id === view[who === "family" ? "familyAptId" : "coupleAptId"]))
      .map((a) => ({
        value: a.id,
        label: `${a.name} · ${areaById(view, a.area).name}${a.total != null ? ` · ${eur(a.total)}` : ""}`,
      })),
  ];
  const split = splitStayWarning(view);
  const sliderId = useId(); // panel renders twice (desktop aside + mobile drawer)

  return (
    <div className="space-y-5">
      <Group title="Where">
        <SelectField
          label="Planning area (transfers)"
          value={view.planningArea}
          onChange={(v) =>
            update((s) => {
              s.planningArea = v;
            })
          }
          options={view.areas.map((a) => ({ value: a.id, label: a.name }))}
        />
        <SelectField
          label={groupLabel(view, "family")}
          value={view.familyAptId ?? ""}
          onChange={(v) =>
            update((s) => {
              s.familyAptId = v || null;
              // Transfers follow where the family stays
              const apt = s.apartments.find((a) => a.id === v);
              if (apt) s.planningArea = apt.area;
            })
          }
          options={aptOptions("family")}
        />
        <SelectField
          label={groupLabel(view, "couple")}
          value={view.coupleAptId ?? ""}
          onChange={(v) =>
            update((s) => {
              s.coupleAptId = v || null;
            })
          }
          options={aptOptions("couple")}
        />
        {split && <Warning className="text-sm">{split}</Warning>}
      </Group>

      <Group title="Car">
        <Switch
          label="Rent a car"
          checked={b.useCar}
          onChange={(on) =>
            update((s) => {
              s.budget.useCar = on;
            })
          }
        />
        {b.useCar ? (
          <div>
            <label htmlFor={sliderId} className="flex items-baseline justify-between font-bold">
              <span>Car for {b.carDays} {b.carDays === 1 ? "day" : "days"}</span>
              <span className="tabular-nums">{eur(carCost)}</span>
            </label>
            <input
              id={sliderId}
              type="range"
              min={1}
              max={7}
              step={1}
              value={b.carDays}
              onChange={(e) => onCarDays(Number(e.target.value))}
              className="range mt-2 w-full"
              aria-valuetext={`${b.carDays} days, ${eur(carCost)}`}
            />
            <div className="flex justify-between px-1 text-sm text-muted" aria-hidden>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
        ) : (
          <NoCarNote view={view} />
        )}
      </Group>
    </div>
  );
}

function NoCarNote({ view }: { view: TripState }) {
  const n = noCarImpact(view);
  return (
    <p className="text-sm">
      Activities and transfers go up: {n.places} become tours and {n.lateNames} needs a taxi from the airport.
    </p>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-extrabold tracking-wide text-muted uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}
