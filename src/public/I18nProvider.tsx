import { useEffect, useState, type ReactNode } from "react";
import { I18nCtx, LOCALE, translate, translatePlural, type Lang } from "./i18n";

const KEY = "trip-lang";

function initial(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "lv" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "lv"; // Latvian by default
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial);
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);
  return (
    <I18nCtx.Provider
      value={{
        lang,
        setLang,
        locale: LOCALE[lang],
        t: (k, v) => translate(lang, k, v),
        tn: (b, n, v) => translatePlural(lang, b, n, v),
      }}
    >
      {children}
    </I18nCtx.Provider>
  );
}
