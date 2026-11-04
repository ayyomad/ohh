/**
 * BackendStatus behaviour (adapted Phase 1 coverage: OK / DEGRADED /
 * UNREACHABLE via the real health contract).
 */

import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, vi } from "vitest";
import { BackendStatus } from "./BackendStatus";

function stubHealth(status: number, body: unknown): void {
  const responder = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
  vi.stubGlobal("fetch", responder as unknown as typeof fetch);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BackendStatus", () => {
  it("shows OK when the backend reports a healthy database", async () => {
    stubHealth(200, { status: "ok", database: "ok", version: "0.1.0" });
    render(<BackendStatus />);
    await screen.findByText(/BACKEND OK/);
  });

  it("shows DEGRADED when the backend answers 503", async () => {
    stubHealth(503, { status: "degraded", database: "error", version: "0.1.0" });
    render(<BackendStatus />);
    await screen.findByText(/BACKEND DEGRADED/);
  });

  it("shows UNREACHABLE when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("failed to fetch");
      }) as unknown as typeof fetch
    );
    render(<BackendStatus />);
    await screen.findByText(/BACKEND UNREACHABLE/);
  });
});
