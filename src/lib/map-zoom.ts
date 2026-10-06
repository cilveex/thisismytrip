import type L from "leaflet";
import { isTouch } from "./device";

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

/** "⌘ Cmd" on a Mac, else "Ctrl" */
export const zoomKeyLabel = () => (isMac() ? "⌘ Cmd" : "Ctrl");

/** Safari's trackpad pinch (not in the DOM typings) */
type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number };

/**
 * Wheel zoom only with Ctrl (⌘ on a Mac) or a trackpad pinch, so a plain scroll over the map keeps
 * scrolling the page. A plain scroll briefly shows `hint` over the map instead.
 * Needs the map created with `scrollWheelZoom: true`. + / − and double-click are untouched.
 * Returns `setHint` (for a language switch) and `remove`.
 */
export function gateWheelZoom(map: L.Map, hint: string) {
  const box = map.getContainer();
  const tip = document.createElement("div");
  tip.className = "map-zoom-hint";
  tip.setAttribute("aria-hidden", "true");
  tip.innerHTML = `<span></span>`;
  tip.firstElementChild!.textContent = hint;
  box.appendChild(tip);
  let hide: ReturnType<typeof setTimeout> | undefined;

  // Capture phase on the container runs before Leaflet's own wheel listener (bubble phase)
  const onWheel = (e: WheelEvent) => {
    // Chrome, Edge and Firefox report a trackpad pinch as a wheel event with ctrlKey set
    if (e.ctrlKey || e.metaKey) return;
    e.stopPropagation(); // Leaflet never sees it; the page scrolls as usual
    // Sideways-only trackpad swipes aren't an attempt to zoom
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    tip.classList.add("show");
    clearTimeout(hide);
    hide = setTimeout(() => tip.classList.remove("show"), 1400);
  };

  // Safari reports a trackpad pinch as gesture events instead
  let startZoom = 0;
  const onGestureStart = (e: Event) => {
    e.preventDefault(); // no page zoom
    startZoom = map.getZoom();
  };
  const onGestureChange = (e: Event) => {
    e.preventDefault();
    const g = e as GestureEvent;
    const r = box.getBoundingClientRect();
    const at: L.PointExpression = [g.clientX - r.left, g.clientY - r.top];
    map.setZoomAround(at, startZoom + Math.log2(g.scale), { animate: false });
  };

  // On phones and tablets Safari fires these for a two-finger pinch too, which Leaflet already handles
  const gestures = !isTouch();
  box.addEventListener("wheel", onWheel, { capture: true });
  if (gestures) {
    box.addEventListener("gesturestart", onGestureStart);
    box.addEventListener("gesturechange", onGestureChange);
  }
  return {
    setHint: (text: string) => void (tip.firstElementChild!.textContent = text),
    remove: () => {
      clearTimeout(hide);
      box.removeEventListener("wheel", onWheel, { capture: true });
      box.removeEventListener("gesturestart", onGestureStart);
      box.removeEventListener("gesturechange", onGestureChange);
      tip.remove();
    },
  };
}
