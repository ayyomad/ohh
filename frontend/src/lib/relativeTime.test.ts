import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relativeTime";

// A fixed clock (and mid-morning times) keep the UTC-offset of any machine
// away from the assertions.
const NOW = new Date("2026-11-03T12:00:00Z");

describe("formatRelativeTime", () => {
  it("says just now under a minute", () => {
    expect(formatRelativeTime("2026-11-03T11:59:40Z", NOW)).toBe("just now");
    expect(formatRelativeTime("2026-11-03T12:00:00Z", NOW)).toBe("just now");
  });

  it("formats whole minutes", () => {
    expect(formatRelativeTime("2026-11-03T11:15:00Z", NOW)).toBe("45 min ago");
    expect(formatRelativeTime("2026-11-03T11:01:00Z", NOW)).toBe("59 min ago");
  });

  it("formats hours above one hour", () => {
    expect(formatRelativeTime("2026-11-03T10:00:00Z", NOW)).toBe("2 h ago");
  });

  it("formats days under 30", () => {
    expect(formatRelativeTime("2026-10-29T12:00:00Z", NOW)).toBe("5 d ago");
    expect(formatRelativeTime("2026-10-05T12:00:00Z", NOW)).toBe("29 d ago");
  });

  it("falls back to YYYY-MM-DD at 30 days and beyond", () => {
    expect(formatRelativeTime("2026-10-01T12:00:00Z", NOW)).toBe("2026-10-01");
    expect(formatRelativeTime("2026-01-02T12:00:00Z", NOW)).toBe("2026-01-02");
  });
});
