import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { ToastCtx } from "@/lib/toast";

const SHOW_MS = 6000;

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

  useEffect(() => {
    const el = ref.current;
    if (!el || !msg) return;
    // Re-show so it's above any dialog opened since last time
    if (el.matches(":popover-open")) el.hidePopover();
    el.showPopover();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), SHOW_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [msg]);

  useEffect(() => {
    const el = ref.current;
    if (el && !msg && el.matches(":popover-open")) el.hidePopover();
  }, [msg]);

  return (
    <ToastCtx.Provider value={show}>
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
