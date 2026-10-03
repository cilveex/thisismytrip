import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import { eur } from "@/lib/budget";
import type { Walk } from "@/lib/trip-data";
import { cn } from "@/lib/cn";


/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "ghost" | "accent";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:brightness-110",
  accent: "bg-accent text-on-accent hover:brightness-105",
  secondary: "bg-soft text-ink hover:brightness-95",
  ghost: "text-ink hover:bg-soft",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-bold transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
}

/* ---------- Form fields ---------- */

const labelCls = "mb-1 block text-sm font-bold text-muted";

export function NumField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  decimals = false,
  min = 0,
  max,
  className,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  /** Allow decimals (shows the decimal keypad on phones) */
  decimals?: boolean;
  min?: number;
  max?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          inputMode={decimals ? "decimal" : "numeric"}
          pattern={decimals ? undefined : "[0-9]*"}
          step={decimals ? "any" : 1}
          min={min}
          max={max}
          className={cn("field tabular-nums", prefix && "pl-7", suffix && "pr-14")}
          value={value ?? ""}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            if (e.target.value === "") return onChange(null);
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "url";
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === "url" ? "url" : undefined}
        className="field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="field resize-y"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  className,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("flex min-h-11 items-center gap-3 text-left font-bold", className)}
    >
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      {label}
    </button>
  );
}

/* ---------- Display ---------- */

export function LeftPill({ left, prefix, className }: { left: number; prefix?: string; className?: string }) {
  const ok = left >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-bold whitespace-nowrap tabular-nums",
        ok ? "bg-good text-on-good" : "bg-bad text-on-bad",
        className,
      )}
    >
      {prefix}
      {eur(left)} {ok ? "left" : "over"}
    </span>
  );
}

export function Score({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Easy for grandma: ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("h-2.5 w-2.5 rounded-full", i <= n ? "bg-accent" : "bg-line")} />
      ))}
    </span>
  );
}

const walkText: Record<Walk, string> = { little: "Little walking", some: "Some walking", lots: "Lots of walking" };
const walkDot: Record<Walk, string> = { little: "bg-good", some: "bg-accent", lots: "bg-bad" };
export function WalkTag({ w }: { w: Walk }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold">
      <span className={cn("h-3 w-3 rounded-full", walkDot[w])} aria-hidden />
      {walkText[w]}
    </span>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

/* ---------- Bottom sheet ---------- */

/** Bottom sheet on phones, centred dialog on desktop. Native <dialog>: focus trap, Esc and top layer for free. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Lock page scroll behind the sheet (iOS ignores overflow on body alone for some cases, so do both)
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88dvh] overflow-y-auto px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="pt-2 text-2xl font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-soft"
            aria-label="Close"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
