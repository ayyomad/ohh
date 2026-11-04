/**
 * Footer status line. Extracted from the Phase 1 status screen; the same
 * fetch + AbortController contract as before, just rendered inline.
 */

import { useEffect, useState } from "react";
import { fetchHealth } from "../../api/health";

type BackendState = "checking" | "ok" | "degraded" | "unreachable";

const LABELS: Record<BackendState, string> = {
  checking: "CHECKING",
  ok: "OK",
  degraded: "DEGRADED",
  unreachable: "UNREACHABLE",
};

export function BackendStatus(): React.JSX.Element {
  const [state, setState] = useState<BackendState>("checking");

  useEffect(() => {
    // Abort on unmount so state updates never land in a dead component.
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((outcome) => {
        setState(outcome.state);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setState("unreachable");
      });
    return () => controller.abort();
  }, []);

  return (
    <p role="status" className="font-mono text-xs uppercase tracking-widest text-muted">
      BACKEND {LABELS[state]}
    </p>
  );
}
