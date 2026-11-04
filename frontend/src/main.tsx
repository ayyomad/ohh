import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted fonts first, then styles (docs/UI_DESIGN_SYSTEM.md).
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/instrument-serif";
import "@fontsource/instrument-serif/400-italic.css";

import "./styles/tokens.css";
import { applyInitialTheme } from "./theme";
import { App } from "./App";
import { ApiError } from "./api/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Before React renders, so the first frame already matches the stored theme.
applyInitialTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx are answers, not accidents: retrying them only repeats a 400.
      // Other failures (network, 5xx) retry at most ONCE so the error state
      // appears quickly when the backend is down.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing #root element in index.html");
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
