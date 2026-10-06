import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { isTouch } from "@/lib/device";
import { AIRPORT, type Who } from "@/lib/trip-data";
import { cn } from "@/lib/cn";

/** Lucide "plane", inlined because Leaflet markers take an HTML string */
const PLANE =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>';

export interface StayPin {
  id: string;
  lat: number;
  lng: number;
  /** Text on the pill, e.g. "€1 400" */
  label: string;
  group: Who;
  booked: boolean;
  /** Read out for the pin, e.g. "Casa Sol, €1 400, booked" */
  title: string;
  /** Hover / focus preview, only shown when `previews` is on */
  preview?: { img?: string; name: string; total: string; perPerson?: string };
}

/** Pills sit this far above their spot, on a small tail */
const TAIL = 8;
const GAP = 4;
const ACTIVE_SCALE = 1.2;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Price pills for the places, plus Tenerife South airport; framed so all of them show.
 * One finger scrolls the page; two fingers move the map.
 * `pinsJson`: JSON of StayPin[] — a string so the pins redraw only when they really change.
 */
export default function StaysMap({
  pinsJson,
  label,
  airportLabel,
  activeId = null,
  onPinClick,
  onPinHover,
  previews = false,
  panKey = 0,
  padBottom = 0,
  attributionTop = false,
  className,
}: {
  pinsJson: string;
  label: string;
  airportLabel: string;
  /** Highlighted pin: bigger and on top */
  activeId?: string | null;
  onPinClick?: (id: string) => void;
  onPinHover?: (id: string | null) => void;
  /** Small photo-and-price preview on hover and keyboard focus (desktop) */
  previews?: boolean;
  /** Bump to pan the active pin into the middle of the visible map */
  panKey?: number;
  /** Map height covered by something laid over its bottom edge, px */
  padBottom?: number;
  /** Credits top right, when the bottom edge is covered */
  attributionTop?: boolean;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pinsRef = useRef<{ id: string; marker: L.Marker; latlng: L.LatLng }[]>([]);
  const framed = useRef("");
  const tappable = !!onPinClick;
  const cb = useRef({ onPinClick, onPinHover });
  const active = useRef(activeId);
  const pad = useRef(padBottom);
  useEffect(() => {
    cb.current = { onPinClick, onPinHover };
    active.current = activeId;
    pad.current = padBottom;
  });

  // The map, once
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      scrollWheelZoom: false,
      // With dragging off, Leaflet's CSS sets touch-action: pan-x pan-y, so the page keeps
      // scrolling under one finger. Pinch (touchZoom) also pans, so two fingers move the map.
      dragging: !isTouch(),
      touchZoom: true,
      zoomSnap: 0.5,
      attributionControl: false,
    });
    // A starting view, so pins can be laid out right away; the pins effect frames them properly
    map.setView([AIRPORT.lat, AIRPORT.lng], 11);
    L.control.attribution({ position: attributionTop ? "topright" : "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    map.on("zoomend", () => layout(map, pinsRef.current, active.current));
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      framed.current = "";
    };
  }, [attributionTop]);

  // Pins
  useEffect(() => {
    const map = mapRef.current;
    const g = layerRef.current;
    if (!map || !g) return;
    const pins = JSON.parse(pinsJson) as StayPin[];
    g.clearLayers();

    const plane = L.divIcon({ className: "", html: `<div class="pin pin-tfs">${PLANE}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
    L.marker([AIRPORT.lat, AIRPORT.lng], { icon: plane, title: airportLabel, keyboard: false, zIndexOffset: -100 })
      .bindTooltip(`${esc(airportLabel)} (${AIRPORT.code})`, { permanent: true, direction: "bottom", offset: [0, 18], className: "tip-airport" })
      .addTo(g);

    pinsRef.current = pins.map((p) => {
      const icon = L.divIcon({
        className: "sp-root",
        html:
          `<span class="sp-leader"></span><span class="sp-dot"></span>` +
          `<span class="sp-pos"><span class="sp-pill sp-${p.group}${p.booked ? " sp-booked" : ""}${tappable ? " sp-click" : ""}">` +
          `${p.booked ? '<span class="sp-check" aria-hidden="true">✓</span>' : ""}${esc(p.label)}</span></span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker([p.lat, p.lng], { icon, title: "", keyboard: tappable, interactive: tappable }).addTo(g);
      const root = marker.getElement();
      if (root) {
        root.setAttribute("aria-label", p.title);
        if (tappable) root.setAttribute("role", "button");
        root.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cb.current.onPinClick?.(p.id);
          }
        });
      }
      marker.on("click", () => cb.current.onPinClick?.(p.id));
      if (previews && p.preview) {
        const v = p.preview;
        marker.bindTooltip(
          `<div class="sp-preview">${
            v.img ? `<img src="${esc(v.img)}" alt="" referrerpolicy="no-referrer">` : ""
          }<div class="sp-preview-text"><strong>${esc(v.name)}</strong><span>${esc(v.total)}</span>${
            v.perPerson ? `<span>${esc(v.perPerson)}</span>` : ""
          }</div></div>`,
          { direction: "top", className: "tip-preview", opacity: 1 },
        );
        marker.on("mouseover", () => cb.current.onPinHover?.(p.id));
        marker.on("mouseout", () => cb.current.onPinHover?.(null));
        root?.addEventListener("focus", () => {
          marker.openTooltip();
          cb.current.onPinHover?.(p.id);
        });
        root?.addEventListener("blur", () => {
          marker.closeTooltip();
          cb.current.onPinHover?.(null);
        });
      }
      return { id: p.id, marker, latlng: L.latLng(p.lat, p.lng) };
    });
    layout(map, pinsRef.current, active.current);
    // Pill widths change once the display font arrives
    let live = true;
    void document.fonts?.ready.then(() => live && layout(map, pinsRef.current, active.current));

    // Frame everything when the set of spots changes (not on a language switch or a price edit)
    const spots = JSON.stringify(pins.map((p) => [p.lat, p.lng]));
    if (spots !== framed.current) {
      framed.current = spots;
      const all = [...pins.map((p) => [p.lat, p.lng] as [number, number]), [AIRPORT.lat, AIRPORT.lng] as [number, number]];
      // Room for the pills above their spots, and the airport's label, centred below its pin.
      // The airport is the easternmost point for most areas, so the label needs extra space on the right.
      map.fitBounds(L.latLngBounds(all), { paddingTopLeft: [72, 64], paddingBottomRight: [110, 56 + pad.current], maxZoom: 15 });
    }
    return () => {
      live = false;
    };
  }, [pinsJson, airportLabel, tappable, previews]);

  // Highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const p of pinsRef.current) {
      p.marker.setZIndexOffset(p.id === activeId ? 1000 : 0);
      p.marker.getElement()?.querySelector(".sp-pill")?.classList.toggle("sp-active", p.id === activeId);
    }
    layout(map, pinsRef.current, activeId);
  }, [activeId, pinsJson]);

  // Bring the active pin into the middle of the part of the map you can see
  useEffect(() => {
    const map = mapRef.current;
    const p = pinsRef.current.find((x) => x.id === active.current);
    if (!panKey || !map || !p) return;
    const size = map.getSize();
    const at = map.latLngToContainerPoint(p.latlng);
    // The pill is above its spot, so aim the spot a little below the middle
    const target = L.point(size.x / 2, (size.y - pad.current) / 2 + 24);
    map.panBy(at.subtract(target), { animate: !reducedMotion(), duration: 0.35 });
  }, [panKey]);

  return (
    <div
      ref={el}
      role="region"
      aria-label={label}
      className={cn("relative isolate z-0 w-full overflow-hidden", className)}
    />
  );
}

/**
 * Push overlapping pills apart in screen space, like the planner map (here only up/down). The active pill stays on its
 * true spot; a moved pill gets a dot on its spot and a line to it. Previews follow the pill.
 */
function layout(map: L.Map, pins: { id: string; marker: L.Marker; latlng: L.LatLng }[], activeId: string | null) {
  const els = pins.map((p) => {
    const root = p.marker.getElement();
    return {
      pill: root?.querySelector<HTMLElement>(".sp-pill"),
      pos: root?.querySelector<HTMLElement>(".sp-pos"),
      leader: root?.querySelector<HTMLElement>(".sp-leader"),
      dot: root?.querySelector<HTMLElement>(".sp-dot"),
    };
  });
  const fixed = pins.findIndex((p) => p.id === activeId);
  const boxes = els.map((e, i) => {
    const s = i === fixed ? ACTIVE_SCALE : 1;
    const w = (e.pill?.offsetWidth ?? 70) * s;
    const h = (e.pill?.offsetHeight ?? 30) * s;
    const pt = map.latLngToLayerPoint(pins[i]!.latlng);
    // Box centre: the pill sits above the spot
    return { x: pt.x, y: pt.y - TAIL - h / 2, w, h };
  });
  const off = boxes.map(() => ({ x: 0, y: 0 }));
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const dx = b.x + off[j]!.x - (a.x + off[i]!.x);
        let dy = b.y + off[j]!.y - (a.y + off[i]!.y);
        const ox = (a.w + b.w) / 2 + GAP - Math.abs(dx);
        const oy = (a.h + b.h) / 2 + GAP - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        // Same height: a fixed direction so the result doesn't jump around
        if (Math.abs(dy) < 0.5) dy = 1;
        // Stack up/down only: pills are wide, and a column of prices reads well
        const push = { x: 0, y: Math.sign(dy) * oy };
        if (i === fixed) off[j] = { x: off[j]!.x + push.x, y: off[j]!.y + push.y };
        else if (j === fixed) off[i] = { x: off[i]!.x - push.x, y: off[i]!.y - push.y };
        else {
          off[i] = { x: off[i]!.x - push.x / 2, y: off[i]!.y - push.y / 2 };
          off[j] = { x: off[j]!.x + push.x / 2, y: off[j]!.y + push.y / 2 };
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  pins.forEach((p, i) => {
    const { pos, leader, dot } = els[i]!;
    const o = off[i]!;
    if (!pos || !leader || !dot) return;
    pos.style.transform = `translate(${o.x}px, ${o.y}px)`;
    const len = Math.hypot(o.x, o.y);
    leader.style.display = dot.style.display = len > 6 ? "" : "none";
    leader.style.width = `${len}px`;
    leader.style.transform = `rotate(${Math.atan2(o.y, o.x)}rad)`;
    const tip = p.marker.getTooltip();
    if (tip) {
      tip.options.offset = L.point(o.x, o.y - TAIL - boxes[i]!.h - 6);
      if (tip.isOpen()) tip.update();
    }
  });
}
