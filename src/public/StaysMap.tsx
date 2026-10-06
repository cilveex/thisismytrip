import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { isTouch } from "@/lib/device";
import { AIRPORT } from "@/lib/trip-data";
import { cn } from "@/lib/cn";

/** Lucide "plane", inlined because Leaflet markers take an HTML string */
const PLANE =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>';

/**
 * Pins numbered like the cards, plus Tenerife South airport; framed so all of them show.
 * One finger scrolls the page; two fingers move the map.
 * `pinsJson`: JSON of {n, lat, lng, name}[] — a string so the map redraws only when pins really change.
 */
export default function StaysMap({
  pinsJson,
  label,
  airportLabel,
  onSelect,
  className,
}: {
  pinsJson: string;
  label: string;
  airportLabel: string;
  /** Tapping a numbered pin */
  onSelect?: (n: number) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const tappable = !!onSelect;
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const pins = JSON.parse(pinsJson) as { n: number; lat: number; lng: number; name: string }[];
    if (!el.current) return;
    const map = L.map(el.current, { scrollWheelZoom: false, dragging: !isTouch(), touchZoom: true, zoomSnap: 0.5 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const plane = L.divIcon({ className: "", html: `<div class="pin pin-tfs">${PLANE}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
    L.marker([AIRPORT.lat, AIRPORT.lng], { icon: plane, title: airportLabel, keyboard: false, zIndexOffset: -100 })
      .bindTooltip(`${airportLabel} (${AIRPORT.code})`, { permanent: true, direction: "bottom", offset: [0, 18], className: "tip-airport" })
      .addTo(map);

    for (const p of pins) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin pin-stay${tappable ? " pin-click" : ""}">${p.n}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const m = L.marker([p.lat, p.lng], { icon, title: p.name, keyboard: false, interactive: tappable }).addTo(map);
      m.on("click", () => select.current?.(p.n));
    }

    const all = [...pins.map((p) => [p.lat, p.lng] as [number, number]), [AIRPORT.lat, AIRPORT.lng] as [number, number]];
    // Room for the 44px pins and the airport's label, centred below its pin. The airport is the
    // easternmost point for most areas, so the label needs extra space on the right.
    map.fitBounds(L.latLngBounds(all), { paddingTopLeft: [40, 40], paddingBottomRight: [120, 64], maxZoom: 15 });
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      map.remove();
    };
  }, [pinsJson, airportLabel, tappable]);

  return (
    <div
      ref={el}
      role="region"
      aria-label={label}
      className={cn("relative isolate z-0 h-72 w-full overflow-hidden rounded-[var(--radius-card)] border md:h-96", className)}
    />
  );
}
