import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { gateWheelZoom, zoomKeyLabel } from "@/lib/map-zoom";

/** Small map for picking a spot: tap to drop the pin. Dragging is on — it's a dedicated tool in a sheet. */
export default function LocationMap({
  center,
  value,
  onPick,
}: {
  center: { lat: number; lng: number };
  value: { lat: number; lng: number } | null;
  onPick: (p: { lat: number; lng: number }) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { scrollWheelZoom: true }).setView([center.lat, center.lng], value ? 16 : 14);
    // The sheet scrolls too: a plain wheel scrolls it, Ctrl / ⌘ or a pinch zooms the map
    const wheel = gateWheelZoom(map, `Hold ${zoomKeyLabel()} and scroll to zoom`);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) =>
      onPickRef.current({ lat: Math.round(e.latlng.lat * 1e6) / 1e6, lng: Math.round(e.latlng.lng * 1e6) / 1e6 }),
    );
    mapRef.current = map;
    // The sheet animates in; measure again once it has its final size
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(t);
      wheel.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial view only
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const icon = L.divIcon({ className: "", html: '<div class="pin pin-place"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });
    if (markerRef.current) markerRef.current.setLatLng([value.lat, value.lng]);
    else markerRef.current = L.marker([value.lat, value.lng], { icon, keyboard: false }).addTo(map);
    if (!map.getBounds().pad(-0.1).contains([value.lat, value.lng])) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
  }, [value]);

  return <div ref={el} className="relative isolate z-0 h-72 w-full overflow-hidden rounded-xl border" aria-label="Map: tap to set the location" role="application" />;
}
