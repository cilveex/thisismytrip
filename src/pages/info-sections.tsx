import { useId } from "react";
import { Clock, Plane, Plus, Trash2 } from "lucide-react";
import { formatLocal, hasTime, leaveAt, meetAt } from "@/lib/flights";
import { uid, type Flight, type Flights, type GoodToKnow } from "@/lib/trip-data";
import { Button, NumField, TextArea, TextField } from "@/components/ui";

type Patch<T> = (p: Partial<T>) => void;

function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-sm font-bold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        className="field tabular-nums"
        min="2026-12-01T00:00"
        max="2026-12-31T23:59"
        value={hasTime(value) ? value.slice(0, 16) : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FlightCard({
  title,
  f,
  onChange,
  transfer,
}: {
  title: string;
  f: Flight;
  onChange: Patch<Flight>;
  /** Return flight only */
  transfer?: { value: number; onChange: (v: number) => void; leave: string };
}) {
  const meet = meetAt(f);
  return (
    <div className="space-y-3 rounded-xl border p-3">
      <h3 className="flex items-center gap-2 text-lg font-extrabold">
        <Plane className="h-5 w-5 text-primary" aria-hidden /> {title}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Airline" value={f.airline} onChange={(airline) => onChange({ airline })} />
        <TextField
          label="Flight number"
          value={f.number}
          onChange={(v) => onChange({ number: v.toUpperCase().replace(/\s+/g, "") })}
          placeholder="BT671"
        />
        <TextField label="From (airport)" value={f.from} onChange={(v) => onChange({ from: v.toUpperCase() })} />
        <TextField label="To (airport)" value={f.to} onChange={(v) => onChange({ to: v.toUpperCase() })} />
        <DateTimeField label={`Departs (${f.from || "local"} time)`} value={f.depart} onChange={(depart) => onChange({ depart })} />
        <DateTimeField label={`Arrives (${f.to || "local"} time)`} value={f.arrive} onChange={(arrive) => onChange({ arrive })} />
        <NumField
          label="Meet at airport, before"
          suffix="min"
          value={f.meetBeforeMin}
          onChange={(v) => onChange({ meetBeforeMin: v ?? 0 })}
        />
        {transfer && (
          <NumField
            label="Apartment → airport"
            suffix="min"
            value={transfer.value}
            onChange={(v) => transfer.onChange(v ?? 0)}
          />
        )}
      </div>
      <ul className="space-y-1 text-sm">
        <li className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          {meet ? (
            <span>
              Meet at the airport: <strong>{formatLocal(meet)}</strong>
            </span>
          ) : (
            <span className="text-muted">Add the departure time to see when to meet.</span>
          )}
        </li>
        {transfer?.leave && (
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <span>
              Leave the apartment: <strong>{formatLocal(transfer.leave)}</strong>
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

export function FlightsSection({ flights, onChange }: { flights: Flights; onChange: (f: Flights) => void }) {
  const set = (dir: "outbound" | "return") => (p: Partial<Flight>) =>
    onChange({ ...flights, [dir]: { ...flights[dir], ...p } });
  return (
    <section className="surface space-y-3 p-4 md:p-5" aria-labelledby="flights-h">
      <h2 id="flights-h" className="text-2xl font-extrabold">
        Flights
      </h2>
      <p className="text-muted">Times as printed on the ticket, in each airport's local time.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <FlightCard title="There" f={flights.outbound} onChange={set("outbound")} />
        <FlightCard
          title="Home"
          f={flights.return}
          onChange={set("return")}
          transfer={{
            value: flights.return.transferMin,
            onChange: (transferMin) => onChange({ ...flights, return: { ...flights.return, transferMin } }),
            leave: leaveAt(flights.return),
          }}
        />
      </div>
    </section>
  );
}

export function GoodToKnowSection({
  items,
  onChange,
}: {
  items: GoodToKnow[];
  onChange: (items: GoodToKnow[]) => void;
}) {
  const set = (id: string, p: Partial<GoodToKnow>) => onChange(items.map((g) => (g.id === id ? { ...g, ...p } : g)));
  return (
    <section className="surface p-4 md:p-5" aria-labelledby="gtk-h">
      <h2 id="gtk-h" className="text-2xl font-extrabold">
        Good to know
      </h2>
      <p className="mb-3 text-muted">Short tips for the family page, in Latvian and English. Optional.</p>
      {items.length === 0 && <p className="mb-3 text-muted">Nothing yet.</p>}
      <ul className="divide-y">
        {items.map((g, i) => (
          <li key={g.id} className="py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-extrabold text-muted">Tip {i + 1}</span>
              <button
                type="button"
                onClick={() => {
                  if ((g.lv || g.en) && !window.confirm("Delete this tip?")) return;
                  onChange(items.filter((x) => x.id !== g.id));
                }}
                className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-soft hover:text-bad"
                aria-label={`Delete tip ${i + 1}`}
              >
                <Trash2 className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextArea label="Latviski" rows={2} value={g.lv} onChange={(lv) => set(g.id, { lv })} />
              <TextArea label="English" rows={2} value={g.en} onChange={(en) => set(g.id, { en })} />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-2" onClick={() => onChange([...items, { id: uid(), lv: "", en: "" }])}>
        <Plus className="h-5 w-5" aria-hidden /> Add tip
      </Button>
    </section>
  );
}
