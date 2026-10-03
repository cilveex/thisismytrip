import { hasTime } from "./flights";

/**
 * UTC offsets in December for the airports we use (no daylight saving then).
 * Riga is UTC+2, the Canary Islands are UTC+0.
 */
const DEC_OFFSET_MIN: Record<string, number> = { RIX: 120, TFS: 0, TFN: 0 };

export interface CalEvent {
  id: string;
  title: string;
  /** Local wall-clock "YYYY-MM-DDTHH:mm" at `airport` */
  start: string;
  end: string;
  /** Airport whose local time `start`/`end` are in */
  airport: string;
  location?: string;
  description?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local airport time → "YYYYMMDDTHHMMSSZ", or a floating local time if the airport is unknown. */
function stamp(dt: string, airport: string) {
  const off = DEC_OFFSET_MIN[airport.toUpperCase()];
  const d = new Date(dt.slice(0, 16) + ":00Z");
  if (off === undefined) return dt.slice(0, 16).replace(/[-:]/g, "") + "00";
  d.setUTCMinutes(d.getUTCMinutes() - off);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export function buildIcs(events: CalEvent[]) {
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tenerife trip//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of events.filter((x) => hasTime(x.start) && hasTime(x.end))) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@tenerife-trip-2026`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(e.start, e.airport)}`,
      `DTEND:${stamp(e.end, e.airport)}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(events: CalEvent[], filename: string) {
  const url = URL.createObjectURL(new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
