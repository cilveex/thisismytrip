import { useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "theme";

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Per-device theme preference; index.html applies it before first paint to avoid a flash. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(read);
  useEffect(() => {
    const html = document.documentElement;
    if (pref === "system") html.removeAttribute("data-theme");
    else html.setAttribute("data-theme", pref);
    try {
      if (pref === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, pref);
    } catch {
      /* private mode — preference lasts this session only */
    }
  }, [pref]);
  const next: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
  return { pref, cycle: () => setPref((p) => next[p]) };
}
