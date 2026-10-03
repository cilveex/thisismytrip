import { normalizeState, type TripState } from "./trip-data";

const APP = "tenerife-trip";

/** Local date as YYYY-MM-DD */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function downloadBackup(trip: TripState) {
  const file = { app: APP, version: 1, exportedAt: new Date().toISOString(), trip };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `tenerife-trip-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === "string";
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** Check one list in the backup; returns an error message or null. */
function checkList(raw: Record<string, unknown>, key: string, ok: (x: Record<string, unknown>) => boolean) {
  const v = raw[key];
  if (v === undefined) return null;
  if (!Array.isArray(v)) return `“${key}” isn't a list.`;
  const bad = v.findIndex((x) => !isObj(x) || !ok(x));
  return bad >= 0 ? `Entry ${bad + 1} in “${key}” is damaged.` : null;
}

const itemOk = (i: Record<string, unknown>) => str(i.id) && str(i.text) && num(i.cost) && num(i.people);

/**
 * Parse and validate a backup file. Accepts our wrapped format or a bare trip object.
 * Throws an Error with a user-facing message if it doesn't look like a trip.
 */
export function parseBackup(text: string): { trip: TripState; exportedAt: string | null } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON.");
  }
  if (!isObj(data)) throw new Error("This file doesn't contain a trip.");
  const wrapped = data.app === APP && isObj(data.trip);
  const raw = (wrapped ? data.trip : data) as Record<string, unknown>;

  if (!Array.isArray(raw.travellers) && !Array.isArray(raw.days))
    throw new Error("This doesn't look like a Tenerife trip backup.");

  const problems = [
    checkList(raw, "travellers", (t) => str(t.id) && str(t.name) && (t.apt === "family" || t.apt === "couple")),
    checkList(raw, "areas", (a) => str(a.id) && str(a.name) && num(a.lat) && num(a.lng) && num(a.family) && num(a.couple)),
    checkList(raw, "apartments", (a) => str(a.id) && str(a.name) && str(a.area) && (a.total === null || num(a.total))),
    checkList(raw, "days", (d) => str(d.date) && str(d.title) && Array.isArray(d.items) && d.items.every((i) => isObj(i) && itemOk(i))),
    checkList(raw, "ideas", itemOk),
    raw.budget !== undefined && !isObj(raw.budget) ? "“budget” is damaged." : null,
    raw.notes !== undefined && !str(raw.notes) ? "“notes” is damaged." : null,
  ].filter(Boolean);
  if (problems.length) throw new Error(`Can't restore: ${problems[0]}`);

  const { _by, ...rest } = raw;
  void _by;
  return {
    trip: normalizeState(rest as Partial<TripState>),
    exportedAt: wrapped && str(data.exportedAt) ? (data.exportedAt as string) : null,
  };
}
