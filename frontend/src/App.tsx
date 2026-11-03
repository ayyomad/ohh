/**
 * Phase 1 system status screen (docs/UI_DESIGN_SYSTEM.md: flat surfaces,
 * 1.5px ink borders, mono metadata labels, one orange accent).
 */

import { useEffect, useState } from "react";
import { fetchHealth } from "./api/health";
import { useTheme } from "./theme";

type BackendState = "checking" | "ok" | "degraded" | "unreachable";

const BACKEND_LABEL: Record<BackendState, string> = {
  checking: "CHECKING",
  ok: "OK",
  degraded: "DEGRADED",
  unreachable: "UNREACHABLE",
};

const BACKEND_STATE_CLASSES: Record<BackendState, string> = {
  checking: "text-muted",
  ok: "text-ink",
  degraded: "text-accent-text",
  unreachable: "text-accent-text",
};

export function App(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const [backendState, setBackendState] = useState<BackendState>("checking");
  const [version, setVersion] = useState<string>("—");

  useEffect(() => {
    // Abort on unmount so state updates never land in a dead component.
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((outcome) => {
        // AbortController fires the rejection and also marks the signal:
        // check both paths so an aborted request never touches component
        // state (React logs nothing, the app never shows a stale state).
        if (controller.signal.aborted) {
          return;
        }
        setBackendState(outcome.state);
        setVersion(outcome.version);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setBackendState("unreachable");
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-ground font-sans text-ink flex items-center justify-center">
      <section className="bg-surface w-full max-w-sm border-[1.5px] border-ink rounded-xl p-10">
        <h1 className="text-4xl font-bold tracking-tight">
          OHh<span className="text-accent">.</span>
        </h1>

        <div className="mt-10">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            BACKEND
          </p>
          {/* role=status: the label change is announced as soon as it flips. */}
          <p
            role="status"
            className={`font-mono text-2xl tabular-nums ${BACKEND_STATE_CLASSES[backendState]}`}
          >
            {BACKEND_LABEL[backendState]}
          </p>
        </div>

        <div className="mt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            VERSION
          </p>
          <p className="font-mono text-2xl tabular-nums">{version}</p>
        </div>

        <footer className="mt-10 flex items-center justify-between gap-4">
          <p className="font-serif italic text-lg">a space for thinking.</p>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            className="font-mono text-xs uppercase tracking-widest border-[1.5px] border-ink rounded px-3 py-2 hover:bg-surface-2"
          >
            {theme === "light" ? "DARK" : "LIGHT"}
          </button>
        </footer>
      </section>
    </main>
  );
}
