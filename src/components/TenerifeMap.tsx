import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SIGHTS, type Area } from "@/lib/trip-data";
import { isTouch } from "@/lib/device";

const ISLAND: L.LatLngBoundsExpression = [
  [27.99, -16.93],
  [28.6, -16.11],
];

export default function TenerifeMap({
  areas,
  activeId,
  onArea,
}: {
  areas: Area[];
  activeId: string;
  onArea: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onAreaRef = useRef(onArea);
  useEffect(() => {
    onAreaRef.current = onArea;
  }, [onArea]);

  useEffect(() => {
    if (!el.current) return;
    const touch = isTouch();
    const map = L.map(el.current, {
      zoomSnap: 0.25,
      scrollWheelZoom: false,
      // With dragging off, Leaflet's CSS sets touch-action: pan-x pan-y, so the page keeps
      // scrolling under one finger. Pinch (touchZoom) also pans, so two fingers move the map.
      dragging: !touch,
      touchZoom: true,
      maxBounds: [
        [27.6, -17.4],
        [29, -15.6],
      ],
      minZoom: 8,
    });
    map.fitBounds(ISLAND, { padding: [8, 8] });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    // Refit when the container changes size (rotation, desktop resize)
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el.current);
    // Fit again once layout (fonts, scrollbar) has settled — the first fit can see a stale width.
    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
      map.fitBounds(ISLAND, { padding: [8, 8] });
    });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const g = layerRef.current;
    if (!g) return;
    g.clearLayers();
    for (const s of SIGHTS) {
      const big = s.kind !== "sight";
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin pin-${s.kind}" aria-hidden="true">${s.kind === "airport" ? "✈" : s.kind === "peak" ? "▲" : ""}</div>`,
        iconSize: big ? [30, 30] : [18, 18],
        iconAnchor: big ? [15, 15] : [9, 9],
      });
      L.marker([s.lat, s.lng], { icon, title: s.name, keyboard: false })
        .bindTooltip(s.name, { direction: "top", offset: [0, big ? -12 : -6] })
        .addTo(g);
    }
    for (const a of areas) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin pin-area ${a.id === activeId ? "active" : ""}">${a.score}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      L.marker([a.lat, a.lng], {
        icon,
        title: `${a.name}, easy for grandma ${a.score} of 5`,
        alt: a.name,
        keyboard: true,
        zIndexOffset: a.id === activeId ? 1000 : 500,
      })
        .bindTooltip(a.name, { direction: "top", offset: [0, -20] })
        .on("click", () => onAreaRef.current(a.id))
        .addTo(g);
    }
  }, [areas, activeId]);

  return (
    <div
      ref={el}
      className="relative isolate z-0 h-[380px] w-full overflow-hidden rounded-[var(--radius-card)] border md:h-[560px]"
      role="region"
      aria-label="Map of Tenerife with stay areas and sights. The area list below the map has the same areas."
    />
  );
}
