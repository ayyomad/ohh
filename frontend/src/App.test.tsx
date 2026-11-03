/**
 * Phase 1 status-screen behaviour.
 *
 * fetch is stubbed at the global level via vi.stubGlobal, so all transport
 * scenarios (200, 503, network error) are covered without mocking modules.
 */

import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function stubFetch(status: number, body: unknown): void {
  const responder = vi.fn(async (): Promise<MockResponse> => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
  vi.stubGlobal("fetch", responder as unknown as typeof fetch);
}

function stubFetchFailure(): void {
  const responder = vi.fn(async (): Promise<MockResponse> => {
    throw new TypeError("failed to fetch");
  });
  vi.stubGlobal("fetch", responder as unknown as typeof fetch);
}

afterEach(() => {
  // RTL auto-cleanup needs globals enabled, which we deliberately do not.
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("App", () => {
  it("shows OK when the backend reports a healthy database", async () => {
    stubFetch(200, { status: "ok", database: "ok", version: "0.1.0" });

    render(<App />);

    await screen.findByText("OK");
    expect(screen.getByText("0.1.0")).toBeInTheDocument();
  });

  it("shows DEGRADED when the backend answers 503", async () => {
    stubFetch(503, { status: "degraded", database: "error", version: "0.1.0" });

    render(<App />);

    await screen.findByText("DEGRADED");
  });

  it("shows UNREACHABLE when fetch rejects", async () => {
    stubFetchFailure();

    render(<App />);

    await screen.findByText("UNREACHABLE");
  });

  it("toggles the theme on <html> and persists the choice", async () => {
    stubFetch(200, { status: "ok", database: "ok", version: "0.1.0" });
    const user = userEvent.setup();

    render(<App />);
    await screen.findByText("OK"); // let the status request settle first

    const toggle = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(document.documentElement).not.toHaveAttribute("data-theme", "dark");

    await user.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("ohh-theme")).toBe("dark");
  });
});
