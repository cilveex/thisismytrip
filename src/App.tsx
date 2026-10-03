import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { PublicTripProvider } from "./lib/public-store";
import TripPage from "./public/TripPage";
import { Placeholder } from "./pages/Placeholder";

// The planner (and Leaflet, budget logic…) loads only when someone opens /plan.
const Planner = lazy(() => import("./planner/Planner"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          index
          element={
            <PublicTripProvider>
              <TripPage />
            </PublicTripProvider>
          }
        />
        <Route
          path="plan/*"
          element={
            <Suspense
              fallback={
                <p className="py-20 text-center text-muted" role="status">
                  Loading…
                </p>
              }
            >
              <Planner />
            </Suspense>
          }
        />
        {/* Old planner links */}
        {["stay", "budget", "days"].map((p) => (
          <Route key={p} path={p} element={<Navigate to={`/plan/${p}`} replace />} />
        ))}
        <Route path="notes" element={<Navigate to="/plan/info" replace />} />
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Routes>
    </BrowserRouter>
  );
}
