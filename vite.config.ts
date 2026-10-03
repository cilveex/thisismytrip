import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    // Main chunk is react-dom + supabase-js + react-router (~150 kB gzip). Leaflet is split out with the map.
    chunkSizeWarningLimit: 600,
  },
});
