import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

// The proxy target comes from the environment (docker compose sets
// VITE_API_PROXY_TARGET=http://backend:8000 in the `full` profile);
// local dev falls back to the natively-run backend.
// 127.0.0.1, not localhost (D-024): on Windows localhost may resolve to IPv6
// ::1 first while the backend listens on IPv4 only, adding multi-second
// delays per connection. The compose `full` profile overrides host and
// target via its own CLI flags/env.
const proxyTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
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
