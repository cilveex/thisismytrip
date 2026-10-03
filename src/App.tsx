import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import MapPage from "./pages/MapPage";
import { Placeholder } from "./pages/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MapPage />} />
          <Route path="stay" element={<Placeholder title="Stay" step={3} />} />
          <Route path="budget" element={<Placeholder title="Budget" step={4} />} />
          <Route path="days" element={<Placeholder title="Days" step={5} />} />
          <Route path="notes" element={<Placeholder title="Notes" step={5} />} />
          <Route path="*" element={<Placeholder title="Not found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
