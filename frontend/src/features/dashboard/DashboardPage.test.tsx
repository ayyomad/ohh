/**
 * Dashboard behaviour over a mocked fetch (transport-level mocking: every
 * scenario is a stubbed HTTP answer, exactly like the real API contract).
 * All components render under a QueryClientProvider with retries OFF so
 * failures surface immediately.
 */

import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Board } from "../../api/boards";
import { DashboardPage } from "./DashboardPage";

type MockReply = { status: number; body?: unknown };

function fakeResponse(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => body,
  };
}

/** Routes every fetch call through `respond(url, init)`. */
let fetchMock: ReturnType<typeof vi.fn> | null = null;

function stubFetch(
  respond: (url: string, init?: RequestInit) => MockReply
): void {
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const reply = respond(String(input), init);
    return fakeResponse(reply.status, reply.body);
  });
  vi.stubGlobal("fetch", mock as unknown as typeof fetch);
  fetchMock = mock;
}

function callCount(method: string): number {
  return (fetchMock?.mock.calls ?? []).filter(
    (call) => (call[1] as RequestInit | undefined)?.method === method
  ).length;
}

function callsOf(method: string): string[] {
  return (fetchMock?.mock.calls ?? [])
    .filter((call) => (call[1] as RequestInit | undefined)?.method === method)
    .map((call) => String(call[0]));
}

function firstBodyOf(method: string): unknown {
  const call = (fetchMock?.mock.calls ?? []).find(
    (call) => (call[1] as RequestInit | undefined)?.method === method
  );
  return call === undefined ? undefined : JSON.parse(String((call[1] as RequestInit).body));
}

function paginated(results: Board[]) {
  return { count: results.length, next: null, previous: null, results };
}

/** Distinct board for the pagination test; n=1..21 gives Board 01..Board 21. */
function boardN(n: number): Board {
  return {
    ...boardFromId(`nnnn-${String(n).padStart(2, "0")}`),
    title: `Board ${String(n).padStart(2, "0")}`,
  };
}

/**
 * jsdom keeps CLOSED <dialog> elements in the DOM (only the `open` attribute
 * goes away), so unscoped getByText/getByRole queries match dialog content
 * that the user cannot see. We resolve that explicitly: text matches stay
 * scoped to buttons, and dialog interactions go through the one OPEN dialog.
 */
function getOpenDialog(): HTMLDialogElement {
  const open = Array.from(document.querySelectorAll("dialog")).filter(
    (element) => element.open
  );
  if (open.length !== 1) {
    throw new Error(`expected exactly one open dialog, found ${open.length}`);
  }
  return open[0] as HTMLDialogElement;
}

function expectNoOpenDialog(): void {
  expect(document.querySelector("dialog[open]")).toBeNull();
}

function boardFromId(id: string): Board {
  return {
    id,
    title: "Paint Plan",
    description: "Colours and strokes",
    settings: { appearance: "light", background: "dots" },
    created_at: "2026-11-01T10:00:00Z",
    updated_at: new Date().toISOString(),
  };
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
}

/** Health is the footer; everything else goes to the boards route. */
function stubCommon(
  list: (url: string, init?: RequestInit) => MockReply
): void {
  stubFetch((url, init) => {
    if (url.includes("/api/v1/health/")) {
      return { status: 200, body: { status: "ok", database: "ok", version: "0.1.0" } };
    }
    return list(url, init);
  });
}

afterEach(() => {
  cleanup();
  fetchMock = null;
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("DashboardPage", () => {
  it("renders boards from the API", async () => {
    stubCommon(() => ({ status: 200, body: paginated([boardFromId("aaaa")]) }));

    renderDashboard();

    await screen.findByText("Paint Plan");
    expect(screen.getByText(/EDITED just now/u)).toBeInTheDocument();
    expect(screen.getByText("SETTINGS")).toBeInTheDocument();
  });

  it("shows the empty state when there are no boards", async () => {
    stubCommon(() => ({ status: 200, body: paginated([]) }));

    renderDashboard();

    await screen.findByText("an empty table. start something.");
  });

  it("shows the error state with RETRY, which recovers", async () => {
    let listFailures = 0;
    stubCommon(() => {
      if (listFailures === 0) {
        listFailures += 1;
        return { status: 500, body: "boom" };
      }
      return { status: 200, body: paginated([boardFromId("bbbb")]) };
    });

    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText("COULD NOT LOAD BOARDS");
    await user.click(screen.getByText("RETRY"));
    await screen.findByText("Paint Plan");
  });

  it("creates a board and refreshes the list", async () => {
    stubCommon(() => {
      if (callCount("POST") > 0) {
        return { status: 200, body: paginated([{ ...boardFromId("cccc"), title: "Sunrise" }]) };
      }
      return { status: 200, body: paginated([boardFromId("aaaa")]) };
    });

    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Paint Plan");

    // The header button (the empty-state button is absent while a board is
    // listed, and the closed dialog's <h2> is not a button).
    await user.click(screen.getByRole("button", { name: "NEW BOARD" }));
    const dialog = getOpenDialog();
    await user.type(within(dialog).getByLabelText("TITLE"), "Sunrise");
    await user.click(within(dialog).getByText("CREATE"));

    expect(callsOf("POST")).toEqual(["/api/v1/boards/"]);
    expect(firstBodyOf("POST")).toEqual({
      title: "Sunrise",
      description: "",
      settings: { appearance: "light", background: "dots" },
    });
    await screen.findByText("Sunrise");
    expectNoOpenDialog();
  });

  it("keeps the dialog open and shows API field errors on a 400", async () => {
    stubCommon((_url, init) => {
      if (init?.method === "POST") {
        return { status: 400, body: { title: ["This field may not be blank."] } };
      }
      return { status: 200, body: paginated([]) };
    });

    const user = userEvent.setup();
    renderDashboard();
    // Empty state: header button + empty-state button (index 0 = header).
    const newBoardButtons = await screen.findAllByRole("button", {
      name: "NEW BOARD",
    });
    await user.click(newBoardButtons[0]);
    const dialog = getOpenDialog();
    await user.click(within(dialog).getByText("CREATE"));

    const alert = await screen.findByText("This field may not be blank.");
    expect(alert).toHaveAttribute("role", "alert");
    expect(getOpenDialog()).toBeDefined();
    expect(callCount("POST")).toBe(1);
  });

  it("edits a board via SETTINGS with a PATCH of the changed fields", async () => {
    stubCommon((_url, init) => {
      if (init?.method === "PATCH") {
        return { status: 200, body: { ...boardFromId("dddd"), title: "Paint Plan v2" } };
      }
      return { status: 200, body: paginated([boardFromId("dddd")]) };
    });

    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Paint Plan");

    await user.click(screen.getByText("SETTINGS"));
    const dialog = getOpenDialog();
    expect(within(dialog).getByLabelText("TITLE")).toHaveValue("Paint Plan");

    await user.type(within(dialog).getByLabelText("TITLE"), " v2");
    await user.click(within(dialog).getByText("SAVE"));

    await waitFor(() => {
      expect(callsOf("PATCH")).toEqual(["/api/v1/boards/dddd/"]);
    });
    expect(firstBodyOf("PATCH")).toEqual({ title: "Paint Plan v2" });
  });

  it("deletes a board after confirmation and does nothing on cancel", async () => {
    // The list reflects reality: once a DELETE call exists the (invalidated)
    // refetch must return an empty list. State-driven, no test-side flag,
    // so the refetch can never race the test.
    stubCommon(() => {
      if (callsOf("DELETE").length > 0) {
        return { status: 200, body: paginated([]) };
      }
      return { status: 200, body: paginated([boardFromId("eeee")]) };
    });

    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Paint Plan");

    await user.click(screen.getByText("DELETE"));
    const dialog = getOpenDialog();
    // The confirm copy wraps the title in curly quotes, so match by substring.
    expect(within(dialog).getByText(/Paint Plan/u)).toBeInTheDocument();

    await user.click(within(dialog).getByText("CANCEL"));
    expect(callCount("DELETE")).toBe(0);
    expectNoOpenDialog();

    await user.click(screen.getByText("DELETE")); // tile DELETE again
    await user.click(within(getOpenDialog()).getByText("DELETE"));

    await waitFor(() => {
      expect(callsOf("DELETE")).toEqual(["/api/v1/boards/eeee/"]);
    });
    await waitFor(() => {
      // The (invalidated) refetch now returns nothing, tile gone.
      expect(screen.queryByText("Paint Plan")).not.toBeInTheDocument();
    });
  });

  it("keeps the confirm dialog open with an alert when DELETE fails", async () => {
    stubCommon((_url, init) => {
      if (init?.method === "DELETE") {
        return { status: 500, body: "boom" };
      }
      return { status: 200, body: paginated([boardFromId("eeee")]) };
    });

    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Paint Plan");

    await user.click(screen.getByText("DELETE"));
    const dialog = getOpenDialog();
    await user.click(within(dialog).getByText("DELETE"));

    // Silent closure would read as "deleted" while the board survives.
    const alert = await within(dialog).findByText("COULD NOT DELETE");
    expect(alert).toHaveAttribute("role", "alert");
    expect(getOpenDialog()).toBeDefined();
    expect(callCount("DELETE")).toBe(1);
    expect(screen.getByText("Paint Plan")).toBeInTheDocument();
  });

  it("debounces keystrokes into ONE search request (fake timers)", async () => {
    stubCommon((url) => {
      if (url.includes("search=plan")) {
        return { status: 200, body: paginated([{ ...boardFromId("ffff"), title: "Plan" }]) };
      }
      return { status: 200, body: paginated([]) };
    });

    // Keystrokes are change events fired 50 ms apart, so the debounce timer
    // is cancelled and re-scheduled on every one and only the last survives.
    renderDashboard();
    await screen.findAllByRole("button", { name: "NEW BOARD" });

    vi.useFakeTimers();
    try {
      const input = screen.getByLabelText("SEARCH BOARDS");
      await act(async () => {
        let typed = "";
        for (const char of "plan") {
          typed += char;
          fireEvent.change(input, { target: { value: typed } });
          vi.advanceTimersByTime(50);
        }
      });

      // Still inside the 200 ms window (the last keystroke just landed).
      const searchUrls = () =>
        (fetchMock?.mock.calls ?? [])
          .map((call) => String(call[0]))
          .filter((url) => url.includes("/api/v1/boards/"));
      expect(searchUrls().filter((url) => url.includes("search="))).toHaveLength(0);

      // The debounce window passes on the mocked clock: exactly ONE request.
      await act(async () => {
        vi.advanceTimersByTime(250);
      });
      const planCalls = searchUrls().filter((url) => url.includes("search=plan"));
      expect(planCalls).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("LOAD MORE appends page 2 and keeps page 1 visible", async () => {
    const firstPage = Array.from({ length: 20 }, (_, i) => boardN(i + 1));
    stubCommon((url) => {
      if (url.includes("page=2")) {
        return { status: 200, body: paginated([boardN(21)]) };
      }
      return {
        status: 200,
        // next is a string: `next !== null` is only a "has more" flag (never
        // followed), mirroring the real API contract.
        body: { count: 21, next: "/api/v1/boards/?page=2", previous: null, results: firstPage },
      };
    });

    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Board 01");
    expect(screen.getAllByText(/^Board /u)).toHaveLength(20);

    await user.click(screen.getByRole("button", { name: "LOAD MORE" }));
    await screen.findByText("Board 21");

    // Append, not replace: the first 20 tiles are still there.
    expect(screen.getByText("Board 01")).toBeInTheDocument();
    expect(screen.getAllByText(/^Board /u)).toHaveLength(21);
  });

  it("reopens NEW BOARD with fresh defaults after a successful create", async () => {
    stubCommon(() => {
      if (callCount("POST") > 0) {
        return {
          status: 200,
          body: paginated([boardFromId("aaaa"), { ...boardFromId("cccc"), title: "Sunrise" }]),
        };
      }
      return { status: 200, body: paginated([boardFromId("aaaa")]) };
    });

    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Paint Plan");

    await user.click(screen.getByRole("button", { name: "NEW BOARD" }));
    let dialog = getOpenDialog();
    await user.type(within(dialog).getByLabelText("TITLE"), "Sunrise");
    await user.click(within(dialog).getByText("CREATE"));
    await screen.findByText("Sunrise");
    expectNoOpenDialog();

    // The dialog is mounted fresh per open, so the previous title, mode and
    // errors cannot leak into this one.
    await user.click(screen.getByRole("button", { name: "NEW BOARD" }));
    dialog = getOpenDialog();
    expect(within(dialog).getByLabelText("TITLE")).toHaveValue("");
    expect(within(dialog).getByRole("radio", { name: "LIGHT" })).toBeChecked();
    expect(within(dialog).getByRole("radio", { name: "DOTS" })).toBeChecked();
  });

  it("keeps the Phase 1 theme toggle working and persisted", async () => {
    stubCommon(() => ({ status: 200, body: paginated([]) }));

    const user = userEvent.setup();
    renderDashboard();

    const toggle = await screen.findByRole("button", {
      name: /switch to dark theme/i,
    });
    await user.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("ohh-theme")).toBe("dark");
  });
});
