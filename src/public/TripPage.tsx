import { Link } from "react-router";
import { usePublicTrip } from "@/lib/public-store";

/** Public family page — placeholder until it's built. Read-only, no login. */
export default function TripPage() {
  const { trip, status } = usePublicTrip();
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-10">
        <section className="bg-hero rounded-[1.75rem] p-6 md:p-10">
          <p className="font-bold opacity-85">Tenerife · 8.–15. decembris 2026</p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-6xl">Mūsu ceļojums</h1>
          <p className="mt-1 text-lg opacity-85">Our trip</p>
        </section>
        <p className="mt-6 text-lg" role="status">
          {status === "loading"
            ? "Ielādē… / Loading…"
            : status === "error"
              ? "Neizdevās ielādēt. / Couldn't load the trip."
              : "Drīz šeit būs viss par ceļojumu. / The trip page is coming soon."}
        </p>
        {trip && (
          <p className="mt-2 text-sm text-muted">
            {trip.travellers.length} ceļotāji / travellers · {trip.days.length} dienas / days
          </p>
        )}
      </main>
      <footer className="mx-auto w-full max-w-3xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-right">
        <Link to="/plan" className="inline-flex min-h-11 items-center px-2 text-sm text-muted underline">
          Planner
        </Link>
      </footer>
    </div>
  );
}
