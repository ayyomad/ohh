import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

// The proxy target comes from the environment (docker compose sets
// VITE_API_PROXY_TARGET=http://backend:8000 in the `full` profile);
// local dev falls back to the natively-run backend.
const proxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
