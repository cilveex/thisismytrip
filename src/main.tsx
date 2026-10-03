import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { TripProvider } from "./lib/trip-store";
import App from "./App";
import { Toaster } from "./components/Toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TripProvider>
      <Toaster>
        <App />
      </Toaster>
    </TripProvider>
  </StrictMode>,
);
