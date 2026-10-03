import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import MapPage from "./pages/MapPage";
import StayPage from "./pages/StayPage";
import BudgetPage from "./pages/BudgetPage";
import { Placeholder } from "./pages/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MapPage />} />
          <Route path="stay" element={<StayPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="days" element={<Placeholder title="Days" step={5} />} />
          <Route path="notes" element={<Placeholder title="Notes" step={5} />} />
          <Route path="*" element={<Placeholder title="Not found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
