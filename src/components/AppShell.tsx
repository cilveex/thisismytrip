import { NavLink, Outlet } from "react-router";
import { BedDouble, CalendarDays, Info, LogOut, Map, Monitor, Moon, Sun, Wallet } from "lucide-react";
import { useTrip, type SyncStatus } from "@/lib/trip-store";
import { computeBudget } from "@/lib/budget";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { LeftPill } from "./ui";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/plan", label: "Map", icon: Map },
  { to: "/plan/stay", label: "Stay", icon: BedDouble },
  { to: "/plan/budget", label: "Budget", icon: Wallet },
  { to: "/plan/days", label: "Days", icon: CalendarDays },
  { to: "/plan/info", label: "Info", icon: Info },
] as const;

export function AppShell() {
  const { trip, status } = useTrip();
  const b = trip ? computeBudget(trip) : null;

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-12">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-card focus:p-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-[1000] border-b bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:h-16 md:gap-6 md:px-6">
          <NavLink to="/plan" className="inline-flex min-h-11 items-center font-display text-xl font-extrabold">
            Tenerife<span className="text-accent">.</span>
          </NavLink>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/plan"}
                className={({ isActive }) =>
                  cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold",
                    isActive ? "bg-soft text-ink" : "text-muted hover:bg-soft",
                  )
                }
              >
                <n.icon className="h-5 w-5" aria-hidden /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <SyncDot status={status} />
            {b && <LeftPill left={b.left} className="text-sm" />}
            <ThemeButton />
            <LogOutButton />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pt-5 md:px-6 md:pt-8">
        {trip ? (
          <Outlet />
        ) : (
          <p className="py-20 text-center text-lg text-muted" role="status">
            {status === "error" ? "Couldn't reach the shared plan. Check your connection." : "Loading the shared plan…"}
          </p>
        )}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-[1000] border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.to === "/plan"}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold",
                    isActive ? "text-primary" : "text-muted",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("grid h-8 w-14 place-items-center rounded-full", isActive && "bg-soft")}>
                      <n.icon className="h-6 w-6" aria-hidden />
                    </span>
                    {n.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

const syncText: Record<SyncStatus, string> = {
  loading: "Loading",
  live: "Saved",
  saving: "Saving…",
  error: "Not saved — retrying",
  local: "This device only",
};
const syncDot: Record<SyncStatus, string> = {
  loading: "bg-line",
  live: "bg-good",
  saving: "bg-accent",
  error: "bg-bad",
  local: "bg-accent",
};

function SyncDot({ status }: { status: SyncStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" role="status" title={syncText[status]}>
      <span className={cn("h-2.5 w-2.5 rounded-full", syncDot[status])} aria-hidden />
      {/* Text only on wider screens; the dot alone on phones, with the label for screen readers */}
      <span className="sr-only lg:not-sr-only">{syncText[status]}</span>
    </span>
  );
}

function ThemeButton() {
  const { pref, cycle } = useTheme();
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  const label = pref === "system" ? "Theme: follows device" : `Theme: ${pref}`;
  return (
    <button
      type="button"
      onClick={cycle}
      className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-soft"
      aria-label={`${label}. Tap to change.`}
      title={label}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
}

function LogOutButton() {
  const { session, logOut } = useAuth();
  if (session === "local") return null; // dev without Supabase: nothing to log out of
  return (
    <button
      type="button"
      onClick={() => void logOut()}
      className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full text-muted hover:bg-soft lg:px-3"
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-5 w-5" aria-hidden />
      <span className="hidden font-bold lg:inline">Log out</span>
    </button>
  );
}
