import { useTrip } from "./lib/trip-store";
import { computeBudget, leftLabel } from "./lib/budget";

/** Step 1 connection check — replaced by the real shell in step 2. */
export default function App() {
  const { trip, status, update } = useTrip();
  if (!trip) return <p className="p-4">Loading… ({status})</p>;
  const b = computeBudget(trip);
  return (
    <main className="mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-2xl font-bold">Tenerife 2026 — connection check</h1>
      <p>
        Sync: <strong>{status}</strong>
      </p>
      <p>
        {trip.travellers.length} travellers · pool €{b.pool} · {leftLabel(b.left)}
      </p>
      <label className="flex min-h-11 items-center gap-2">
        Pool per person
        <input
          type="number"
          inputMode="numeric"
          className="w-28 rounded border px-2 py-2"
          value={trip.budget.poolPerPerson}
          onChange={(e) => update((d) => void (d.budget.poolPerPerson = Number(e.target.value) || 0))}
        />
      </label>
      <p className="text-sm opacity-70">Open this page in two tabs and change the number — the other tab should follow.</p>
    </main>
  );
}
