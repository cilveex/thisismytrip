import { useState, type FormEvent } from "react";
import { Check, ExternalLink, Link2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useTrip } from "@/lib/trip-store";
import { aptTotal, computeBudget, eur, groupLabel } from "@/lib/budget";
import {
  NIGHTS,
  areaById,
  guessArea,
  nameFromLink,
  uid,
  type Apartment,
  type Area,
  type Status,
  type Who,
} from "@/lib/trip-data";
import { Button, LeftPill, NumField, PageHead, Score, SelectField, Switch, TextArea, TextField } from "@/components/ui";
import { cn } from "@/lib/cn";

export default function StayPage() {
  const { trip } = useTrip();
  if (!trip) return null;
  return (
    <div className="space-y-10">
      <PageHead title="Stay" sub="Compare areas, collect places, pick one per group for the budget.">
        <a
          href="#add-place"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-on-primary"
        >
          <Plus className="h-5 w-5" aria-hidden /> Add place
        </a>
      </PageHead>

      <section aria-labelledby="areas-h">
        <h2 id="areas-h" className="mb-3 text-2xl font-extrabold">
          Areas
        </h2>
        <p className="mb-4 text-muted">Left/over uses each area's own price estimates.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trip.areas.map((a) => (
            <AreaCard key={a.id} area={a} />
          ))}
        </div>
      </section>

      <Places />
    </div>
  );
}

/* ---------------- Areas ---------------- */

function AreaCard({ area }: { area: Area }) {
  const { trip, update } = useTrip();
  const [edit, setEdit] = useState(false);
  if (!trip) return null;
  const active = trip.planningArea === area.id;
  const b = computeBudget(trip, { areaId: area.id, familyAptId: null, coupleAptId: null });
  const places = trip.apartments.filter((x) => x.area === area.id && x.status !== "no").length;
  const set = (patch: Partial<Area>) =>
    update((s) => {
      const a = s.areas.find((x) => x.id === area.id);
      if (a) Object.assign(a, patch);
    });

  return (
    <article className={cn("surface flex flex-col p-4", active && "outline-3 outline-primary")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-extrabold">{area.name}</h3>
        {active && (
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-sm font-bold text-on-accent">
            Planning
          </span>
        )}
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <Score n={area.score} /> {area.driveMin} min · {area.km} km from airport
      </p>
      <p className="mt-2 text-sm">
        <strong className="text-good">Good:</strong> {area.pros}
      </p>
      <p className="text-sm">
        <strong className="text-bad">Watch out:</strong> {area.cons}
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <Est k="Family/night" v={eur(area.family)} />
        <Est k="Couple/night" v={eur(area.couple)} />
        <Est k="Airport taxi" v={eur(area.minivan)} />
      </dl>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LeftPill left={b.left} />
          {places > 0 && (
            <span className="text-sm text-muted">
              {places} place{places > 1 ? "s" : ""} saved
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!active && (
            <Button
              variant="secondary"
              onClick={() =>
                update((s) => {
                  s.planningArea = area.id;
                })
              }
            >
              Plan here
            </Button>
          )}
          <Button variant="ghost" onClick={() => setEdit((e) => !e)} aria-expanded={edit}>
            {edit ? "Done" : "Edit estimates"}
          </Button>
        </div>
      </div>
      {edit && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumField label="Family €/night" value={area.family} onChange={(v) => set({ family: v ?? 0 })} />
          <NumField label="Couple €/night" value={area.couple} onChange={(v) => set({ couple: v ?? 0 })} />
          <NumField label="Taxi one way €" value={area.minivan} onChange={(v) => set({ minivan: v ?? 0 })} />
          <NumField
            label="Grandma score 1–5"
            min={1}
            max={5}
            value={area.score}
            onChange={(v) => set({ score: Math.min(5, Math.max(1, Math.round(v ?? 1))) })}
          />
          <NumField label="Drive" suffix="min" value={area.driveMin} onChange={(v) => set({ driveMin: v ?? 0 })} />
          <NumField label="Distance" suffix="km" value={area.km} onChange={(v) => set({ km: v ?? 0 })} />
        </div>
      )}
    </article>
  );
}

function Est({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-soft px-1 py-2">
      <dt className="text-xs font-bold text-muted">{k}</dt>
      <dd className="font-extrabold tabular-nums">{v}</dd>
    </div>
  );
}

/* ---------------- Places ---------------- */

const statusOrder: Record<Status, number> = { shortlisted: 0, idea: 1, no: 2 };

function Places() {
  const { trip } = useTrip();
  if (!trip) return null;
  return (
    <section aria-labelledby="apt-h" className="space-y-6">
      <h2 id="apt-h" className="text-2xl font-extrabold">
        Places
      </h2>
      <AddPlace />
      {(["family", "couple"] as Who[]).map((who) => {
        const list = trip.apartments
          .filter((a) => a.who === who)
          .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        const people = trip.travellers.filter((t) => t.apt === who).length;
        return (
          <div key={who}>
            <h3 className="mb-1 text-xl font-extrabold">
              {groupLabel(trip, who).replace(/ apartment$/, "")}{" "}
              <span className="font-sans text-base font-normal text-muted">
                · {people} {people === 1 ? "person" : "people"}
              </span>
            </h3>
            {list.length === 0 ? (
              <p className="text-muted">No places yet — the budget uses the area estimate.</p>
            ) : (
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {list.map((a) => (
                  <AptCard key={a.id} apt={a} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

interface Draft {
  url: string;
  name: string;
  who: Who;
  area: string;
  total: number | null;
  floor: string;
  notes: string;
}
const emptyDraft: Draft = { url: "", name: "", who: "family", area: "", total: null, floor: "", notes: "" };

/** Shape returned by /api/extract (step 6). */
interface Extracted {
  name?: string;
  area?: string | null;
  pricePerNight?: number | null;
  total?: number | null;
  nights?: number | null;
  bedrooms?: number | null;
  sleeps?: number | null;
  floor?: string;
  notes?: string;
}

function AddPlace() {
  const { trip, update } = useTrip();
  const [f, setF] = useState<Draft>(emptyDraft);
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  if (!trip) return null;

  const set = (patch: Partial<Draft>) => setF((p) => ({ ...p, ...patch }));

  const onUrl = (url: string) => {
    const name = nameFromLink(url);
    const area = guessArea(url, trip.areas);
    setF((p) => ({ ...p, url, name: name || p.name, area: area ?? p.area }));
  };

  const readText = async () => {
    setReading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url: f.url }),
      });
      if (res.status === 404) throw new Error("The listing reader isn't set up yet.");
      const data = (await res.json().catch(() => ({}))) as Extracted & { error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't read the listing.");
      const total = data.total ?? (data.pricePerNight ? Math.round(data.pricePerNight * NIGHTS) : null);
      const size = [data.bedrooms ? `${data.bedrooms} bedrooms` : "", data.sleeps ? `sleeps ${data.sleeps}` : ""]
        .filter(Boolean)
        .join(", ");
      setF((p) => ({
        ...p,
        name: data.name || p.name,
        area: (data.area && trip.areas.some((a) => a.id === data.area) ? data.area : null) ?? guessArea(text, trip.areas) ?? p.area,
        total: total ?? p.total,
        floor: data.floor || p.floor,
        notes: [size, data.notes].filter(Boolean).join("\n") || p.notes,
      }));
      setMsg({ kind: "ok", text: "Filled in from the listing — check the fields, then save." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Couldn't read the listing." });
    } finally {
      setReading(false);
    }
  };

  const canSave = !!f.area && !!(f.name.trim() || f.url.trim());

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const apt: Apartment = {
      id: uid(),
      name: f.name.trim() || "Unnamed place",
      url: f.url.trim(),
      who: f.who,
      area: f.area,
      total: f.total,
      walkMin: null,
      floor: f.floor,
      notes: f.notes,
      status: "idea",
    };
    update((s) => {
      s.apartments.push(apt);
    });
    setMsg({ kind: "ok", text: `Added “${apt.name}” for ${f.who === "family" ? "the family" : "the couple"}.` });
    setF({ ...emptyDraft, who: f.who });
    setText("");
  };

  return (
    <form id="add-place" onSubmit={save} className="surface scroll-mt-20 space-y-4 p-4 md:p-5">
      <h3 className="text-xl font-extrabold">Add a place</h3>
      <div>
        <TextField
          type="url"
          label="Booking.com or Airbnb link"
          value={f.url}
          onChange={onUrl}
          placeholder="https://www.booking.com/hotel/es/…"
        />
        {f.url && f.name && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-good">
            <Link2 className="h-4 w-4" aria-hidden /> Name taken from the link — edit it if needed.
          </p>
        )}
      </div>
      <TextField label="Name" value={f.name} onChange={(v) => set({ name: v })} />
      <fieldset>
        <legend className="mb-1 text-sm font-bold text-muted">Who is it for</legend>
        <Segmented<Who>
          value={f.who}
          onChange={(who) => set({ who })}
          options={[
            { value: "family", label: "Family" },
            { value: "couple", label: groupLabel(trip, "couple").replace(/ apartment$/, "") },
          ]}
        />
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Area"
          value={f.area}
          onChange={(area) => set({ area })}
          options={[{ value: "", label: "Choose area…" }, ...trip.areas.map((a) => ({ value: a.id, label: a.name }))]}
        />
        <NumField
          label={`Total for ${NIGHTS} nights`}
          prefix="€"
          value={f.total}
          onChange={(total) => set({ total })}
        />
      </div>
      {f.total == null && f.area && (
        <p className="-mt-2 text-sm text-muted">
          Leave empty to use the area estimate (
          {eur((f.who === "family" ? areaById(trip, f.area).family : areaById(trip, f.area).couple) * NIGHTS)}).
        </p>
      )}

      <details className="rounded-xl bg-soft p-3">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold">
          <Sparkles className="h-4 w-4" aria-hidden /> Paste the listing page text (optional)
        </summary>
        <p className="mt-1 text-sm text-muted">
          Not working yet — the listing reader arrives in a later update. When it's ready, it fills in the name,
          area, price, floor and lift info for you.
        </p>
        <TextArea
          className="mt-3"
          label="Listing page text"
          rows={5}
          value={text}
          onChange={setText}
          placeholder="On the listing page: select all, copy, and paste here"
        />
        <Button
          variant="secondary"
          className="mt-3 bg-card"
          disabled={reading || text.trim().length < 40}
          onClick={readText}
        >
          <Sparkles className="h-4 w-4" aria-hidden /> {reading ? "Reading…" : "Fill in from text"}
        </Button>
      </details>

      {(f.floor || f.notes) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Floor / lift / stairs" value={f.floor} onChange={(v) => set({ floor: v })} />
          <TextArea label="Notes" rows={3} value={f.notes} onChange={(v) => set({ notes: v })} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-12 w-full text-lg sm:w-auto" disabled={!canSave}>
          <Plus className="h-5 w-5" aria-hidden /> Save place
        </Button>
        {!canSave && <span className="text-sm text-muted">Add a link or name, and choose the area.</span>}
      </div>
      <p
        role="status"
        className={cn("min-h-6 text-sm font-bold", msg?.kind === "err" ? "text-bad" : "text-good")}
      >
        {msg?.text}
      </p>
    </form>
  );
}

const statusLabels: { value: Status; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "no", label: "Not for us" },
];

function AptCard({ apt }: { apt: Apartment }) {
  const { trip, update } = useTrip();
  if (!trip) return null;
  const key = apt.who === "family" ? "familyAptId" : "coupleAptId";
  const inUse = trip[key] === apt.id;
  const total = aptTotal(trip, apt.id, apt.who, apt.area);
  const withThis = computeBudget(trip, { areaId: apt.area, [key]: apt.id });
  const set = (patch: Partial<Apartment>) =>
    update((s) => {
      const a = s.apartments.find((x) => x.id === apt.id);
      if (a) Object.assign(a, patch);
    });
  const perNight = apt.total == null ? null : Math.round(apt.total / NIGHTS);

  return (
    <article
      className={cn(
        "surface space-y-4 p-4",
        inUse && "outline-3 outline-good",
        apt.status === "no" && "opacity-75",
      )}
      aria-label={apt.name}
    >
      <div className="flex items-end gap-2">
        <TextField className="flex-1" label="Name" value={apt.name} onChange={(v) => set({ name: v })} />
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-soft hover:text-bad"
          aria-label={`Delete ${apt.name}`}
          onClick={() => {
            if (!window.confirm(`Delete “${apt.name}”?`)) return;
            update((s) => {
              s.apartments = s.apartments.filter((x) => x.id !== apt.id);
              if (s[key] === apt.id) s[key] = null;
            });
          }}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-bold text-muted">Status</legend>
        <Segmented<Status> value={apt.status} onChange={(status) => set({ status })} options={statusLabels} small />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          className="col-span-2"
          label="Area"
          value={apt.area}
          onChange={(v) =>
            update((s) => {
              const a = s.apartments.find((x) => x.id === apt.id);
              if (a) a.area = v;
              if (inUse) s.planningArea = v;
            })
          }
          options={trip.areas.map((a) => ({ value: a.id, label: a.name }))}
        />
        <NumField label={`Total ${NIGHTS} nights`} prefix="€" value={apt.total} onChange={(v) => set({ total: v })} />
        <NumField
          label="Per night"
          prefix="€"
          value={perNight}
          onChange={(v) => set({ total: v == null ? null : v * NIGHTS })}
        />
        <NumField
          label="Walk to other apt"
          suffix="min"
          value={apt.walkMin}
          onChange={(v) => set({ walkMin: v })}
        />
        <TextField label="Floor / lift" value={apt.floor} onChange={(v) => set({ floor: v })} />
      </div>
      {apt.total == null && (
        <p className="text-sm text-muted">
          No price yet — using the area estimate, {eur(total)} for {NIGHTS} nights.
        </p>
      )}
      <TextArea label="Notes" rows={2} value={apt.notes} onChange={(v) => set({ notes: v })} />
      {apt.url && (
        <a
          href={apt.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline"
        >
          Open listing <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t pt-3">
        <Switch
          label="Use in budget"
          checked={inUse}
          onChange={(on) =>
            update((s) => {
              s[key] = on ? apt.id : null;
              if (on) s.planningArea = apt.area;
            })
          }
        />
        <LeftPill left={withThis.left} prefix="With this: " />
      </div>
    </article>
  );
}

/* ---------------- Segmented control ---------------- */

function Segmented<T extends string>({
  value,
  onChange,
  options,
  small,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  small?: boolean;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-soft p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-1 rounded-full px-2 font-bold",
              small && "text-sm",
              on ? "bg-card shadow" : "text-muted",
            )}
          >
            {on && !small && <Check className="h-4 w-4 shrink-0" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
