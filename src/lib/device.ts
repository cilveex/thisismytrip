/** Touch-first device (phone/tablet). Used to keep the map from trapping one-finger page scrolls. */
export const isTouch = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
