import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { isTouch } from "@/lib/device";

/** Pins numbered like the cards below. One finger scrolls the page; two fingers move the map. */
/** `pinsJson`: JSON of {n, lat, lng, name}[] — a string so the map redraws only when pins really change. */
export default function StaysMap({ pinsJson, label }: { pinsJson: string; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pins = JSON.parse(pinsJson) as { n: number; lat: number; lng: number; name: string }[];
    if (!el.current || !pins.length) return;
    const map = L.map(el.current, { scrollWheelZoom: false, dragging: !isTouch(), touchZoom: true, zoomSnap: 0.5 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    for (const p of pins) {
      const icon = L.divIcon({ className: "", html: `<div class="pin pin-stay">${p.n}</div>`, iconSize: [44, 44], iconAnchor: [22, 22] });
      L.marker([p.lat, p.lng], { icon, title: p.name, keyboard: false }).addTo(map);
    }
    const b = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
    if (pins.length === 1) map.setView(b.getCenter(), 15);
    else map.fitBounds(b, { padding: [48, 48], maxZoom: 16 });
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      map.remove();
    };
  }, [pinsJson]);
  return (
    <div
      ref={el}
      role="region"
      aria-label={label}
      className="relative isolate z-0 h-72 w-full overflow-hidden rounded-[var(--radius-card)] border md:h-96"
    />
  );
}
