import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";
import { Toaster } from "./components/Toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster>
      <App />
    </Toaster>
  </StrictMode>,
);
