/** Rough box around Tenerife, to catch pasted links for the wrong place */
const onTenerife = (lat: number, lng: number) => lat > 27.9 && lat < 28.7 && lng > -17 && lng < -16;

const PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // place pin in /maps/place/… links (better than the viewport)
  /[?&](?:q|query|ll|center|destination|daddr)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // map viewport centre
  /^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/, // plain "28.05, -16.71"
];

/** Coordinates from a full Google Maps link or "lat, lng" text. */
export function parseLocation(text: string): { lat: number; lng: number } | { error: string } {
  const t = text.trim();
  if (!t) return { error: "Paste a Google Maps link or coordinates." };
  if (/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(t))
    return { error: "Short links don't work here. Open the link, then copy the full address from the browser bar." };
  for (const re of PATTERNS) {
    const m = t.match(re);
    if (m?.[1] && m[2]) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (!onTenerife(lat, lng)) return { error: "Those coordinates aren't on Tenerife." };
      return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
    }
  }
  return { error: "Couldn't find coordinates in that link." };
}
