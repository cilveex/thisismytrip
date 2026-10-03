import { useId, type ReactNode } from "react";
import { Link } from "react-router";
import { ArchiveRestore, Bus, Car, Lightbulb, Plus, Trash2 } from "lucide-react";
import { useTrip } from "@/lib/trip-store";
import { eur, itemCost } from "@/lib/budget";
import { dayName, uid, type Item, type TripState, type Walk } from "@/lib/trip-data";
import { useToast } from "@/lib/toast";
import { AutoTextarea, Button, NumField, PageHead, Segmented, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";

const walkOptions: { value: Walk; label: string; icon: ReactNode }[] = [
  { value: "little", label: "Little", icon: <Dot className="bg-good" /> },
  { value: "some", label: "Some", icon: <Dot className="bg-accent" /> },
  { value: "lots", label: "Lots", icon: <Dot className="bg-bad" /> },
];

function Dot({ className }: { className: string }) {
  return <span className={cn("h-3 w-3 shrink-0 rounded-full", className)} aria-hidden />;
}

const newItem = (people: number): Item => ({ id: uid(), text: "", walk: "little", cost: 0, people });

export default function DaysPage() {
  const { trip, update } = useTrip();
  const toast = useToast();
  if (!trip) return null;
  const useCar = trip.budget.useCar;
  const people = trip.travellers.length;

  /** Find an item (in a day or the ideas list) on a draft and mutate it. */
  const editItem = (id: string, patch: Partial<Item>) =>
    update((s) => {
      const it = [...s.days.flatMap((d) => d.items), ...s.ideas].find((i) => i.id === id);
      if (it) Object.assign(it, patch);
    });

  return (
    <div className="space-y-8">
      <PageHead title="Days" sub="8–15 December. Costs are per person and add up in the budget.">
        <Link
          to="/budget"
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold",
            useCar ? "bg-soft" : "bg-accent text-on-accent",
          )}
        >
          {useCar ? <Car className="h-4 w-4" aria-hidden /> : <Bus className="h-4 w-4" aria-hidden />}
          {useCar ? `Car: ${trip.budget.carDays} days` : "No car: tours"}
        </Link>
      </PageHead>

      <ol className="space-y-6">
        {trip.days.map((d, di) => {
          const dayTotal = d.items.reduce((x, i) => x + itemCost(i, trip), 0);
          return (
            <li key={d.date} className="surface p-4 md:p-5" aria-labelledby={`day-${d.date}`}>
              <header className="mb-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id={`day-${d.date}`} className="text-sm font-extrabold tracking-wide text-primary uppercase">
                    {dayName(d.label, d.date)}
                  </h2>
                  {dayTotal > 0 && (
                    <span className="font-extrabold tabular-nums" title="Day total for the group">
                      {eur(dayTotal)}
                    </span>
                  )}
                </div>
                <AutoTextarea
                  aria-label={`Plan for ${dayName(d.label, d.date)}`}
                  className="-mx-1 mt-1 min-h-11 w-[calc(100%+0.5rem)] rounded-lg bg-transparent px-1 py-1 font-display text-2xl font-extrabold focus:bg-soft"
                  value={d.title}
                  onChange={(v) =>
                    update((s) => {
                      s.days[di]!.title = v;
                    })
                  }
                />
              </header>

              <ul className="divide-y">
                {d.items.map((it) => (
                  <li key={it.id} className="py-4 first:pt-1">
                    <ItemEditor
                      item={it}
                      trip={trip}
                      maxPeople={people}
                      onChange={(p) => editItem(it.id, p)}
                      actions={
                        <>
                          <IconButton
                            label={`Move “${it.text || "item"}” to ideas`}
                            onClick={() =>
                              update((s) => {
                                const day = s.days[di]!;
                                const idx = day.items.findIndex((x) => x.id === it.id);
                                if (idx >= 0) s.ideas.unshift(...day.items.splice(idx, 1));
                              })
                            }
                          >
                            <ArchiveRestore className="h-5 w-5" aria-hidden />
                          </IconButton>
                          <IconButton
                            label={`Delete “${it.text || "item"}”`}
                            danger
                            onClick={() => {
                              if (it.text && !window.confirm(`Delete “${it.text}”?`)) return;
                              update((s) => {
                                s.days[di]!.items = s.days[di]!.items.filter((x) => x.id !== it.id);
                              });
                            }}
                          >
                            <Trash2 className="h-5 w-5" aria-hidden />
                          </IconButton>
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() =>
                  update((s) => {
                    s.days[di]!.items.push(newItem(people));
                  })
                }
              >
                <Plus className="h-5 w-5" aria-hidden /> Add item
              </Button>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="ideas-h" className="surface p-4 md:p-5">
        <div className="mb-1 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-accent" aria-hidden />
          <h2 id="ideas-h" className="text-2xl font-extrabold">
            Ideas
          </h2>
        </div>
        <p className="mb-2 text-muted">Not in the budget until you add them to a day.</p>
        <ul className="divide-y">
          {trip.ideas.map((it) => (
            <li key={it.id} className="py-4">
              <ItemEditor
                item={it}
                trip={trip}
                maxPeople={people}
                onChange={(p) => editItem(it.id, p)}
                actions={
                  <>
                    <AddToDay
                      trip={trip}
                      onPick={(date) => {
                        const day = trip.days.find((d) => d.date === date);
                        update((s) => {
                          const idx = s.ideas.findIndex((x) => x.id === it.id);
                          const target = s.days.find((d) => d.date === date);
                          if (idx >= 0 && target) target.items.push(...s.ideas.splice(idx, 1));
                        });
                        if (day) toast(`Added to ${dayName(day.label, day.date)}.`);
                      }}
                    />
                    <IconButton
                      label={`Delete idea “${it.text || "idea"}”`}
                      danger
                      onClick={() => {
                        if (it.text && !window.confirm(`Delete “${it.text}”?`)) return;
                        update((s) => {
                          s.ideas = s.ideas.filter((x) => x.id !== it.id);
                        });
                      }}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </IconButton>
                  </>
                }
              />
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() =>
            update((s) => {
              s.ideas.push(newItem(people));
            })
          }
        >
          <Plus className="h-5 w-5" aria-hidden /> Add idea
        </Button>
      </section>
    </div>
  );
}

function ItemEditor({
  item,
  trip,
  maxPeople,
  onChange,
  actions,
}: {
  item: Item;
  trip: TripState;
  maxPeople: number;
  onChange: (p: Partial<Item>) => void;
  actions: ReactNode;
}) {
  const id = useId();
  const tour = !!item.carTour && !trip.budget.useCar;
  const total = itemCost(item, trip);
  return (
    <div className="space-y-3">
      {/* Text on its own full-width line */}
      <div>
        <label htmlFor={id} className="sr-only">
          What
        </label>
        <AutoTextarea
          id={id}
          className="field font-bold"
          value={item.text}
          placeholder="What are we doing?"
          onChange={(text) => onChange({ text })}
        />
        {tour && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-on-accent">
            <Bus className="h-4 w-4" aria-hidden /> Tour · {eur(trip.budget.tourPrice)} per person (no car)
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <fieldset>
          <legend className="mb-1 text-sm font-bold text-muted">Walking</legend>
          <Segmented<Walk> small value={item.walk} onChange={(walk) => onChange({ walk })} options={walkOptions} />
        </fieldset>
        <div className="grid grid-cols-2 gap-3 md:contents">
          <NumField
            label={tour ? "Cost pp with car" : "Cost per person"}
            prefix="€"
            value={item.cost}
            onChange={(v) => onChange({ cost: v ?? 0 })}
          />
          <NumField
            label="People"
            min={1}
            max={maxPeople}
            value={item.people}
            onChange={(v) => onChange({ people: Math.max(0, Math.round(v ?? 0)) })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Switch
          label="Needs a car"
          checked={!!item.carTour}
          onChange={(on) => onChange({ carTour: on || undefined })}
          className="text-sm"
        />
        <div className="ml-auto flex items-center gap-1">
          {total > 0 && <span className="mr-2 font-extrabold tabular-nums">{eur(total)}</span>}
          {actions}
        </div>
      </div>
    </div>
  );
}

function AddToDay({ trip, onPick }: { trip: TripState; onPick: (date: string) => void }) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="sr-only">
        Add to day
      </label>
      <select
        id={id}
        className="min-h-11 w-36 truncate rounded-full bg-primary px-4 font-bold text-on-primary"
        value=""
        onChange={(e) => e.target.value && onPick(e.target.value)}
      >
        <option value="">Add to day…</option>
        {trip.days.map((d) => (
          <option key={d.date} value={d.date}>
            {dayName(d.label, d.date)} — {d.title}
          </option>
        ))}
      </select>
    </>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-soft",
        danger && "hover:text-bad",
      )}
    >
      {children}
    </button>
  );
}
