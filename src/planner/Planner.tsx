import { Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { TripProvider } from "@/lib/trip-store";
import MapPage from "@/pages/MapPage";
import StayPage from "@/pages/StayPage";
import BudgetPage from "@/pages/BudgetPage";
import DaysPage from "@/pages/DaysPage";
import InfoPage from "@/pages/InfoPage";
import { Login } from "./Login";

/** Everything under /plan: login gate, then the private planner. Loaded as its own chunk. */
export default function Planner() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <p className="py-20 text-center text-muted" role="status">
        Loading…
      </p>
    );
  if (!session) return <Login />;
  return (
    <TripProvider canWrite={!!session}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MapPage />} />
          <Route path="stay" element={<StayPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="days" element={<DaysPage />} />
          <Route path="info" element={<InfoPage />} />
          <Route path="notes" element={<Navigate to="/plan/info" replace />} />
          <Route path="*" element={<Navigate to="/plan" replace />} />
        </Route>
      </Routes>
    </TripProvider>
  );
}
