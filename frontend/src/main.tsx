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

// Before React renders, so the first frame already matches the stored theme.
applyInitialTheme();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing #root element in index.html");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
