import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowRight, Plane } from "lucide-react";
import { isTouch } from "@/lib/device";
import { gateWheelZoom, zoomKeyLabel } from "@/lib/map-zoom";
import { AIRPORT, type Who } from "@/lib/trip-data";
import { cn } from "@/lib/cn";
import { useI18n } from "./i18n";

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
  favourite?: boolean;
  /** Read out for the pin, e.g. "Casa Sol, €1 400, booked" */
  title: string;
  /** Drive from the airport, minutes, for the edge arrow */
  driveMin?: number;
  /** Hover / focus preview, only shown when `previews` is on */
  preview?: { img?: string; name: string; total: string; perPerson?: string };
}

/** Pills sit this far above their spot, on a small tail */
const TAIL = 8;
const GAP = 4;
const ACTIVE_SCALE = 1.2;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Room around the places when framing: pills sit above their spots, so more on top */
const FRAME_TL: [number, number] = [56, 76];
const FRAME_BR: [number, number] = [56, 40];
/** Gap between the edge arrow and the map's edge, px */
const EDGE_GAP = 10;
/** Keep the arrow this far above the map's bottom edge, clear of the credits */
const EDGE_BOTTOM = 28;
/** Keep the arrow's centre this far from the corners when it sits on the top or bottom edge */
const EDGE_HALF_W = 110;
/** Keep the arrow below the zoom buttons and the "Show airport" button */
const EDGE_TOP = 112;

const EDGE_SHIFT = {
  right: "translate(-100%, -50%)",
  left: "translate(0, -50%)",
  top: "translate(-50%, 0)",
  bottom: "translate(-50%, -100%)",
} as const;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Price pills for the places, plus Tenerife South airport. Opens framed on the places; a button
 * zooms out to include the airport and back. While the airport is off-screen, an arrow on the
 * map's edge points to it with the drive time.
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
  coveredTop: coveredTopProp,
  attributionTop = false,
  compact = false,
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
  /** Viewport y where the page stops covering the map from above (e.g. a sticky top bar's bottom) */
  coveredTop?: () => number;
  /** Credits top right, when the bottom edge is covered */
  attributionTop?: boolean;
  /** Phones: small dots for ordinary places; full price pills only for the selected, booked and favourite ones, and none stacked */
  compact?: boolean;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pinsRef = useRef<PinRef[]>([]);
  const compactRef = useRef(compact);
  const framed = useRef("");
  const tappable = !!onPinClick;
  const cb = useRef({ onPinClick, onPinHover });
  const active = useRef(activeId);
  const pad = useRef(padBottom);
  const coveredTop = useRef(coveredTopProp);
  const { t } = useI18n();
  const hintText = t("map.zoomHint", { key: zoomKeyLabel() });
  const hint = useRef(hintText);
  const wheel = useRef<ReturnType<typeof gateWheelZoom> | null>(null);
  useEffect(() => {
    hint.current = hintText;
    wheel.current?.setHint(hintText);
  }, [hintText]);
  const [withAirport, setWithAirport] = useState(false);
  const airport = useRef(withAirport);
  /** Where the airport arrow sits, when the airport is off-screen */
  const edgeEl = useRef<HTMLButtonElement>(null);
  const [edge, setEdge] = useState<{ x: number; y: number; angle: number; side: "left" | "right" | "top" | "bottom" } | null>(null);
  useEffect(() => {
    cb.current = { onPinClick, onPinHover };
    active.current = activeId;
    pad.current = padBottom;
    coveredTop.current = coveredTopProp;
    airport.current = withAirport;
    compactRef.current = compact;
  });

  /** Fit the places (and the airport, when asked) into the part of the map you can see */
  const frame = useRef((animate: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    const spots = pinsRef.current.map((p) => p.latlng);
    if (airport.current || !spots.length) spots.push(L.latLng(AIRPORT.lat, AIRPORT.lng));
    // With the airport: room for its label, centred below its pin and usually to the east
    const br: [number, number] = airport.current ? [110, 56] : FRAME_BR;
    map.fitBounds(L.latLngBounds(spots), {
      paddingTopLeft: FRAME_TL,
      paddingBottomRight: [br[0], br[1] + pad.current],
      maxZoom: 16,
      animate: animate && !reducedMotion(),
    });
  });

  /** Show the arrow on the edge when the airport is out of view */
  const placeEdge = useRef(() => {
    const map = mapRef.current;
    if (!map) return setEdge(null);
    const size = map.getSize();
    const h = size.y - pad.current;
    const at = map.latLngToContainerPoint([AIRPORT.lat, AIRPORT.lng]);
    if (at.x >= 0 && at.x <= size.x && at.y >= 0 && at.y <= h) return setEdge(null);
    // Walk from the middle towards the airport until we reach the inset box; the arrow sits
    // flush against the side it crosses, so it never pokes into the middle of the map
    const box = { x0: EDGE_GAP, x1: size.x - EDGE_GAP, y0: EDGE_TOP, y1: Math.max(EDGE_TOP, h - EDGE_BOTTOM) };
    const c = L.point((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2);
    const d = at.subtract(c);
    const kx = d.x > 0 ? (box.x1 - c.x) / d.x : d.x < 0 ? (box.x0 - c.x) / d.x : Infinity;
    const ky = d.y > 0 ? (box.y1 - c.y) / d.y : d.y < 0 ? (box.y0 - c.y) / d.y : Infinity;
    const k = Math.min(kx, ky);
    const side = kx <= ky ? (d.x > 0 ? "right" : "left") : d.y > 0 ? "bottom" : "top";
    const along = side === "left" || side === "right";
    const lo = Math.min(EDGE_HALF_W, size.x / 2);
    const clampX = (v: number) => Math.min(Math.max(v, lo), size.x - lo);
    const clampY = (v: number) => Math.min(Math.max(v, box.y0 + 22), box.y1 - 22);
    const x0 = along ? c.x + d.x * k : clampX(c.x + d.x * k);
    const y0 = along ? clampY(c.y + d.y * k) : c.y + d.y * k;

    // Slide along the edge to the nearest spot that doesn't cover a price pill
    const w = edgeEl.current?.offsetWidth ?? 190;
    const ah = edgeEl.current?.offsetHeight ?? 40;
    const origin = el.current!.getBoundingClientRect();
    const pills = pinsRef.current.flatMap((p) => {
      const root = p.marker.getElement();
      const r = root?.querySelector(root.classList.contains("sp-collapsed") ? ".sp-mini" : ".sp-pill")?.getBoundingClientRect();
      return r ? [{ l: r.left - origin.left, r: r.right - origin.left, t: r.top - origin.top, b: r.bottom - origin.top }] : [];
    });
    const rectAt = (x: number, y: number) => {
      const l = side === "right" ? x - w : side === "left" ? x : x - w / 2;
      const t = side === "bottom" ? y - ah : side === "top" ? y : y - ah / 2;
      return { l: l - 4, r: l + w + 4, t: t - 4, b: t + ah + 4 };
    };
    const free = (x: number, y: number) => {
      const a = rectAt(x, y);
      return pills.every((p) => a.r <= p.l || a.l >= p.r || a.b <= p.t || a.t >= p.b);
    };
    let best = { x: x0, y: y0 };
    for (let step = 1; step <= 12 && !free(best.x, best.y); step++) {
      const shift = Math.ceil(step / 2) * 24 * (step % 2 ? -1 : 1);
      best = along ? { x: x0, y: clampY(y0 + shift) } : { x: clampX(x0 + shift), y: y0 };
    }
    setEdge({ x: best.x, y: best.y, angle: Math.atan2(d.y, d.x), side });
  });

  // The map, once
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      // Only with Ctrl / ⌘ or a pinch: see gateWheelZoom
      scrollWheelZoom: true,
      // With dragging off, Leaflet's CSS sets touch-action: pan-x pan-y, so the page keeps
      // scrolling under one finger. Pinch (touchZoom) also pans, so two fingers move the map.
      dragging: !isTouch(),
      touchZoom: true,
      zoomSnap: 0.5,
      attributionControl: false,
    });
    // A starting view, so pins can be laid out right away; the pins effect frames them properly
    map.setView([AIRPORT.lat, AIRPORT.lng], 11);
    L.control.attribution({ position: attributionTop ? "topright" : "bottomright", prefix: compact ? false : undefined }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    map.on("zoomend", () => layout(map, pinsRef.current, active.current, compactRef.current));
    map.on("move zoom resize", () => placeEdge.current());
    wheel.current = gateWheelZoom(map, hint.current);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      wheel.current?.remove();
      wheel.current = null;
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      framed.current = "";
    };
  }, [attributionTop, compact]);

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
          `<span class="sp-mini sp-mini-${p.group}${p.booked ? " sp-mini-booked" : ""}${p.favourite ? " sp-mini-fav" : ""}"></span>` +
          `<span class="sp-pos"><span class="sp-pill sp-${p.group}${p.booked ? " sp-booked" : ""}${p.favourite ? " sp-fav" : ""}${tappable ? " sp-click" : ""}">` +
          `${p.favourite ? '<span class="sp-star" aria-hidden="true">★</span>' : ""}${p.booked ? '<span class="sp-check" aria-hidden="true">✓</span>' : ""}${esc(p.label)}</span></span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const base = p.booked ? 200 : p.favourite ? 100 : 0;
      const marker = L.marker([p.lat, p.lng], { icon, title: "", keyboard: tappable, interactive: tappable, zIndexOffset: base }).addTo(g);
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
      return { id: p.id, marker, latlng: L.latLng(p.lat, p.lng), base, rank: p.booked ? 1 : p.favourite ? 2 : 3 };
    });
    layout(map, pinsRef.current, active.current, compactRef.current);
    // Pill widths change once the display font arrives
    let live = true;
    void document.fonts?.ready.then(() => live && layout(map, pinsRef.current, active.current, compactRef.current));

    // Frame when the set of spots changes (not on a language switch or a price edit)
    const spots = JSON.stringify(pins.map((p) => [p.lat, p.lng]));
    if (spots !== framed.current) {
      framed.current = spots;
      frame.current(false);
    }
    placeEdge.current();
    return () => {
      live = false;
    };
  }, [pinsJson, airportLabel, tappable, previews, compact]);

  // "Show airport" toggled: zoom out to it, or back to the places
  const toggled = useRef(false);
  useEffect(() => {
    if (!toggled.current) return void (toggled.current = true);
    frame.current(true);
  }, [withAirport]);

  // The cards over the bottom edge changed height
  useEffect(() => placeEdge.current(), [padBottom]);

  // Highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const p of pinsRef.current) {
      p.marker.setZIndexOffset(p.id === activeId ? 1000 : p.base);
      p.marker.getElement()?.querySelector(".sp-pill")?.classList.toggle("sp-active", p.id === activeId);
    }
    layout(map, pinsRef.current, activeId, compactRef.current);
    placeEdge.current();
  }, [activeId, pinsJson, compact]);

  // Centre the active pill in the part of the map you can see: below the page's sticky top bar
  // (when the map's top is scrolled under it) and above whatever covers the bottom edge
  useEffect(() => {
    const map = mapRef.current;
    const p = pinsRef.current.find((x) => x.id === active.current);
    if (!panKey || !map || !p || !el.current) return;
    const size = map.getSize();
    const bottom = size.y - pad.current;
    const covered = (coveredTop.current?.() ?? 0) - el.current.getBoundingClientRect().top;
    // Keep at least a pill's worth of room even if the map is mostly scrolled away
    const top = Math.min(Math.max(0, covered), Math.max(0, bottom - 80));
    // The pill sits above its spot, so aim the spot half a (grown) pill below the middle
    const pill = p.marker.getElement()?.querySelector<HTMLElement>(".sp-pill");
    const h = (pill?.offsetHeight ?? 30) * ACTIVE_SCALE;
    const target = L.point(size.x / 2, (top + bottom) / 2 + TAIL + h / 2);
    const at = map.latLngToContainerPoint(p.latlng);
    map.panBy(at.subtract(target), { animate: !reducedMotion(), duration: 0.35 });
  }, [panKey]);

  // Drive time for the arrow: the selected place's, else the range across the places
  const pins = JSON.parse(pinsJson) as StayPin[];
  const drives = (activeId ? pins.filter((p) => p.id === activeId) : pins).map((p) => p.driveMin).filter((n): n is number => !!n);
  const lo = drives.length ? Math.min(...drives) : 0;
  const hi = drives.length ? Math.max(...drives) : 0;
  const drive = !lo ? "" : lo === hi ? `${lo}` : `${lo}–${hi}`;
  const edgeText = drive ? t("map.toAirport", { n: drive }) : t("map.toAirportShort");

  return (
    <div className={cn("relative isolate z-0 w-full overflow-hidden", className)}>
      <div ref={el} role="region" aria-label={label} className="h-full w-full" />
      <button
        type="button"
        aria-pressed={withAirport}
        onClick={() => setWithAirport((v) => !v)}
        style={{ top: attributionTop ? 40 : 12 }}
        title={withAirport ? t("map.placesOnly") : t("map.showAirport")}
        className="absolute right-3 z-[1000] inline-flex h-10 w-10 items-center justify-center gap-2 rounded-full border bg-card text-base font-bold shadow md:h-auto md:min-h-11 md:w-auto md:px-4"
      >
        <Plane className="h-5 w-5 shrink-0" aria-hidden />
        <span className="sr-only md:not-sr-only">{withAirport ? t("map.placesOnly") : t("map.showAirport")}</span>
      </button>
      {edge && (
        <button
          ref={edgeEl}
          type="button"
          onClick={() => setWithAirport(true)}
          aria-label={`${edgeText}. ${t("map.showAirport")}`}
          style={{ left: edge.x, top: edge.y, transform: EDGE_SHIFT[edge.side] }}
          className="absolute z-[900] inline-flex min-h-8 items-center gap-1 rounded-full bg-ink px-2.5 text-[0.8667rem] font-bold whitespace-nowrap text-bg shadow-lg md:min-h-10 md:gap-1.5 md:px-3 md:text-sm"
        >
          <Plane className="h-4 w-4 shrink-0" aria-hidden />
          <span className="md:hidden" aria-hidden>
            {drive ? `${drive} min` : t("map.toAirportShort")}
          </span>
          <span className="max-md:hidden">{edgeText}</span>
          <ArrowRight className="h-4 w-4 shrink-0" style={{ transform: `rotate(${edge.angle}rad)` }} aria-hidden />
        </button>
      )}
    </div>
  );
}

/**
 * Push overlapping pills apart in screen space, like the planner map (here only up/down). The active pill stays on its
 * true spot; a moved pill gets a dot on its spot and a line to it. Previews follow the pill.
 */
interface PinRef {
  id: string;
  marker: L.Marker;
  latlng: L.LatLng;
  /** Stacking order of the marker when it isn't selected */
  base: number;
  /** 1 booked, 2 favourite, 3 other: only 1 and 2 get a full pill in compact mode */
  rank: number;
}

/**
 * Compact (phones): no stacking. The selected place, then booked, then favourite places get a
 * price pill at their true spot; any pill that would touch one already placed becomes a dot,
 * and so does every other place.
 */
function layoutCompact(map: L.Map, pins: PinRef[], activeId: string | null) {
  const order = pins
    .map((p, i) => ({ p, i, rank: p.id === activeId ? 0 : p.rank }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i);
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  for (const { p, rank } of order) {
    const root = p.marker.getElement();
    const pill = root?.querySelector<HTMLElement>(".sp-pill");
    const pos = root?.querySelector<HTMLElement>(".sp-pos");
    const leader = root?.querySelector<HTMLElement>(".sp-leader");
    const dot = root?.querySelector<HTMLElement>(".sp-dot");
    if (!root) continue;
    if (pos) pos.style.transform = "";
    if (leader) leader.style.display = "none";
    if (dot) dot.style.display = "none";
    const s = rank === 0 ? ACTIVE_SCALE : 1;
    const w = (pill?.offsetWidth ?? 70) * s;
    const h = (pill?.offsetHeight ?? 26) * s;
    const pt = map.latLngToLayerPoint(p.latlng);
    const box = { x: pt.x, y: pt.y - TAIL - h / 2, w, h };
    const hit = placed.some((o) => Math.abs(o.x - box.x) < (o.w + box.w) / 2 + GAP && Math.abs(o.y - box.y) < (o.h + box.h) / 2 + GAP);
    const dotOnly = rank === 3 || hit;
    root.classList.toggle("sp-collapsed", dotOnly);
    if (!dotOnly) placed.push(box);
  }
}

function layout(map: L.Map, pins: PinRef[], activeId: string | null, compact = false) {
  if (compact) return layoutCompact(map, pins, activeId);
  for (const p of pins) p.marker.getElement()?.classList.remove("sp-collapsed");
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
