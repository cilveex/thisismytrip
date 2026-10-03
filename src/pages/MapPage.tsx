import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CloudSun, Hand, MapPin } from "lucide-react";
import { useTrip } from "@/lib/trip-store";
import { choosePlanningArea, computeBudget, eur } from "@/lib/budget";
import { useImportant } from "@/lib/toast";
import { NIGHTS, areaById } from "@/lib/trip-data";
import { daysUntilDeparture } from "@/lib/dates";
import { isTouch } from "@/lib/device";
import { Button, LeftPill, Score, Sheet } from "@/components/ui";
import { cn } from "@/lib/cn";

// Leaflet is ~150 kB; load it with the map, not with the app shell.
const TenerifeMap = lazy(() => import("@/components/TenerifeMap"));

function useCountdown() {
  const [days, setDays] = useState(daysUntilDeparture);
  useEffect(() => {
    const t = setInterval(() => setDays(daysUntilDeparture()), 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return days;
}

export default function MapPage() {
  const { trip, update } = useTrip();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);
  const days = useCountdown();
  const important = useImportant();
  if (!trip) return null;

  const b = computeBudget(trip);
  const planning = areaById(trip, trip.planningArea);
  const sel = openId ? areaById(trip, openId) : null;
  const selB = sel ? computeBudget(trip, { areaId: sel.id, familyAptId: null, coupleAptId: null }) : null;

  return (
    <div className="space-y-6">
      <section className="bg-hero overflow-hidden rounded-[1.75rem] p-5 md:grid md:grid-cols-[1fr_auto] md:items-end md:gap-10 md:p-10">
        <div>
          <p className="text-sm font-bold opacity-85 md:text-base">
            Riga → Tenerife South · {b.people} travellers · {NIGHTS} nights
          </p>
          <h1 className="mt-2 text-[2.4rem] font-extrabold md:text-6xl">
            Tenerife,
            <br />8–15 December
          </h1>
        </div>
        <div>
          <dl className="mt-5 grid grid-cols-2 gap-4 md:mt-0 md:gap-8">
            <Stat k="Days to go" v={days === 0 ? "Today!" : String(days)} />
            <Stat k="Shared pool" v={eur(b.pool)} />
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <LeftPill left={b.left} className="px-4 py-2 text-lg" />
            <span className="opacity-85">planning in {planning.name}</span>
          </div>
        </div>
      </section>

      <aside className="surface flex gap-3 p-4" aria-label="Weather">
        <CloudSun className="mt-0.5 h-7 w-7 shrink-0 text-primary" aria-hidden />
        <p>
          <strong>December weather:</strong> about 22 °C by day and 16 °C at night in the south, sea around 21 °C.
          The north is cloudier. Teide is 5–10 °C — bring warm jackets.
        </p>
      </aside>

      <section aria-labelledby="map-h">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 id="map-h" className="text-2xl font-extrabold">
            Where to stay
          </h2>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="pin pin-area !h-6 !w-6 !text-xs" aria-hidden>
                5
              </span>
              Area · easy for grandma 1–5
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="pin pin-sight" aria-hidden /> Sight
            </span>
          </p>
        </div>

        <Suspense fallback={<div className="h-[380px] animate-pulse rounded-[var(--radius-card)] bg-soft md:h-[560px]" />}>
          <TenerifeMap areas={trip.areas} activeId={trip.planningArea} onArea={setOpenId} />
        </Suspense>
        {isTouch() && (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <Hand className="h-4 w-4" aria-hidden /> Use two fingers to move or zoom the map.
          </p>
        )}

        <h3 className="mt-5 mb-2 text-lg font-extrabold">All areas</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {trip.areas.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setOpenId(a.id)}
                className={cn(
                  "surface flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left",
                  a.id === trip.planningArea && "outline-3 outline-primary",
                )}
              >
                <span className="pin pin-area !h-9 !w-9 shrink-0 !text-base" aria-hidden>
                  {a.score}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{a.name}</span>
                  <span className="block text-sm text-muted">
                    {a.driveMin} min from airport
                    {a.id === trip.planningArea && " · planning here"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Sheet open={!!sel} onClose={() => setOpenId(null)} title={sel?.name ?? ""}>
        {sel && selB && (
          <div className="space-y-4 pt-2">
            <p className="text-muted">{sel.description}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-2 font-bold">
                Easy for grandma <Score n={sel.score} />
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted" aria-hidden />
                {sel.driveMin} min · {sel.km} km from TFS
              </span>
            </div>
            <p>
              <strong className="text-good">Good:</strong> {sel.pros}
            </p>
            <p>
              <strong className="text-bad">Watch out:</strong> {sel.cons}
            </p>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Mini k="Family / night" v={eur(sel.family)} />
              <Mini k="Couple / night" v={eur(sel.couple)} />
              <Mini k="Airport taxi" v={eur(sel.minivan)} />
            </dl>
            <p className="flex flex-wrap items-center gap-2">
              With this area's estimates: <LeftPill left={selB.left} />
            </p>
            {sel.id === trip.planningArea ? (
              <Button
                variant="secondary"
                className="h-12 w-full"
                onClick={() => {
                  setOpenId(null);
                  navigate("/plan/budget");
                }}
              >
                You're planning here — open the budget
              </Button>
            ) : (
              <Button
                className="h-12 w-full text-lg"
                onClick={() => {
                  const r = choosePlanningArea(trip, trip, sel.id);
                  update((s) => {
                    s.planningArea = r.planningArea;
                    s.familyAptId = r.familyAptId;
                  });
                  if (r.message) important(r.message, "budget");
                  setOpenId(null);
                  navigate("/plan/budget");
                }}
              >
                Plan around this area
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-sm opacity-85">{k}</dt>
      <dd className="font-display text-3xl font-extrabold tabular-nums">{v}</dd>
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-soft p-2">
      <dt className="text-xs font-bold text-muted">{k}</dt>
      <dd className="text-lg font-extrabold tabular-nums">{v}</dd>
    </div>
  );
}
