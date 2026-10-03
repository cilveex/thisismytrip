import { useId } from "react";
import { Copy, Plus, Share2, Trash2, UserRound } from "lucide-react";
import { useTrip } from "@/lib/trip-store";
import { eur, groupLabel } from "@/lib/budget";
import { tripSummary } from "@/lib/summary";
import { uid, type Traveller, type Who } from "@/lib/trip-data";
import { useToast } from "@/lib/toast";
import { Button, PageHead, Segmented, TextArea } from "@/components/ui";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older iOS / non-secure contexts: fall back to a hidden textarea
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export default function NotesPage() {
  const { trip, update } = useTrip();
  const toast = useToast();
  if (!trip) return null;
  const summary = tripSummary(trip);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const setTraveller = (id: string, patch: Partial<Traveller>) =>
    update((s) => {
      const t = s.travellers.find((x) => x.id === id);
      if (t) Object.assign(t, patch);
    });

  return (
    <div className="space-y-8">
      <PageHead title="Notes" sub="Who's coming, things to remember, and a summary for the group chat." />

      <section className="surface p-4 md:p-5" aria-labelledby="trav-h">
        <h2 id="trav-h" className="text-2xl font-extrabold">
          Travellers
        </h2>
        <p className="mb-3 text-muted tabular-nums">
          {trip.travellers.length} × {eur(trip.budget.poolPerPerson)} = pool of{" "}
          <strong className="text-ink">{eur(trip.travellers.length * trip.budget.poolPerPerson)}</strong>
        </p>
        <ul className="divide-y">
          {trip.travellers.map((t) => (
            <li key={t.id} className="py-4">
              <TravellerRow
                t={t}
                coupleLabel={groupLabel(trip, "couple").replace(/ apartment$/, "")}
                onChange={(p) => setTraveller(t.id, p)}
                onDelete={() => {
                  if (!window.confirm(`Remove ${t.name || "this traveller"}? The pool shrinks by ${eur(trip.budget.poolPerPerson)}.`))
                    return;
                  update((s) => {
                    s.travellers = s.travellers.filter((x) => x.id !== t.id);
                  });
                }}
              />
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() =>
            update((s) => {
              s.travellers.push({ id: uid(), name: "", apt: "family", note: "" });
            })
          }
        >
          <Plus className="h-5 w-5" aria-hidden /> Add traveller
        </Button>
      </section>

      <section className="surface p-4 md:p-5" aria-labelledby="notes-h">
        <h2 id="notes-h" className="mb-3 text-2xl font-extrabold">
          Notes
        </h2>
        <TextArea
          label="Shared notes"
          rows={8}
          value={trip.notes}
          onChange={(v) =>
            update((s) => {
              s.notes = v;
            })
          }
        />
      </section>

      <section className="surface p-4 md:p-5" aria-labelledby="sum-h">
        <h2 id="sum-h" className="text-2xl font-extrabold">
          Summary
        </h2>
        <p className="mb-3 text-muted">Plain text of the saved plan, ready to paste into WhatsApp.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            className="h-12 text-lg"
            onClick={async () => toast((await copyText(summary)) ? "Summary copied. Paste it in WhatsApp." : "Couldn't copy. Select the text below instead.")}
          >
            <Copy className="h-5 w-5" aria-hidden /> Copy summary
          </Button>
          {canShare && (
            <Button
              variant="secondary"
              className="h-12"
              onClick={() => navigator.share({ text: summary }).catch(() => {})}
            >
              <Share2 className="h-5 w-5" aria-hidden /> Share
            </Button>
          )}
        </div>
        <details className="mt-4 rounded-xl bg-soft p-3">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold">Preview</summary>
          <pre className="mt-2 font-sans text-sm whitespace-pre-wrap">{summary}</pre>
        </details>
      </section>
    </div>
  );
}

function TravellerRow({
  t,
  coupleLabel,
  onChange,
  onDelete,
}: {
  t: Traveller;
  coupleLabel: string;
  onChange: (p: Partial<Traveller>) => void;
  onDelete: () => void;
}) {
  const id = useId();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserRound className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        <label htmlFor={`${id}-n`} className="sr-only">
          Name
        </label>
        <input
          id={`${id}-n`}
          className="field font-bold"
          value={t.name}
          placeholder="Name"
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <button
          type="button"
          onClick={onDelete}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-soft hover:text-bad"
          aria-label={`Remove ${t.name || "traveller"}`}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1 text-sm font-bold text-muted">Staying in</legend>
          <Segmented<Who>
            small
            value={t.apt}
            onChange={(apt) => onChange({ apt })}
            options={[
              { value: "family", label: "Family apt" },
              { value: "couple", label: coupleLabel },
            ]}
          />
        </fieldset>
        <div>
          <label htmlFor={`${id}-note`} className="mb-1 block text-sm font-bold text-muted">
            Note
          </label>
          <input
            id={`${id}-note`}
            className="field"
            value={t.note}
            placeholder="e.g. arrives 9 Dec"
            onChange={(e) => onChange({ note: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
