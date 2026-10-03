import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";
import { ToastCtx, useNotice, type Notice } from "@/lib/toast";

const SHOW_MS = 6000;
const supportsPopover = (el: HTMLElement) => typeof el.showPopover === "function";
const NOTICE_MS = 8000;

/**
 * One toast at a time. Uses the Popover API so it sits in the top layer —
 * above an open <dialog> drawer, where a fixed-position div would be hidden.
 */
export function Toaster({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; n: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    setMsg((m) => ({ text, n: (m?.n ?? 0) + 1 }));
  }, []);

  const [notice, setNotice] = useState<Notice | null>(null);
  const important = useCallback(
    (text: string, where: string) => {
      show(text);
      setNotice((m) => ({ text, where, n: (m?.n ?? 0) + 1 }));
    },
    [show],
  );
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !msg) return;
    // Without the Popover API (iOS < 17) the div still shows as a fixed banner, just not above dialogs.
    if (supportsPopover(el)) {
      // Re-show so it's above any dialog opened since last time
      if (el.matches(":popover-open")) el.hidePopover();
      el.showPopover();
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), SHOW_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [msg]);

  useEffect(() => {
    const el = ref.current;
    if (el && !msg && supportsPopover(el) && el.matches(":popover-open")) el.hidePopover();
  }, [msg]);

  return (
    <ToastCtx.Provider value={{ toast: show, important, notice }}>
      {children}
      <div
        ref={ref}
        popover="manual"
        role="status"
        aria-live="polite"
        className="toast m-0 border-0 bg-transparent p-0"
      >
        {msg && (
          <div className="flex items-start gap-2 rounded-2xl bg-ink py-2 pr-2 pl-4 font-bold text-bg shadow-lg">
            <span className="py-2">{msg.text}</span>
            <button
              type="button"
              onClick={() => setMsg(null)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

/** Inline copy of an important toast, for browsers without the Popover API (iOS < 17) and for anyone who missed it. */
export function InlineNotice({ where, className }: { where: string; className?: string }) {
  const notice = useNotice();
  if (!notice || notice.where !== where) return null;
  return (
    <p
      key={notice.n}
      className={`flex gap-2 rounded-xl border border-primary bg-primary/10 p-3 font-bold ${className ?? ""}`}
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span>{notice.text}</span>
    </p>
  );
}
