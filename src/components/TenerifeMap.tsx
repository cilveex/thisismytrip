import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2 } from "lucide-react";
import { SIGHTS, type Area } from "@/lib/trip-data";
import { isTouch } from "@/lib/device";
import { gateWheelZoom, zoomKeyLabel } from "@/lib/map-zoom";

const ISLAND: L.LatLngBoundsExpression = [
  [27.99, -16.93],
  [28.6, -16.11],
];
/** Los Gigantes → El Médano */
const SOUTH: L.LatLngBoundsExpression = [
  [28.03, -16.86],
  [28.26, -16.52],
];
/** Garachico → Santa Cruz / La Laguna */
const NORTH: L.LatLngBoundsExpression = [
  [28.33, -16.79],
  [28.5, -16.24],
];
/** Extra room top-left so edge pins don't sit under the zoom buttons */
const FIT: L.FitBoundsOptions = { paddingTopLeft: [64, 28], paddingBottomRight: [28, 28] };
const regionOf = (a: Area | undefined) => (a && a.lat >= 28.3 ? "north" : "south");

const PIN = 44; // px, also the min tap target
const GAP = 4;

/**
 * Push overlapping area pins apart in screen space. The active pin stays on its true spot.
 * Returns pixel offsets per marker index.
 */
function spread(points: L.Point[], fixed: number) {
  const off = points.map(() => L.point(0, 0));
  const min = PIN + GAP;
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const pi = points[i]!.add(off[i]!);
        const pj = points[j]!.add(off[j]!);
        let d = pj.subtract(pi);
        let dist = Math.hypot(d.x, d.y);
        if (dist >= min) continue;
        if (dist < 0.01) {
          d = L.point(Math.cos(i + j), Math.sin(i + j)); // deterministic direction for identical spots
          dist = 1;
        }
        const push = d.multiplyBy((min - dist) / dist);
        if (i === fixed) off[j] = off[j]!.add(push);
        else if (j === fixed) off[i] = off[i]!.subtract(push);
        else {
          off[i] = off[i]!.subtract(push.divideBy(2));
          off[j] = off[j]!.add(push.divideBy(2));
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return off;
}

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
  const pinsRef = useRef<{ marker: L.Marker; latlng: L.LatLng; active: boolean }[]>([]);
  const onAreaRef = useRef(onArea);
  const [island, setIsland] = useState(false);
  const region = regionOf(areas.find((a) => a.id === activeId));

  useEffect(() => {
    onAreaRef.current = onArea;
  }, [onArea]);

  // Create the map once
  useEffect(() => {
    if (!el.current) return;
    const touch = isTouch();
    const map = L.map(el.current, {
      zoomSnap: 0.25,
      // Only with Ctrl / ⌘ or a pinch: see gateWheelZoom
      scrollWheelZoom: true,
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
    map.fitBounds(SOUTH, FIT);
    // Dark mode darkens these tiles with a CSS filter (CARTO's dark tiles now need an API key).
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    map.on("zoomend", () => layoutPins(map, pinsRef.current));
    const wheel = gateWheelZoom(map, `Hold ${zoomKeyLabel()} and scroll to zoom`);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      wheel.remove();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Frame the planning area's coast, or the whole island
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // rAF: let layout (fonts, scrollbar) settle so the fit sees the real width
    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
      map.fitBounds(island ? ISLAND : region === "north" ? NORTH : SOUTH, FIT);
    });
    return () => cancelAnimationFrame(raf);
  }, [island, region]);

  // Pins
  useEffect(() => {
    const map = mapRef.current;
    const g = layerRef.current;
    if (!map || !g) return;
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
    pinsRef.current = areas.map((a) => {
      const active = a.id === activeId;
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin-anchor"><span class="pin-leader"></span><span class="pin-dot"></span><div class="pin pin-area ${active ? "active" : ""}">${a.score}</div></div>`,
        iconSize: [PIN, PIN],
        iconAnchor: [PIN / 2, PIN / 2],
      });
      const marker = L.marker([a.lat, a.lng], {
        icon,
        title: `${a.name}, easy for grandma ${a.score} of 5`,
        keyboard: true,
        zIndexOffset: active ? 1000 : 500,
        riseOnHover: true,
      })
        .on("click", () => onAreaRef.current(a.id))
        .addTo(g);
      return { marker, latlng: L.latLng(a.lat, a.lng), active };
    });
    layoutPins(map, pinsRef.current);
  }, [areas, activeId]);

  return (
    <div className="relative">
      <div
        ref={el}
        className="relative isolate z-0 h-[380px] w-full overflow-hidden rounded-[var(--radius-card)] border md:h-[560px]"
        role="region"
        aria-label="Map of Tenerife with stay areas and sights. The area list below the map has the same areas."
      />
      <button
        type="button"
        onClick={() => setIsland((v) => !v)}
        className="absolute top-3 right-3 z-[500] inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-bold shadow"
      >
        {island ? (
          <>
            <Minimize2 className="h-4 w-4" aria-hidden /> {region === "north" ? "North coast" : "South coast"}
          </>
        ) : (
          <>
            <Maximize2 className="h-4 w-4" aria-hidden /> Whole island
          </>
        )}
      </button>
    </div>
  );
}

function layoutPins(map: L.Map, pins: { marker: L.Marker; latlng: L.LatLng; active: boolean }[]) {
  if (!pins.length) return;
  const off = spread(
    pins.map((p) => map.latLngToLayerPoint(p.latlng)),
    pins.findIndex((p) => p.active),
  );
  pins.forEach((p, i) => {
    const root = p.marker.getElement();
    const pin = root?.querySelector<HTMLElement>(".pin-area");
    const leader = root?.querySelector<HTMLElement>(".pin-leader");
    const dot = root?.querySelector<HTMLElement>(".pin-dot");
    if (!pin || !leader || !dot) return;
    const o = off[i]!;
    const len = Math.hypot(o.x, o.y);
    pin.style.transform = `translate(${o.x}px, ${o.y}px)`;
    leader.style.display = dot.style.display = len > 6 ? "" : "none";
    leader.style.width = `${len}px`;
    leader.style.transform = `rotate(${Math.atan2(o.y, o.x)}rad)`;
  });
}
